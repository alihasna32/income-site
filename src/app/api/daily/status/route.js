import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";

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
  const today = new Date().toISOString().slice(0, 10);

  const [loginRes, streakRes, daysRes] = await Promise.all([
    admin
      .from("daily_logins")
      .select("id")
      .eq("user_id", user.id)
      .eq("claim_date", today)
      .maybeSingle(),
    admin.from("streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
    admin
      .from("daily_rewards")
      .select("day_number, reward_coins, reward_xp, label")
      .order("day_number", { ascending: true }),
  ]);

  const days = (daysRes.data || []).map((row) => ({
    day: row.day_number,
    coins: row.reward_coins,
    label: row.label,
    bonus: row.day_number === 7,
  }));

  return NextResponse.json({
    claimedToday: Boolean(loginRes.data),
    currentStreak: streakRes.data?.current_streak || 0,
    days,
  });
}