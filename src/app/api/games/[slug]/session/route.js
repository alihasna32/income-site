import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { creditReward } from "@/lib/rewards/credit";
import { refreshProgress } from "@/services/progressService";
import { gameSessionSchema } from "@/lib/validations";
import { rewardForScore } from "@/lib/constants/games";
import { localDayRange } from "@/lib/utils/date";

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
    key: `game:${user.id}:${slug}`,
    max: 10,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Playing too fast — take a breath!" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = gameSessionSchema.safeParse({ ...body, gameSlug: slug });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid payload" },
      { status: 400 }
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
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const { data: existing } = await admin
    .from("game_sessions")
    .select("id, score, reward_coins, reward_xp")
    .eq("user_id", user.id)
    .eq("idempotency_key", parsed.data.idempotencyKey)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      duplicate: true,
      sessionId: existing.id,
      score: existing.score,
      coins: existing.reward_coins,
      xp: existing.reward_xp,
    });
  }

  const { count } = await admin
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("game_id", game.id)
    .gte("created_at", localDayRange().start);

  if (count >= game.max_plays_per_day) {
    return NextResponse.json(
      { error: `Daily limit reached for this game (${game.max_plays_per_day} plays). Come back tomorrow!` },
      { status: 429 }
    );
  }

  const { count: dailyRewardCount } = await admin
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("game_id", game.id)
    .gte("created_at", localDayRange().start)
    .gt("reward_coins", 0);

  const dailyRewardClaimed = dailyRewardCount > 0;
  const reward = dailyRewardClaimed
    ? { coins: 0, xp: 0, tier: "claimed" }
    : rewardForScore(game, parsed.data.score);

  const { data: session, error: sessionError } = await admin
    .from("game_sessions")
    .insert({
      user_id: user.id,
      game_id: game.id,
      score: parsed.data.score,
      duration_ms: parsed.data.durationMs,
      status: "completed",
      reward_coins: reward.coins,
      reward_xp: reward.xp,
      idempotency_key: parsed.data.idempotencyKey,
      metadata: parsed.data.metadata || {},
    })
    .select("id, reward_coins, reward_xp")
    .single();

  if (sessionError) {
    return NextResponse.json({ error: "Could not record session" }, { status: 500 });
  }

  if (reward.coins > 0) {
    await creditReward({
      userId: user.id,
      type: "game_reward",
      amount: reward.coins,
      xp: reward.xp,
      description: `Reward from ${game.title}`,
      idempotencyKey: `game:${session.id}`,
      metadata: { game_id: game.id, game_slug: game.slug, score: parsed.data.score },
    });
    await refreshProgress(user.id);
  }

  return NextResponse.json({
    sessionId: session.id,
    score: parsed.data.score,
    coins: reward.coins,
    xp: reward.xp,
    earned: reward.coins > 0,
    dailyRewardClaimed,
    dailyPlaysLeft: Math.max(0, game.max_plays_per_day - count - 1),
  });
}