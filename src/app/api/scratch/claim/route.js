import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { creditReward } from "@/lib/rewards/credit";
import { refreshProgress } from "@/services/progressService";
import { weightedPick } from "@/lib/utils/format";
import { localDateKey, localDayRange } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const allowed = await checkRateLimit({
    key: `scratch:${user.id}`,
    max: 3,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Slow down!" }, { status: 429 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: campaign } = await admin
    .from("scratch_campaigns")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .limit(1)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ error: "No active scratch campaign" }, { status: 404 });
  }

  const { start, end } = localDayRange();
  const { count } = await admin
    .from("scratch_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("campaign_id", campaign.id)
    .gte("created_at", start)
    .lt("created_at", end);

  if (count >= campaign.daily_limit) {
    return NextResponse.json({ error: "You've used all your cards for today" }, { status: 429 });
  }

  const pool = Array.isArray(campaign.reward_config) ? campaign.reward_config : [];
  if (!pool.length) {
    return NextResponse.json({ error: "Campaign is misconfigured" }, { status: 500 });
  }

  const prize = weightedPick(pool);

  const { data: result, error } = await admin
    .from("scratch_results")
    .insert({
      user_id: user.id,
      campaign_id: campaign.id,
      prize_label: prize.label,
      reward_coins: prize.coins,
      claim_date: localDateKey(),
    })
    .select("id, prize_label, reward_coins")
    .single();

  if (error) {
    return NextResponse.json({ error: "You've already scratched today" }, { status: 409 });
  }

  if (prize.coins > 0) {
    await creditReward({
      userId: user.id,
      type: "scratch_reward",
      amount: prize.coins,
      xp: Math.max(1, Math.round(prize.coins / 5)),
      description: `Scratch card: ${prize.label}`,
      idempotencyKey: `scratch:${result.id}`,
      metadata: { campaign_id: campaign.id, prize_label: prize.label },
    });
    await refreshProgress(user.id);
  }

  return NextResponse.json({
    resultId: result.id,
    prizeLabel: prize.label,
    coins: prize.coins,
  });
}