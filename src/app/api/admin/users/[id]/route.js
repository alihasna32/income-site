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
  const [authRes, profileRes, walletRes, sessionsRes, streakRes, restrictionRes] = await Promise.all([
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
    admin
      .from("user_restrictions")
      .select("id,type,start_time,end_time,reason,created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const profile = profileRes.data;

  // Determine active restriction
  const now = new Date();
  const activeRestriction = (restrictionRes.data || []).find(
    (r) => !r.end_time || new Date(r.end_time) > now
  );

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
      incomeModeStatus: profile?.income_mode_status || "disabled",
      activeRestriction: activeRestriction
        ? {
            id: activeRestriction.id,
            type: activeRestriction.type,
            startTime: activeRestriction.start_time,
            endTime: activeRestriction.end_time,
            reason: activeRestriction.reason,
          }
        : null,
    },
  });
}
