import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  referrals: z
    .object({
      bonusCoins: z.number().int().min(0).max(1000),
      inviteBonusCoins: z.number().int().min(0).max(1000),
    })
    .optional(),
  withdrawals: z.object({ minAmount: z.number().int().min(1).max(1000000) }).optional(),
  mathDaily: z.object({ rewardCoins: z.number().int().min(0).max(10000) }).optional(),
  streaks: z.object({ graceDays: z.number().int().min(0).max(7) }).optional(),
  math: z
    .object({
      dailyAttempts: z.number().int().min(1).max(50),
      perQuestion: z
        .object({
          easy: z.object({ coins: z.number().int().min(0).max(100), xp: z.number().int().min(0).max(100) }),
          medium: z.object({ coins: z.number().int().min(0).max(100), xp: z.number().int().min(0).max(100) }),
          hard: z.object({ coins: z.number().int().min(0).max(100), xp: z.number().int().min(0).max(100) }),
          expert: z.object({ coins: z.number().int().min(0).max(100), xp: z.number().int().min(0).max(100) }),
        })
        .optional(),
    })
    .optional(),
  platform: z.object({ siteName: z.string().trim().min(1).max(40) }).optional(),
});

export async function GET() {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin.from("admin_settings").select("key, value");

  const settings = {
    referrals: { bonusCoins: 30, inviteBonusCoins: 60 },
    withdrawals: { minAmount: 1000 },
    mathDaily: { rewardCoins: 20 },
    streaks: { graceDays: 0 },
    math: { dailyAttempts: 5 },
    platform: { siteName: "CoinQuest" },
  };

  for (const row of data || []) {
    if (row.key === "referrals") {
      settings.referrals = {
        bonusCoins: row.value?.bonus_coins ?? 30,
        inviteBonusCoins: row.value?.invite_bonus_coins ?? 30,
      };
    }
    if (row.key === "withdrawals") {
      settings.withdrawals = {
        minAmount: row.value?.min_amount ?? 1000,
      };
    }
    if (row.key === "math_daily") {
      settings.mathDaily = {
        rewardCoins: row.value?.reward_coins ?? 20,
      };
    }
    if (row.key === "streaks" && row.value?.grace_days !== undefined) {
      settings.streaks.graceDays = row.value.grace_days;
    }
    if (row.key === "math") {
      settings.math = {
        dailyAttempts: row.value?.daily_attempts ?? 5,
        perQuestion: {
          easy: row.value?.per_question?.easy || { coins: 3, xp: 1 },
          medium: row.value?.per_question?.medium || { coins: 4, xp: 2 },
          hard: row.value?.per_question?.hard || { coins: 6, xp: 3 },
          expert: row.value?.per_question?.expert || { coins: 8, xp: 4 },
        },
      };
    }
    if (row.key === "platform") {
      settings.platform.siteName = row.value?.site_name || "CoinQuest";
    }
  }

  return NextResponse.json({ settings });
}

export async function POST(request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const upserts = [];

  if (parsed.data.referrals) {
    const current = await admin
      .from("admin_settings")
      .select("value")
      .eq("key", "referrals")
      .maybeSingle();
    const existing = current.data?.value || {};
    upserts.push(
      admin
        .from("admin_settings")
        .upsert({
          key: "referrals",
          value: {
            bonus_coins: parsed.data.referrals.bonusCoins ?? existing.bonus_coins ?? 30,
            invite_bonus_coins:
              parsed.data.referrals.inviteBonusCoins ?? existing.invite_bonus_coins ?? 30,
          },
        })
    );
  }

  if (parsed.data.withdrawals) {
    upserts.push(
      admin
        .from("admin_settings")
        .upsert({
          key: "withdrawals",
          value: { min_amount: parsed.data.withdrawals.minAmount },
        })
    );
  }

  if (parsed.data.mathDaily) {
    const current = await admin
      .from("admin_settings")
      .select("value")
      .eq("key", "math_daily")
      .maybeSingle();
    const existing = current.data?.value || {};
    upserts.push(
      admin
        .from("admin_settings")
        .upsert({
          key: "math_daily",
          value: {
            reward_coins: parsed.data.mathDaily.rewardCoins,
            difficulty_weights: existing.difficulty_weights || {
              easy: 60,
              medium: 30,
              hard: 10,
            },
          },
        })
    );
  }

  if (parsed.data.streaks) {
    upserts.push(
      admin
        .from("admin_settings")
        .upsert({
          key: "streaks",
          value: { grace_days: parsed.data.streaks.graceDays },
        })
    );
  }

  if (parsed.data.math) {
    const current = await admin.from("admin_settings").select("value").eq("key", "math").maybeSingle();
    const existing = current.data?.value || {};
    upserts.push(
      admin
        .from("admin_settings")
        .upsert({
          key: "math",
          value: {
            daily_attempts: parsed.data.math.dailyAttempts,
            question_counts: existing.question_counts,
            time_limits: existing.time_limits,
            per_question: {
              easy: parsed.data.math.perQuestion?.easy || existing.per_question?.easy,
              medium: parsed.data.math.perQuestion?.medium || existing.per_question?.medium,
              hard: parsed.data.math.perQuestion?.hard || existing.per_question?.hard,
              expert: parsed.data.math.perQuestion?.expert || existing.per_question?.expert,
            },
          },
        })
    );
  }

  if (parsed.data.platform) {
    upserts.push(
      admin
        .from("admin_settings")
        .upsert({
          key: "platform",
          value: { site_name: parsed.data.platform.siteName },
        })
    );
  }

  const results = await Promise.all(upserts);
  const failed = results.find((r) => r.error);
  if (failed) {
    return NextResponse.json({ error: "Could not save settings" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}