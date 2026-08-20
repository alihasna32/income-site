import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const admin = createAdminClient();
  const [authRes, profileRes, walletRes, sessionsRes, streakRes] = await Promise.all([
    admin.auth.admin.getUserById(id),
    admin.from("profiles").select("*").eq("id", id).maybeSingle(),
    admin
      .from("wallets")
      .select("coins, total_earned, total_redeemed")
      .eq("user_id", id)
      .maybeSingle(),
    admin
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id),
    admin
      .from("streaks")
      .select("current_streak, longest_streak")
      .eq("user_id", id)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;

  return NextResponse.json({
    profile: {
      id: id,
      email: authRes.data?.user?.email || "",
      phone: profile?.phone || "",
      displayName: profile?.display_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      avatarEmoji: profile?.avatar_emoji || "",
      role: profile?.role || "user",
      xp: profile?.xp || 0,
      referralCode: profile?.referral_code || "",
      createdAt: profile?.created_at || null,
      coins: walletRes.data?.coins || 0,
      totalEarned: walletRes.data?.total_earned || 0,
      totalRedeemed: walletRes.data?.total_redeemed || 0,
      gamesPlayed: sessionsRes.count || 0,
      streak: streakRes.data?.current_streak || 0,
      longestStreak: streakRes.data?.longest_streak || 0,
    },
  });
}
