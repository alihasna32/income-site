import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { externalGameEligibility } from "@/lib/games/externalRewards";
import { localDayRange } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { slug } = await params;
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to earn coins from games" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const allowed = await checkRateLimit({
    key: `external-game-start:${user.id}:${slug}`,
    max: 8,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Please wait a moment before starting again" }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: game } = await admin
    .from("games")
    .select("id, embed_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!game?.embed_url) {
    return NextResponse.json({ error: "External game not found" }, { status: 404 });
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
    return NextResponse.json({ dailyRewardClaimed: true });
  }

  const findStartedSession = () =>
    admin
      .from("game_sessions")
      .select("id, created_at")
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .eq("status", "playing")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  let { data: startedSession } = await findStartedSession();

  if (!startedSession) {
    const idempotencyKey = `external-start:${user.id}:${slug}:${start.slice(0, 10)}`;
    const { data, error } = await admin
      .from("game_sessions")
      .insert({
        user_id: user.id,
        game_id: game.id,
        status: "playing",
        idempotency_key: idempotencyKey,
        metadata: { external_play: true },
      })
      .select("id, created_at")
      .maybeSingle();

    if (error) {
      const retry = await findStartedSession();
      startedSession = retry.data;
      if (!startedSession) {
        return NextResponse.json({ error: "Could not start the game timer" }, { status: 500 });
      }
    } else {
      startedSession = data;
    }
  }

  return NextResponse.json({
    dailyRewardClaimed: false,
    ...externalGameEligibility(startedSession.created_at),
  });
}
