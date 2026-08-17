import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { creditReward } from "@/lib/rewards/credit";
import { generateDailyQuestion, answersMatch } from "@/lib/math/dailyQuestion";

const DEFAULT_SETTINGS = {
  reward_coins: 20,
  difficulty_weights: { easy: 60, medium: 30, hard: 10 },
};

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function getSettings() {
  if (!supabaseReady()) throw new Error("Supabase not configured");
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_settings")
    .select("value")
    .eq("key", "math_daily")
    .maybeSingle();
  const value = data?.value || {};
  return {
    rewardCoins: Number(value.reward_coins ?? DEFAULT_SETTINGS.reward_coins),
    difficultyWeights: value.difficulty_weights || DEFAULT_SETTINGS.difficulty_weights,
  };
}

async function getAttempt(admin, userId, dateKey) {
  const { data } = await admin
    .from("math_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("challenge_date", dateKey)
    .maybeSingle();
  return data;
}

async function computeStreak(admin, userId) {
  const { data } = await admin
    .from("math_attempts")
    .select("challenge_date, is_correct")
    .eq("user_id", userId)
    .order("challenge_date", { ascending: false })
    .limit(90);

  const won = new Set(
    (data || []).filter((a) => a.is_correct).map((a) => a.challenge_date)
  );

  let streak = 0;
  const cursor = new Date();
  // If today isn't decided yet, the streak is counted through yesterday.
  if (!won.has(todayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (won.has(todayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function getDailyChallengeStatus(userId) {
  const settings = await getSettings();
  const admin = createAdminClient();
  const dateKey = todayKey();

  const existing = await getAttempt(admin, userId, dateKey);
  const streak = await computeStreak(admin, userId);

  if (existing) {
    return {
      attempted: true,
      date: dateKey,
      difficulty: existing.difficulty,
      question: existing.question,
      submittedAnswer: existing.submitted_answer,
      correct: existing.is_correct,
      rewardCoins: existing.reward_coins,
      rewardCredited: existing.reward_credited,
      streak,
    };
  }

  const { difficulty, question } = generateDailyQuestion(
    userId,
    dateKey,
    settings.difficultyWeights
  );

  return {
    attempted: false,
    date: dateKey,
    difficulty,
    question,
    rewardCoins: settings.rewardCoins,
    streak,
  };
}

export async function submitDailyChallenge(userId, submittedAnswer) {
  const settings = await getSettings();
  const admin = createAdminClient();
  const dateKey = todayKey();

  const submitted = String(submittedAnswer ?? "").trim();
  if (!submitted) {
    const err = new Error("Enter an answer");
    err.code = "INVALID_ANSWER";
    throw err;
  }

  const existing = await getAttempt(admin, userId, dateKey);
  if (existing) {
    const err = new Error("You've already attempted today's challenge.");
    err.code = "ALREADY_ATTEMPTED";
    throw err;
  }

  const { difficulty, question, answer } = generateDailyQuestion(
    userId,
    dateKey,
    settings.difficultyWeights
  );
  const correct = answersMatch(submitted, answer);

  // Atomic guard: unique(user_id, challenge_date) rejects double-submits.
  const { data: attempt, error } = await admin
    .from("math_attempts")
    .insert({
      user_id: userId,
      challenge_date: dateKey,
      difficulty,
      question,
      answer,
      submitted_answer: submitted,
      is_correct: correct,
    })
    .select()
    .maybeSingle();

  if (error) {
    if (String(error.message).toLowerCase().includes("duplicate")) {
      const err = new Error("You've already attempted today's challenge.");
      err.code = "ALREADY_ATTEMPTED";
      throw err;
    }
    throw error;
  }

  let rewardCoins = 0;
  let rewardCredited = false;

  if (correct) {
    rewardCoins = settings.rewardCoins;
    const credited = await creditReward({
      userId,
      type: "math_challenge_reward",
      amount: rewardCoins,
      xp: 10,
      description: "Daily math challenge reward",
      idempotencyKey: `math-daily:${userId}:${dateKey}`,
      metadata: { challenge_date: dateKey, difficulty },
    });
    rewardCredited = Boolean(credited);

    await admin
      .from("math_attempts")
      .update({ reward_coins: rewardCoins, reward_credited: rewardCredited })
      .eq("id", attempt.id);
  }

  const streak = await computeStreak(admin, userId);

  return {
    attempted: true,
    date: dateKey,
    difficulty,
    question,
    answer: correct ? undefined : answer,
    submittedAnswer: submitted,
    correct,
    rewardCoins: correct ? rewardCoins : 0,
    rewardCredited,
    streak,
  };
}