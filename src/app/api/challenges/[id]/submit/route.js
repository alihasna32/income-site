import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { creditReward } from "@/lib/rewards/credit";
import { refreshProgress } from "@/services/progressService";
import { createNotification } from "@/services/notificationsService";
import { localDayRange } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { id } = await params;

  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const allowed = await checkRateLimit({
    key: `challenge:${user.id}`,
    max: 10,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Submitting too fast — slow down!" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
  if (!answer) {
    return NextResponse.json({ error: "An answer is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: challenge } = await admin
    .from("challenges")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const { count } = await admin
    .from("challenge_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("challenge_id", challenge.id)
    .gte("created_at", localDayRange().start);

  if (count > 0) {
    return NextResponse.json(
      { error: "You've already answered today's challenge. Come back tomorrow!" },
      { status: 429 }
    );
  }

  const config = challenge.config || {};
  const expected = String(config.answer || "").trim().toLowerCase();
  const isCorrect = answer.toLowerCase() === expected;

  const { data: attempt } = await admin
    .from("challenge_attempts")
    .insert({
      user_id: user.id,
      challenge_id: challenge.id,
      type: "challenge",
      difficulty: challenge.difficulty,
      status: "completed",
      score: isCorrect ? 1 : 0,
      total_questions: 1,
      correct_answers: isCorrect ? 1 : 0,
      reward_coins: isCorrect ? challenge.reward_coins : 0,
      reward_xp: isCorrect ? challenge.reward_xp : 0,
    })
    .select("id")
    .single();

  if (isCorrect && attempt) {
    await creditReward({
      userId: user.id,
      type: "challenge_reward",
      amount: challenge.reward_coins,
      xp: challenge.reward_xp,
      description: `Daily challenge solved: ${challenge.title}`,
      idempotencyKey: `challenge:${attempt.id}`,
      metadata: { challenge_id: challenge.id },
    });
    await createNotification({
      userId: user.id,
      type: "mission",
      title: "Challenge solved!",
      message: `You solved "${challenge.title}" and earned ${challenge.reward_coins} coins.`,
    });
    await refreshProgress(user.id);
  }

  return NextResponse.json({
    correct: isCorrect,
    coins: isCorrect ? challenge.reward_coins : 0,
    xp: isCorrect ? challenge.reward_xp : 0,
    message: isCorrect
      ? "Correct! Brilliant thinking."
      : "Not quite — try again tomorrow with a fresh challenge!",
  });
}