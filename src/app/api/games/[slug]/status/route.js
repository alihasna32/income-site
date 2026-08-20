import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { externalGameEligibility } from "@/lib/games/externalRewards";
import { localDayRange } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug } = await params;

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: game } = await admin
    .from("games")
    .select("id, max_plays_per_day, embed_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const { start, end } = localDayRange();
  const [playsRes, rewardRes, startedRes] = await Promise.all([
    admin
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .gte("created_at", start)
      .lt("created_at", end),
    admin
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("game_id", game.id)
      .gte("created_at", start)
      .lt("created_at", end)
      .gt("reward_coins", 0),
    game.embed_url
      ? admin
          .from("game_sessions")
          .select("created_at")
          .eq("user_id", user.id)
          .eq("game_id", game.id)
          .eq("status", "playing")
          .gte("created_at", start)
          .lt("created_at", end)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const count = playsRes.count || 0;
  const rewardCount = rewardRes.count || 0;

  const externalReward = game.embed_url
    ? externalGameEligibility(startedRes.data?.created_at)
    : null;

  return NextResponse.json({
    playsToday: count,
    maxPlays: game.max_plays_per_day,
    playsLeft: Math.max(0, game.max_plays_per_day - count),
    dailyRewardClaimed: rewardCount > 0,
    ...(externalReward || {}),
  });
}
