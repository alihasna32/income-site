import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { creditReward } from "@/lib/rewards/credit";
import { refreshProgress } from "@/services/progressService";
import { mathSubmitSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const allowed = await checkRateLimit({
    key: `math:submit:${user.id}`,
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

  const parsed = mathSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: attempt, error: fetchError } = await admin
    .from("challenge_attempts")
    .select("*")
    .eq("id", parsed.data.attemptId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !attempt) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (attempt.status !== "started") {
    return NextResponse.json({ error: "This session was already submitted" }, { status: 409 });
  }

  if (attempt.expires_at && new Date(attempt.expires_at) < new Date()) {
    await admin
      .from("challenge_attempts")
      .update({ status: "expired" })
      .eq("id", attempt.id);
    return NextResponse.json({ error: "Time's up! Start a new session." }, { status: 410 });
  }

  const answers = attempt.answers || {};
  const submissionMap = {};
  for (const answer of parsed.data.answers) {
    submissionMap[answer.id] = answer.value;
  }

  const details = [];
  let correct = 0;
  for (const questionId of Object.keys(answers)) {
    const expected = answers[questionId];
    const submitted = submissionMap[questionId];
    const isCorrect =
      submitted !== undefined &&
      Number(submitted) === expected;
    if (isCorrect) correct += 1;
    details.push({
      id: questionId,
      correct: isCorrect,
      answer: expected,
    });
  }

  const { data: settings } = await admin
    .from("admin_settings")
    .select("value")
    .eq("key", "math")
    .maybeSingle();

  const perQuestion =
    settings?.value?.per_question?.[attempt.difficulty] || { coins: 3, xp: 1 };
  const coins = correct * (perQuestion.coins || 3);
  const xp = correct * (perQuestion.xp || 1);

  await admin
    .from("challenge_attempts")
    .update({
      status: "completed",
      score: correct,
      correct_answers: correct,
      reward_coins: coins,
      reward_xp: xp,
    })
    .eq("id", attempt.id);

  if (coins > 0) {
    await creditReward({
      userId: user.id,
      type: "challenge_reward",
      amount: coins,
      xp,
      description: `Math challenge (${attempt.difficulty}) — ${correct}/${attempt.total_questions} correct`,
      idempotencyKey: `math:${attempt.id}`,
      metadata: { attempt_id: attempt.id, difficulty: attempt.difficulty },
    });
    await refreshProgress(user.id);
  }

  return NextResponse.json({
    correct,
    total: attempt.total_questions,
    coins,
    xp,
    details,
  });
}