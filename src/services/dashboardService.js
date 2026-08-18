import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { getChallengeSchedule } from "@/services/challengeScheduleService";

export async function getOverviewData(userId) {
  if (!supabaseReady()) return null;

  const admin = createAdminClient();

  const [profileRes, walletRes, streakRes, sessionsRes, winsRes, attemptsRes, scratchRes, unlockedRes, missionsRes, txRes, challengeRes] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", userId).single(),
      admin.from("wallets").select("*").eq("user_id", userId).single(),
      admin.from("streaks").select("*").eq("user_id", userId).single(),
      admin
        .from("game_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      admin
        .from("game_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gt("reward_coins", 0),
      admin
        .from("challenge_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed"),
      admin
        .from("scratch_results")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      admin
        .from("user_achievements")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("unlocked_at", "is", null),
      admin
        .from("mission_progress")
        .select("id, progress, completed, mission_id")
        .eq("user_id", userId)
        .eq("completed", false)
        .limit(4),
      admin
        .from("wallet_transactions")
        .select("id, type, amount, description, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(6),
      admin
        .from("challenges")
        .select("*")
        .eq("is_active", true),
    ]);

  return {
    profile: profileRes.data,
    wallet: walletRes.data,
    streak: streakRes.data,
    stats: {
      gamesPlayed: sessionsRes.count || 0,
      gamesWon: winsRes.count || 0,
      challengesCompleted: attemptsRes.count || 0,
      scratchCards: scratchRes.count || 0,
      achievementsUnlocked: unlockedRes.count || 0,
    },
    missions: missionsRes.data || [],
    recentTransactions: txRes.data || [],
    challenges: challengeRes.data || [],
  };
}

export async function getTodayChallenge(userId) {
  const { today } = await getChallengeSchedule(userId);
  if (!today) return null;
  return today;
}