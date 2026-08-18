import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { localDateKey, addDays, localDayRange } from "@/lib/utils/date";

export const SCHEDULE_HORIZON_DAYS = 3;

export function pickChallengeIndex(challenges) {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % challenges.length;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

export async function ensureChallengeSchedule({ horizon = SCHEDULE_HORIZON_DAYS } = {}) {
  if (!supabaseReady()) return;

  const admin = createAdminClient();
  const today = localDateKey();

  // 1) Promote any upcoming challenges whose date has arrived.
  await admin
    .from("challenge_schedule")
    .update({ status: "active" })
    .eq("status", "upcoming")
    .lte("scheduled_for", today);

  // 2) Load the active challenge pool.
  const { data: activeChallenges } = await admin
    .from("challenges")
    .select("id")
    .eq("is_active", true);
  if (!activeChallenges?.length) return;

  // 3) Existing schedule rows in the horizon window.
  const dates = Array.from({ length: horizon + 1 }, (_, i) =>
    localDateKey(addDays(new Date(), i))
  );
  const { data: existing } = await admin
    .from("challenge_schedule")
    .select("id, challenge_id, scheduled_for, status")
    .gte("scheduled_for", dates[0])
    .lte("scheduled_for", dates[dates.length - 1]);

  const existingMap = new Map((existing || []).map((row) => [row.scheduled_for, row]));

  // 4) Guarantee today's slot (active). Deterministic pick keeps it stable.
  const todayRow = existingMap.get(today);
  if (!todayRow) {
    const chosen = activeChallenges[pickChallengeIndex(activeChallenges)];
    const { error } = await admin.from("challenge_schedule").insert({
      challenge_id: chosen.id,
      scheduled_for: today,
      status: "active",
    });
    if (error && !error.message.includes("duplicate")) {
      console.error("[challenge-schedule]", error.message);
    } else {
      existingMap.set(today, { challenge_id: chosen.id, scheduled_for: today, status: "active" });
    }
  } else if (todayRow.status !== "active") {
    await admin.from("challenge_schedule").update({ status: "active" }).eq("id", todayRow.id);
  }

  // 5) Fill future slots, avoiding the same challenge two days in a row.
  for (let i = 1; i <= horizon; i++) {
    const date = dates[i];
    if (existingMap.has(date)) continue;

    const prevChallengeId = existingMap.get(dates[i - 1])?.challenge_id;
    const pool = activeChallenges.filter((c) => c.id !== prevChallengeId);
    const chosen = pool[randomInt(pool.length)] || activeChallenges[i % activeChallenges.length];

    const { error } = await admin.from("challenge_schedule").insert({
      challenge_id: chosen.id,
      scheduled_for: date,
      status: "upcoming",
    });
    if (error && !error.message.includes("duplicate")) {
      console.error("[challenge-schedule]", error.message);
    } else {
      existingMap.set(date, { challenge_id: chosen.id, scheduled_for: date, status: "upcoming" });
    }
  }
}

export async function getChallengeSchedule(userId) {
  if (!supabaseReady()) return { today: null, upcoming: [] };

  await ensureChallengeSchedule();

  const admin = createAdminClient();
  const today = localDateKey();

  const [todayRes, upcomingRes] = await Promise.all([
    admin
      .from("challenge_schedule")
      .select("id, status, scheduled_for, challenges(*)")
      .eq("scheduled_for", today)
      .eq("status", "active")
      .maybeSingle(),
    admin
      .from("challenge_schedule")
      .select("id, status, scheduled_for, challenges(*)")
      .gt("scheduled_for", today)
      .order("scheduled_for", { ascending: true })
      .limit(6),
  ]);

  const todayRow = todayRes.data;
  const todayChallenge = todayRow?.challenges || null;

  let solvedToday = false;
  let wasCorrect = false;
  if (todayChallenge && userId) {
    const { start } = localDayRange();
    const { data: attempt } = await admin
      .from("challenge_attempts")
      .select("score, correct_answers")
      .eq("user_id", userId)
      .eq("challenge_id", todayChallenge.id)
      .gte("created_at", start)
      .maybeSingle();
    solvedToday = Boolean(attempt);
    wasCorrect = attempt?.correct_answers > 0;
  }

  const upcoming = (upcomingRes.data || []).map((row) => ({
    ...row.challenges,
    scheduledFor: row.scheduled_for,
    scheduleStatus: row.status,
  }));

  return {
    today: todayChallenge ? { challenge: todayChallenge, solvedToday, wasCorrect } : null,
    upcoming,
  };
}