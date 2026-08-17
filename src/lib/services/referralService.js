import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";

export async function getReferralDashboard(userId) {
  if (!supabaseReady()) {
    throw new Error("Supabase not configured");
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const [{ data: profile }, referralsRes, earnedRes, settingsRes] = await Promise.all([
    admin.from("profiles").select("referral_code").eq("id", userId).maybeSingle(),
    admin
      .from("referrals")
      .select(
        "created_at, reward_coins, status, referred_user_id, referred:profiles!referrals_referred_user_id_fkey(display_name, username, avatar_emoji, created_at)"
      )
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("referrals")
      .select("reward_coins")
      .eq("referrer_id", userId)
      .eq("status", "credited"),
    admin.from("admin_settings").select("value").eq("key", "referrals").maybeSingle(),
  ]);

  const code = profile?.referral_code || "";
  const bonusCoins = Number(settingsRes.data?.value?.bonus_coins ?? 30);
  const totalEarned = (earnedRes.data || []).reduce(
    (sum, row) => sum + (row.reward_coins || 0),
    0
  );
  const credited = (earnedRes.data || []).length;

  return {
    code,
    referralUrl: `${siteUrl}/register?ref=${code}`,
    perJoinCoins: bonusCoins,
    totalReferrals: (referralsRes.data || []).length,
    creditedReferrals: credited,
    pendingReferrals: (referralsRes.data || []).filter((r) => r.status !== "credited").length,
    totalEarned,
    history: (referralsRes.data || []).map((row) => ({
      date: row.created_at,
      coins: row.reward_coins,
      rewardStatus: row.status,
      referredUser: row.referred
        ? {
            displayName: row.referred.display_name,
            username: row.referred.username,
            avatarEmoji: row.referred.avatar_emoji,
            registeredAt: row.referred.created_at,
          }
        : null,
    })),
  };
}