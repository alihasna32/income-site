"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  Coins,
  Flag,
  Loader2,
  Play,
  Sparkles,
  Timer,
  Trophy,
  XCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { cn } from "@/lib/utils/cn";

const DIFFICULTIES = [
  { key: "easy", label: "Easy", color: "badge-success", perQuestion: 3 },
  { key: "medium", label: "Medium", color: "badge-warning", perQuestion: 4 },
  { key: "hard", label: "Hard", color: "badge-error", perQuestion: 6 },
  { key: "expert", label: "Expert", color: "badge-neutral", perQuestion: 8 },
];

export function MathChallengeGame() {
  const { toast } = useToast();
  const { refresh } = useWallet();

  const [phase, setPhase] = useState("pick"); // pick | playing | submitting | done
  const [difficulty, setDifficulty] = useState("easy");
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);
  const submitRef = useRef(false);
  const timerRef = useRef(null);

  const submitAnswers = useCallback(
    async (force = false) => {
      if (submitRef.current) return;
      submitRef.current = true;
      clearInterval(timerRef.current);

      const payload = Object.entries(answers).map(([id, value]) => ({ id, value }));
      setPhase("submitting");

      try {
        const res = await fetch("/api/challenges/math/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId: session.attemptId, answers: payload }),
        });
        const data = await res.json();

        if (res.ok) {
          setResult(data);
          setPhase("done");
          if (data.coins > 0) {
            toast(`+${data.coins} coins earned!`, "success");
            refresh();
          } else {
            toast("No reward this time — try again!", "info");
          }
        } else {
          toast(data.error || "Could not submit", "error");
          setPhase("pick");
        }
      } catch {
        toast("Could not submit", "error");
        setPhase("pick");
      }
    },
    [answers, refresh, session, toast]
  );

  const start = async (key) => {
    setDifficulty(key);
    try {
      const res = await fetch("/api/challenges/math/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: key }),
      });
      const data = await res.json();

      if (res.ok) {
        setSession(data);
        setAnswers({});
        submitRef.current = false;
        setTimeLeft(data.timeLimitSeconds);
        setPhase("playing");
      } else {
        toast(data.error || "Could not start", "error");
        if (res.status === 429) setPhase("pick");
      }
    } catch {
      toast("Could not start", "error");
    }
  };

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitAnswers(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, submitAnswers]);

  const setAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const answeredCount = session ? Object.keys(answers).length : 0;

  if (phase === "pick") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-plum">Math Challenge</h1>
          <p className="mt-1 text-sm text-muted">
            Timed arithmetic, percentages, sequences and logic. Answers are
            validated on the server — no shortcuts.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.key}
              onClick={() => start(d.key)}
              className="card bg-base-100 border border-base-300 p-5 text-left shadow-card hover:shadow-soft hover:-translate-y-0.5 transition-all group"
            >
              <span className={cn("badge badge-sm", d.color)}>{d.label}</span>
              <p className="mt-3 text-sm font-semibold text-plum group-hover:text-secondary">
                {d.key === "easy" && "Addition, subtraction, simple multiplication"}
                {d.key === "medium" && "Bigger numbers, division, percentages"}
                {d.key === "hard" && "Sequences, squares, tricky percentages"}
                {d.key === "expert" && "Logic, powers, mixed rapid-fire math"}
              </p>
              <span className="coin text-gold-dark text-sm mt-3">
                <Coins className="size-4" /> up to {d.perQuestion * 15} coins
              </span>
            </button>
          ))}
        </div>

        <div className="card bg-base-200 border border-base-300 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-plum">
            <Timer className="size-4 text-secondary" /> Good to know
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>• Each difficulty has a fixed time limit — answer as many as you can.</li>
            <li>• Every correct answer earns coins and XP.</li>
            <li>• You get a fair number of scoring sessions per day.</li>
            <li>• Questions are generated and validated entirely on the server.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (phase === "playing" && session) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                clearInterval(timerRef.current);
                setPhase("pick");
              }}
              className="btn btn-ghost btn-sm"
              aria-label="Quit challenge"
            >
              <ArrowLeft className="size-4" /> Quit
            </button>
            <span className="badge badge-lg capitalize bg-plum text-neutral-content">
              {difficulty}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "font-mono text-lg font-bold",
                timeLeft <= 10 ? "text-error animate-pulse" : "text-plum"
              )}
              aria-label={`${timeLeft} seconds remaining`}
            >
              ⏱ {timeLeft}s
            </span>
            <span className="badge badge-lg bg-base-200 text-muted">
              {answeredCount}/{session.questions.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {session.questions.map((q, i) => (
            <div
              key={q.id}
              className={cn(
                "card bg-base-100 border p-4 shadow-card",
                answers[q.id] !== undefined ? "border-success/50" : "border-base-300"
              )}
            >
              <p className="text-xs text-muted font-semibold">Q{i + 1}</p>
              <p className="mt-1 text-sm font-semibold text-plum">{q.text}</p>
              <input
                type="number"
                inputMode="decimal"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, Number(e.target.value))}
                className="input input-bordered input-sm mt-3 w-full"
                placeholder="Your answer"
                aria-label={`Answer for question ${i + 1}`}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sticky bottom-20 lg:bottom-4">
          <button onClick={() => submitAnswers()} className="btn btn-primary btn-lg shadow-card">
            <Flag className="size-5" /> Submit answers ({answeredCount})
          </button>
        </div>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-secondary" />
        <p className="text-sm font-semibold text-muted">Validating your answers…</p>
      </div>
    );
  }

  if (phase === "done" && result) {
    const correctRate = Math.round((result.correct / result.total) * 100);
    return (
      <div className="space-y-6">
        <div className="card bg-base-100 border border-base-300 shadow-card p-8 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum shadow-glow animate-pop-in">
            <Trophy className="size-8" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-plum">
            {result.correct === result.total
              ? "Flawless! Perfect score!"
              : result.correct >= result.total * 0.6
              ? "Great job!"
              : "Good effort!"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            You solved {result.correct} of {result.total} questions ({correctRate}%)
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {result.coins > 0 && (
              <div className="flex items-center gap-2 rounded-box bg-primary/15 px-4 py-2.5">
                <Coins className="size-5 text-gold-dark" />
                <span className="text-lg font-extrabold text-plum">+{result.coins} coins</span>
              </div>
            )}
            {result.xp > 0 && (
              <div className="flex items-center gap-2 rounded-box bg-secondary/15 px-4 py-2.5">
                <Sparkles className="size-5 text-secondary" />
                <span className="text-lg font-extrabold text-plum">+{result.xp} XP</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-2">
            <button onClick={() => start(difficulty)} className="btn btn-primary">
              <Play className="size-4" /> Play again
            </button>
            <button
              onClick={() => {
                setPhase("pick");
                setResult(null);
              }}
              className="btn btn-outline"
            >
              <Brain className="size-4" /> Change difficulty
            </button>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
          <h3 className="px-5 py-4 font-bold text-plum border-b border-base-200">
            Review your answers
          </h3>
          <div className="divide-y divide-base-200">
            {result.details.map((detail, i) => (
              <div key={detail.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                {detail.correct ? (
                  <CheckCircle2 className="size-5 text-success shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="size-5 text-error shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-plum">{session?.questions[i]?.text}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Your answer: {answers[detail.id] ?? "—"} · Correct: {detail.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted">
          <Link href="/dashboard/missions" className="underline hover:text-secondary">
            Missions
          </Link>{" "}
          also track your math challenges automatically.
        </p>
      </div>
    );
  }

  return null;
}