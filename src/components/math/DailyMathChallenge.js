"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Brain, CheckCircle2, Flame, Loader2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { cn } from "@/lib/utils/cn";

const TIME_LIMIT_SECONDS = 60;

const DIFFICULTY_TONE = {
  easy: "bg-success/15 text-success",
  medium: "bg-secondary/15 text-secondary",
  hard: "bg-error/15 text-error",
};

export default function DailyMathChallenge() {
  const { toast } = useToast();
  const { refresh: refreshWallet } = useWallet();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIME_LIMIT_SECONDS);
  const [timesUp, setTimesUp] = useState(false);
  const answerRef = useRef("");
  const submittedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/math/daily", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setStatus(data);
      } else {
        setLoadError(data?.error || "Could not load today's challenge");
      }
    } catch {
      setLoadError("Could not load today's challenge");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (status?.attempted || !status?.question || timesUp) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          if (answerRef.current.trim()) {
            submitNow();
          } else {
            setTimesUp(true);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.attempted, status?.question, timesUp]);

  const submitNow = useCallback(async () => {
    if (submitting || submittedRef.current || timesUp || !status?.question) return;
    const value = answerRef.current.trim();
    if (!value) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/math/daily/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: value }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(data);
        refreshWallet();
        if (data.correct) {
          toast(`Correct! +${data.rewardCoins} coins`, "success");
        }
      } else {
        submittedRef.current = false;
        toast(data.error || "Could not submit", "error");
      }
    } catch {
      submittedRef.current = false;
      toast("Could not submit your answer", "error");
    } finally {
      setSubmitting(false);
    }
  }, [status, submitting, timesUp, toast, refreshWallet]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="size-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Daily math challenge"
          description="One question. One attempt per day. Win coins and keep your streak alive."
        />
        <div className="card bg-base-100 border border-base-300 shadow-card p-8 text-center">
          <XCircle className="mx-auto size-10 text-error" />
          <h2 className="mt-4 text-xl font-extrabold text-plum">Couldn&apos;t load today&apos;s challenge</h2>
          <p className="mt-2 text-sm text-muted">{loadError}</p>
          <button onClick={load} className="btn btn-primary mt-6">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const attempted = status?.attempted;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Daily math challenge"
        description="One question. One attempt per day. Win coins and keep your streak alive."
      />

      <div className="flex items-center justify-between gap-4 rounded-field bg-base-200 p-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <CalendarToday />
          <span>Resets every day at midnight</span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-plum px-4 py-1.5 text-neutral-content shadow-card">
          <Flame className="size-4 text-gold" />
          <span className="text-sm font-bold">{status?.streak || 0}</span>
          <span className="text-xs opacity-80">day streak</span>
        </div>
      </div>

      {!attempted ? (
        <div className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-plum via-[#5d4065] to-plum relative flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_50%,#F2C230_0,transparent_40%),radial-gradient(circle_at_80%_50%,#F2921D_0,transparent_40%)]" />
            <Brain className="size-9 text-gold relative" />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("badge badge-sm capitalize", DIFFICULTY_TONE[status?.difficulty] || DIFFICULTY_TONE.easy)}>
                {status?.difficulty || "easy"}
              </span>
              <span className="badge badge-sm bg-gold/15 text-gold-dark font-bold">
                +{status?.rewardCoins} coins
              </span>
              <span className="badge badge-sm bg-base-200 text-muted">
                {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")} left
              </span>
            </div>

            <h2 className="mt-5 text-xl sm:text-2xl font-extrabold text-plum leading-snug">
              {status?.question}
            </h2>

            <div className="mt-6 flex max-w-md items-center gap-3">
              <input
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  answerRef.current = e.target.value;
                }}
                onKeyDown={(e) => e.key === "Enter" && submitNow()}
                inputMode="decimal"
                autoFocus
                disabled={timesUp}
                className="input input-bordered w-full text-lg font-bold text-plum disabled:cursor-not-allowed"
                placeholder="Your answer…"
                aria-label="Your answer"
              />
              <button
                onClick={submitNow}
                disabled={submitting || timesUp || !answer.trim()}
                className="btn btn-primary shrink-0"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                Submit
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">
              {timesUp
                ? "Time's up — this question has expired. Come back tomorrow for a new one."
                : "One official attempt per day — your answer is checked on the server, so no peeking."}
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 border border-base-300 shadow-card p-6 sm:p-8 text-center">
          {status.correct ? (
            <>
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-8" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold text-plum">Correct!</h2>
              <p className="mt-2 text-sm text-muted">
                You earned{" "}
                <span className="font-bold text-gold-dark">{status.rewardCoins} coins</span> and your
                streak is now{" "}
                <span className="font-bold text-plum">{status.streak}</span> day
                {status.streak === 1 ? "" : "s"}.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-error/15 text-error">
                <XCircle className="size-8" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold text-plum">Not quite</h2>
              <p className="mt-2 text-sm text-muted">
                The correct answer was <span className="font-bold text-plum">{status.answer}</span>.
                Come back tomorrow for a new question.
              </p>
            </>
          )}
          <p className="mt-6 text-sm text-muted">
            A fresh question arrives automatically tomorrow. Keep your streak alive!
          </p>
        </div>
      )}
    </div>
  );
}

function CalendarToday() {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return <span className="font-semibold text-plum">{date}</span>;
}