import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { creditReward } from "@/lib/rewards/credit";
import { createNotification } from "@/services/notificationsService";
import { refreshProgress } from "@/services/progressService";

export const dynamic = "force-dynamic";

function localDateKey(date = new Date()) {
  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateKey(d);
}

export async function POST() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const allowed = await checkRateLimit({
    key: `daily:${user.id}`,
    max: 3,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Slow down!" }, { status: 429 });
  }

  const admin = createAdminClient();
  const today = localDateKey();

  const existing = await admin
    .from("daily_logins")
    .select("id")
    .eq("user_id", user.id)
    .eq("claim_date", today)
    .maybeSingle();

  if (existing.data) {
    return NextResponse.json({ error: "Already claimed today" }, { status: 409 });
  }

  const [streakRes, settingsRes, daysRes] = await Promise.all([
    admin.from("streaks").select("*").eq("user_id", user.id).maybeSingle(),
    admin.from("admin_settings").select("value").eq("key", "streaks").maybeSingle(),
    admin
      .from("daily_rewards")
      .select("day_number, reward_coins, reward_xp, label")
      .order("day_number", { ascending: true }),
  ]);

  const graceDays = settingsRes.data?.value?.grace_days || 0;
  const streakRow = streakRes.data || { current_streak: 0, longest_streak: 0, last_claim_date: null };

  let newStreak = 1;
  if (streakRow.last_claim_date === yesterdayKey()) {
    newStreak = streakRow.current_streak + 1;
  } else if (streakRow.last_claim_date) {
    const gap =
      (new Date(today) - new Date(streakRow.last_claim_date)) / 86400000;
    if (gap <= graceDays + 1) {
      newStreak = streakRow.current_streak + 1;
    }
  }

  const dayInStreak = ((newStreak - 1) % 7) + 1;
  const reward = (daysRes.data || []).find((d) => d.day_number === dayInStreak) || {
    reward_coins: 5,
    reward_xp: 2,
  };

  const { data: login, error: loginError } = await admin
    .from("daily_logins")
    .insert({
      user_id: user.id,
      claim_date: today,
      day_in_streak: dayInStreak,
      reward_coins: reward.reward_coins,
    })
    .select("id")
    .single();

  if (loginError) {
    return NextResponse.json({ error: "Already claimed today" }, { status: 409 });
  }

  await admin
    .from("streaks")
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(streakRow.longest_streak, newStreak),
      last_claim_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  await creditReward({
    userId: user.id,
    type: "daily_reward",
    amount: reward.reward_coins,
    xp: reward.reward_xp,
    description: `Daily reward — day ${newStreak} of your streak`,
    idempotencyKey: `daily:${user.id}:${today}`,
    metadata: { streak: newStreak, day_in_streak: dayInStreak },
  });

  if (newStreak % 7 === 0) {
    await createNotification({
      userId: user.id,
      type: "streak",
      title: `${newStreak}-day streak!`,
      message: `Incredible — a ${newStreak}-day streak! Keep it going.`,
    });
  }

  await refreshProgress(user.id);

  return NextResponse.json({
    claimed: true,
    coins: reward.reward_coins,
    xp: reward.reward_xp,
    dayInStreak,
    currentStreak: newStreak,
  });
}