import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { creditReward } from "@/lib/rewards/credit";
import { refreshProgress } from "@/services/progressService";
import { weightedPick } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { slug } = await params;

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const allowed = await checkRateLimit({
    key: `luck:${user.id}:${slug}`,
    max: 5,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Playing too fast — take a breath!" }, { status: 429 });
  }

  const admin = createAdminClient();

  const { data: game } = await admin
    .from("games")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const config = game.config || {};
  if (!config.luck || !Array.isArray(config.outcomes) || !config.outcomes.length) {
    return NextResponse.json({ error: "Game not configured for luck" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { count } = await admin
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("game_id", game.id)
    .eq("created_at::date", today);

  if (count >= game.max_plays_per_day) {
    return NextResponse.json(
      { error: `Daily limit reached for this game (${game.max_plays_per_day} plays). Come back tomorrow!` },
      { status: 429 }
    );
  }

  const dailyRewardOnce = config.dailyRewardOnce !== false;
  const { count: dailyRewardCount } = await admin
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("game_id", game.id)
    .eq("created_at::date", today)
    .gt("reward_coins", 0);

  const dailyRewardClaimed = dailyRewardOnce && dailyRewardCount > 0;
  const outcome = weightedPick(config.outcomes);
  const coins = dailyRewardClaimed ? 0 : outcome.coins;
  const xp = dailyRewardClaimed ? 0 : Math.max(1, Math.round(outcome.coins / 5));

  const { data: session, error: sessionError } = await admin
    .from("game_sessions")
    .insert({
      user_id: user.id,
      game_id: game.id,
      score: coins,
      status: "completed",
      reward_coins: coins,
      reward_xp: xp,
      idempotency_key: `luck:${user.id}:${slug}:${today}:${crypto.randomUUID()}`,
      metadata: { luck: true, prize_label: outcome.label },
    })
    .select("id, reward_coins, reward_xp")
    .single();

  if (sessionError) {
    return NextResponse.json({ error: "Could not record session" }, { status: 500 });
  }

  if (coins > 0) {
    await creditReward({
      userId: user.id,
      type: "game_reward",
      amount: coins,
      xp,
      description: `Lucky ${game.title}: ${outcome.label}`,
      idempotencyKey: `game:${session.id}`,
      metadata: { game_id: game.id, game_slug: game.slug, prize_label: outcome.label },
    });

    await refreshProgress(user.id);
  }

  return NextResponse.json({
    sessionId: session.id,
    prizeLabel: outcome.label,
    score: coins,
    coins,
    xp,
    earned: coins > 0,
    dailyRewardClaimed,
    luck: true,
    dailyPlaysLeft: Math.max(0, game.max_plays_per_day - count - 1),
  });
}