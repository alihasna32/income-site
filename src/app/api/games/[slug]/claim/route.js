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

  const coins = Math.max(1, game.reward_coins || 10);
  const xp = Math.max(1, Math.round(coins / 2));

  const { data: session, error: sessionError } = await admin
    .from("game_sessions")
    .insert({
      user_id: user.id,
      game_id: game.id,
      score: 0,
      status: "completed",
      reward_coins: coins,
      reward_xp: xp,
      idempotency_key: `claim:${user.id}:${slug}:${start}`,
      metadata: { claim: true },
    })
    .select("id")
    .single();

  if (sessionError) {
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