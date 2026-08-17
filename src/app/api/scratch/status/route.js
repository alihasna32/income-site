import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { weightedPick } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
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
    return NextResponse.json({ campaign: null, result: null });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: result } = await admin
    .from("scratch_results")
    .select("prize_label, reward_coins, created_at")
    .eq("user_id", user.id)
    .eq("campaign_id", campaign.id)
    .eq("created_at::date", today)
    .maybeSingle();

  const { data: todayCount } = await admin
    .from("scratch_results")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("campaign_id", campaign.id)
    .eq("created_at::date", today);

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      dailyLimit: campaign.daily_limit,
    },
    result,
    usedToday: (todayCount?.count || 0) >= campaign.daily_limit,
  });
}