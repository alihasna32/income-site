"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { cn } from "@/lib/utils/cn";

const THRESHOLD_MS = 900;

export function ReactionTest({ config, onFinish }) {
  const rounds = config.rounds || 5;

  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState("waiting"); // waiting | ready | tooSoon
  const [results, setResults] = useState([]);
  const [ended, setEnded] = useState(false);
  const [lastTime, setLastTime] = useState(null);
  const readyAtRef = useRef(null);
  const timeoutRef = useRef(null);

  const startNextRound = useCallback(() => {
    if (round >= rounds) return;
    setPhase("waiting");
    setLastTime(null);
    const delay = 1200 + Math.random() * 2200;
    timeoutRef.current = setTimeout(() => {
      setPhase("ready");
      readyAtRef.current = Date.now();
    }, delay);
  }, [round, rounds]);

  useEffect(() => {
    startNextRound();
    return () => clearTimeout(timeoutRef.current);
  }, [startNextRound]);

  const handleTap = () => {
    if (phase === "ready") {
      const elapsed = Date.now() - readyAtRef.current;
      const isGood = elapsed <= THRESHOLD_MS;
      const nextResults = [...results, isGood ? 1 : 0];
      setResults(nextResults);
      setLastTime(elapsed);
      readyAtRef.current = null;

      if (round + 1 >= rounds) {
        const score = nextResults.filter(Boolean).length;
        setEnded(true);
        onFinish(score, { reactionTimes: nextResults });
      } else {
        setRound((r) => r + 1);
      }
    } else if (phase === "waiting") {
      clearTimeout(timeoutRef.current);
      setPhase("tooSoon");
      setTimeout(() => {
        setRound((r) => r + 1);
      }, 900);
    }
  };

  const goodRounds = results.filter(Boolean).length;

  return (
    <GameFrame title="Reaction Test" timerSeconds={null} score={goodRounds}>
      <button
        onClick={handleTap}
        disabled={ended}
        aria-label={phase === "ready" ? "Tap now!" : "Wait for green"}
        className={cn(
          "h-64 sm:h-72 w-full rounded-box text-xl sm:text-2xl font-extrabold transition-colors duration-150",
          phase === "ready"
            ? "bg-success text-success-content animate-pulse"
            : phase === "tooSoon"
            ? "bg-error text-error-content"
            : "bg-plum text-neutral-content/70"
        )}
      >
        {phase === "waiting" && `Round ${round + 1}/${rounds} — wait for green…`}
        {phase === "ready" && "TAP NOW!"}
        {phase === "tooSoon" && "Too soon! Wait for green…"}
        {ended && `Done! ${goodRounds}/${rounds} fast reactions`}
      </button>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
        {results.map((r, i) => (
          <span
            key={i}
            className={cn(
              "flex size-7 items-center justify-center rounded-full font-bold",
              r ? "bg-success/15 text-success" : "bg-error/10 text-error"
            )}
          >
            {r ? "✓" : "✗"}
          </span>
        ))}
        {lastTime !== null && <span className="font-mono">{lastTime}ms</span>}
      </div>
    </GameFrame>
  );
}