import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { creditReward } from "@/lib/rewards/credit";
import { createNotification } from "@/services/notificationsService";
import { levelForXp, getDbLevels } from "@/services/levelsService";

async function computeStats(userId) {
  const admin = createAdminClient();
  const [gamesRes, winsRes, challengeRes, mathRes, scratchRes, loginsRes, walletRes, streakRes, referralsRes] =
    await Promise.all([
      admin.from("game_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId),
      admin.from("game_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).gt("reward_coins", 0),
      admin.from("challenge_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("type", "challenge").eq("status", "completed"),
      admin.from("challenge_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("type", "math").eq("status", "completed"),
      admin.from("scratch_results").select("id", { count: "exact", head: true }).eq("user_id", userId),
      admin.from("daily_logins").select("id", { count: "exact", head: true }).eq("user_id", userId),
      admin.from("wallets").select("total_earned").eq("user_id", userId).single(),
      admin.from("streaks").select("current_streak").eq("user_id", userId).single(),
      admin.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", userId).eq("status", "credited"),
    ]);

  const profileRes = await admin
    .from("profiles")
    .select("xp")
    .eq("id", userId)
    .single();

  return {
    games_played: gamesRes.count || 0,
    games_won: winsRes.count || 0,
    challenges_completed: challengeRes.count || 0,
    math_challenges: mathRes.count || 0,
    scratch_cards: scratchRes.count || 0,
    login_days: loginsRes.count || 0,
    coins_earned: walletRes.data?.total_earned || 0,
    streak_days: streakRes.data?.current_streak || 0,
    referrals: referralsRes.count || 0,
    xp: profileRes.data?.xp || 0,
  };
}

export async function refreshProgress(userId) {
  if (!supabaseReady()) return;

  const admin = createAdminClient();
  const stats = await computeStats(userId);

  const [missionsRes, achievementsRes] = await Promise.all([
    admin.from("missions").select("*").eq("is_active", true),
    admin.from("achievements").select("*"),
  ]);

  const missions = missionsRes.data || [];
  const achievements = achievementsRes.data || [];
  if (!missions.length && !achievements.length) return;

  const [progressRes, userAchRes] = await Promise.all([
    admin
      .from("mission_progress")
      .select("*")
      .in(
        "mission_id",
        missions.map((m) => m.id)
      )
      .eq("user_id", userId),
    admin
      .from("user_achievements")
      .select("*")
      .in(
        "achievement_id",
        achievements.map((a) => a.id)
      )
      .eq("user_id", userId),
  ]);

  const progressMap = new Map(
    (progressRes.data || []).map((row) => [row.mission_id, row])
  );
  const achMap = new Map(
    (userAchRes.data || []).map((row) => [row.achievement_id, row])
  );

  for (const mission of missions) {
    const current = progressMap.get(mission.id);
    if (!current || current.completed) continue;

    const value = stats[mission.type] || 0;
    const progress = Math.min(value, mission.target);

    if (progress === current.progress) continue;

    await admin
      .from("mission_progress")
      .update({
        progress,
        completed: progress >= mission.target,
        completed_at: progress >= mission.target ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);

    if (progress >= mission.target) {
      await creditReward({
        userId,
        type: "mission_reward",
        amount: mission.reward_coins,
        xp: mission.reward_xp,
        description: `Mission completed: ${mission.title}`,
        idempotencyKey: `mission:${mission.id}`,
        metadata: { mission_id: mission.id, mission_slug: mission.slug },
      });
      await createNotification({
        userId,
        type: "mission",
        title: "Mission Complete!",
        message: `You completed "${mission.title}" and earned ${mission.reward_coins} coins.`,
      });
    }
  }

  const levels = await getDbLevels();
  const currentLevel = levelForXp(stats.xp, levels).level;

  for (const achievement of achievements) {
    const current = achMap.get(achievement.id);
    if (!current || current.unlocked_at) continue;

    let value = stats[achievement.criteria_type] || 0;
    if (achievement.criteria_type === "level_reached") {
      value = currentLevel;
    }

    if (value >= achievement.criteria_value) {
      const unlockedAt = new Date().toISOString();
      await admin
        .from("user_achievements")
        .update({ progress: achievement.criteria_value, unlocked_at: unlockedAt, updated_at: unlockedAt })
        .eq("user_id", userId)
        .eq("achievement_id", achievement.id);

      if (achievement.reward_coins > 0 || achievement.reward_xp > 0) {
        await creditReward({
          userId,
          type: "challenge_reward",
          amount: achievement.reward_coins,
          xp: achievement.reward_xp,
          description: `Achievement unlocked: ${achievement.title}`,
          idempotencyKey: `achievement:${achievement.id}`,
          metadata: { achievement_id: achievement.id, achievement_slug: achievement.slug },
        });
      }
      await createNotification({
        userId,
        type: "achievement",
        title: "Achievement Unlocked!",
        message: `You unlocked "${achievement.title}". Well done!`,
      });
    } else if (value !== current.progress) {
      await admin
        .from("user_achievements")
        .update({ progress: value, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("achievement_id", achievement.id);
    }
  }
}