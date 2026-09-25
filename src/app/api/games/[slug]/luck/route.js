import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { creditReward } from "@/lib/rewards/credit";
import { refreshProgress } from "@/services/progressService";
import { localDayRange } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { slug } = await params;

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const allowed = await checkRateLimit({
    key: `luck:${user.id}:${slug}`,
    max: 5,
    windowSeconds: 60,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Playing too fast — take a breath!" },
      { status: 429 }
    );
  }

  const admin = createAdminClient();

  const { data: game } = await admin
    .from("games")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!game) {
    return NextResponse.json(
      { error: "Game not found" },
      { status: 404 }
    );
  }

  const config = game.config || {};

  if (
    !config.luck ||
    !Array.isArray(config.outcomes) ||
    !config.outcomes.length
  ) {
    return NextResponse.json(
      { error: "Game not configured for luck" },
      { status: 400 }
    );
  }

  const isLifetimeLimit = config.lifetimeLimit === true;

  // Get the current local-day range.
  // This keeps the daily limit consistent with the rest of the app.
  const { start, end } = localDayRange();

  // Count plays.
  // Lifetime games count all sessions.
  // Normal games count only today's sessions.
  let countQuery = admin
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("game_id", game.id);

  if (!isLifetimeLimit) {
    countQuery = countQuery
      .gte("created_at", start)
      .lt("created_at", end);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    console.error("Failed to count game plays:", countError);

    return NextResponse.json(
      { error: "Could not check game limit" },
      { status: 500 }
    );
  }

  const playsCount = count || 0;

  // Enforce the daily/lifetime play limit.
  if (playsCount >= game.max_plays_per_day) {
    const message = isLifetimeLimit
      ? "You have used all 3 spins."
      : `Daily limit reached for this game (${game.max_plays_per_day} plays). Come back tomorrow!`;

    return NextResponse.json(
      {
        error: message,
        dailyPlaysLeft: 0,
      },
      { status: 429 }
    );
  }

  const dailyRewardOnce = config.dailyRewardOnce !== false;

  // Check whether the user has already received today's reward.
  let dailyRewardQuery = admin
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("game_id", game.id)
    .gt("reward_coins", 0);

  dailyRewardQuery = dailyRewardQuery
    .gte("created_at", start)
    .lt("created_at", end);

  const { count: dailyRewardCount, error: rewardCountError } =
    await dailyRewardQuery;

  if (rewardCountError) {
    console.error(
      "Failed to check daily reward:",
      rewardCountError
    );

    return NextResponse.json(
      { error: "Could not check daily reward" },
      { status: 500 }
    );
  }

  const dailyRewardClaimed =
    dailyRewardOnce && (dailyRewardCount || 0) > 0;

  // Pick a random outcome based on weights.
  const totalWeight = config.outcomes.reduce(
    (sum, outcome) => sum + (outcome.weight || 1),
    0
  );

  let roll = Math.random() * totalWeight;
  let segment = 0;

  for (let i = 0; i < config.outcomes.length; i++) {
    roll -= config.outcomes[i].weight || 1;

    if (roll <= 0) {
      segment = i;
      break;
    }
  }

  const outcome = config.outcomes[segment];

  // Only the first successful reward of the day gives coins.
  const coins = dailyRewardClaimed ? 0 : outcome.coins;

  const xp = dailyRewardClaimed
    ? 0
    : Math.max(1, Math.round(outcome.coins / 5));

  const idempotencyKey = isLifetimeLimit
    ? `luck:${user.id}:${slug}:${crypto.randomUUID()}`
    : `luck:${user.id}:${slug}:${start}:${crypto.randomUUID()}`;

  // Record the spin.
  const { data: session, error: sessionError } = await admin
    .from("game_sessions")
    .insert({
      user_id: user.id,
      game_id: game.id,
      score: coins,
      status: "completed",
      reward_coins: coins,
      reward_xp: xp,
      idempotency_key: idempotencyKey,
      metadata: {
        luck: true,
        prize_label: outcome.label,
      },
    })
    .select("id, reward_coins, reward_xp")
    .single();

  if (sessionError) {
    console.error("Failed to record spin:", sessionError);

    return NextResponse.json(
      { error: "Could not record session" },
      { status: 500 }
    );
  }

  // Credit the reward.
  if (coins > 0) {
    await creditReward({
      userId: user.id,
      type: "game_reward",
      amount: coins,
      xp,
      description: `Lucky ${game.title}: ${outcome.label}`,
      idempotencyKey: `game:${session.id}`,
      metadata: {
        game_id: game.id,
        game_slug: game.slug,
        prize_label: outcome.label,
      },
    });

    await refreshProgress(user.id);
  }

  return NextResponse.json({
    sessionId: session.id,
    prizeLabel: outcome.label,
    segment,
    score: coins,
    coins,
    xp,
    earned: coins > 0,
    dailyRewardClaimed,
    luck: true,
    dailyPlaysLeft: Math.max(
      0,
      game.max_plays_per_day - playsCount - 1
    ),
  });
}