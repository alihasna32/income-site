import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { mathStartSchema } from "@/lib/validations";
import { generateMathQuestions } from "@/lib/games/mathQuestions";

export const dynamic = "force-dynamic";

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function POST(request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const allowed = await checkRateLimit({
    key: `math:${user.id}`,
    max: 6,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Starting too many sessions — slow down!" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = mathStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid difficulty" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("admin_settings")
    .select("value")
    .eq("key", "math")
    .maybeSingle();

  const config = settings?.value || {};
  const dailyAttempts = config.daily_attempts || 5;
  const counts = config.question_counts || { easy: 8, medium: 10, hard: 12, expert: 15 };
  const limits = config.time_limits || { easy: 90, medium: 120, hard: 180, expert: 240 };

  const { count } = await admin
    .from("challenge_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "math")
    .eq("status", "completed")
    .gte("created_at", todayStart());

  if (count >= dailyAttempts) {
    return NextResponse.json(
      { error: `Daily math limit reached (${dailyAttempts} sessions). Come back tomorrow!` },
      { status: 429 }
    );
  }

  const questionCount = counts[parsed.data.difficulty] || 8;
  const questions = generateMathQuestions(parsed.data.difficulty, questionCount);

  const answers = {};
  for (const q of questions) {
    answers[q.id] = q.answer;
  }

  const expiresAt = new Date(
    Date.now() + (limits[parsed.data.difficulty] || 120) * 1000
  ).toISOString();

  const { data: attempt, error } = await admin
    .from("challenge_attempts")
    .insert({
      user_id: user.id,
      type: "math",
      difficulty: parsed.data.difficulty,
      status: "started",
      total_questions: questionCount,
      answers,
      expires_at: expiresAt,
      metadata: {
        questions: questions.map((q) => ({ id: q.id, text: q.text, type: q.type })),
      },
    })
    .select("id, difficulty, total_questions, expires_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not start session" }, { status: 500 });
  }

  return NextResponse.json({
    attemptId: attempt.id,
    difficulty: attempt.difficulty,
    questions: questions.map((q) => ({ id: q.id, text: q.text, type: q.type })),
    timeLimitSeconds: limits[parsed.data.difficulty] || 120,
    expiresAt: attempt.expires_at,
    attemptsLeftToday: dailyAttempts - count - 1,
  });
}