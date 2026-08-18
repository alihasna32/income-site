"use client";

import { useEffect, useState } from "react";
import { Brain, CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { cn } from "@/lib/utils/cn";

export function TodayChallengeCard({ challenge }) {
  const { toast } = useToast();
  const { refresh } = useWallet();

  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState("idle"); // idle | correct | wrong

  useEffect(() => {
    setState(challenge.solvedToday ? (challenge.wasCorrect ? "correct" : "wrong") : "idle");
  }, [challenge]);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/challenges/${challenge.challenge.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setState(data.correct ? "correct" : "wrong");
        if (data.correct) {
          toast(`Correct! +${data.coins} coins`, "success");
          refresh();
        } else {
          toast(data.message || "Not quite!", "info");
        }
      } else {
        toast(data.error || "Could not submit", "error");
        if (res.status === 429) setState("wrong");
      }
    } catch {
      toast("Could not submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const config = challenge.challenge.config || {};
  const isOptions = config.kind === "options";

  return (
    <section className="relative overflow-hidden rounded-box bg-gradient-to-br from-plum via-plum-light to-plum-dark p-6 text-neutral-content shadow-soft">
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 20%, rgba(242,194,48,0.4) 0%, transparent 45%)",
        }}
        aria-hidden="true"
      />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="badge border-gold/60 text-gold gap-1.5">
            <Brain className="size-3.5" /> Today's challenge
          </span>
          <span className="coin text-gold text-xs">
            +{challenge.challenge.reward_coins} coins
          </span>
        </div>

        <h2 className="mt-4 text-xl font-extrabold">{challenge.challenge.title}</h2>
        <p className="mt-2 text-sm text-neutral-content/85 leading-relaxed">
          {challenge.challenge.description || config.question}
        </p>

        {state === "correct" ? (
          <div className="mt-5 flex items-center gap-2 rounded-box bg-success/15 border border-success/30 px-4 py-3 text-sm font-semibold text-success-content">
            <CheckCircle2 className="size-5" /> Solved! Come back tomorrow for a new challenge.
          </div>
        ) : state === "wrong" ? (
          <div className="mt-5 flex items-center gap-2 rounded-box bg-error/10 border border-error/30 px-4 py-3 text-sm font-semibold">
            <XCircle className="size-5" /> Not this time — tomorrow's challenge is waiting.
          </div>
        ) : isOptions ? (
          <form onSubmit={submit} className="mt-5">
            <div className="flex flex-wrap gap-2">
              {(config.options || []).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswer(option)}
                  className={cn(
                    "btn btn-sm",
                    answer === option ? "btn-gold" : "btn-ghost bg-white/10 text-neutral-content border border-white/20"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm mt-4"
              disabled={!answer || submitting}
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Submit answer
            </button>
          </form>
        ) : (
          <form onSubmit={submit} className="mt-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer…"
                className="input input-bordered h-14 flex-1 bg-white/10 border-white/25 text-base text-neutral-content placeholder:text-neutral-content/50 focus:border-gold sm:h-12 sm:text-sm"
                aria-label="Your answer"
                autoComplete="off"
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!answer.trim() || submitting}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}