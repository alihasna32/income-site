import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { creditReward } from "@/lib/rewards/credit";
import { refreshProgress } from "@/services/progressService";
import {
  EXTERNAL_GAME_MIN_PLAY_MS,
  externalGameEligibility,
} from "@/lib/games/externalRewards";
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
    key: `claim:${user.id}:${slug}`,
    max: 3,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Claiming too fast — take a breath!" }, { status: 429 });
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

  if (!game.embed_url) {
    return NextResponse.json({ error: "No daily reward for this game" }, { status: 400 });
  }

  const { start, end } = localDayRange();
  const { count: claimedToday } = await admin
    .from("game_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("game_id", game.id)
    .gte("created_at", start)
    .lt("created_at", end)
    .gt("reward_coins", 0);

  if (claimedToday > 0) {
    return NextResponse.json({ alreadyClaimed: true, coins: 0, earned: false });
  }

  const { data: startedSession } = await admin
    .from("game_sessions")
    .select("id, created_at, metadata")
    .eq("user_id", user.id)
    .eq("game_id", game.id)
    .eq("status", "playing")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!startedSession) {
    return NextResponse.json(
      { error: "Tap Play now and play for at least one minute before claiming." },
      { status: 400 }
    );
  }

  const eligibility = externalGameEligibility(startedSession.created_at);
  if (!eligibility.canClaim) {
    return NextResponse.json(
      {
        error: "Keep playing until the one-minute timer ends.",
        ...eligibility,
      },
      { status: 400 }
    );
  }

  const coins = Math.max(1, game.reward_coins || 10);
  const xp = Math.max(1, Math.round(coins / 2));

  const durationMs = Math.max(
    EXTERNAL_GAME_MIN_PLAY_MS,
    Date.now() - new Date(startedSession.created_at).getTime()
  );
  const { data: session, error: sessionError } = await admin
    .from("game_sessions")
    .update({
      status: "completed",
      reward_coins: coins,
      reward_xp: xp,
      duration_ms: durationMs,
      metadata: {
        ...(startedSession.metadata || {}),
        claim: true,
        claimed_at: new Date().toISOString(),
      },
    })
    .eq("id", startedSession.id)
    .eq("status", "playing")
    .eq("reward_coins", 0)
    .select("id")
    .maybeSingle();

  if (sessionError || !session) {
    const { count: concurrentClaim } = await admin
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .gte("created_at", start)
      .lt("created_at", end)
      .gt("reward_coins", 0);

    if (concurrentClaim > 0) {
      return NextResponse.json({ alreadyClaimed: true, coins: 0, earned: false });
    }
    return NextResponse.json({ error: "Could not claim your reward" }, { status: 500 });
  }

  await creditReward({
    userId: user.id,
    type: "game_reward",
    amount: coins,
    xp,
    description: `Daily reward from ${game.title}`,
    idempotencyKey: `game:${session.id}`,
    metadata: { game_id: game.id, game_slug: game.slug, claim: true },
  });

  await refreshProgress(user.id);

  return NextResponse.json({
    alreadyClaimed: false,
    coins,
    xp,
    earned: true,
  });
}
