"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameFrame } from "@/components/games/impl/GameFrame";

export function TapChallenge({ config, onFinish }) {
  const duration = config.duration_seconds || 15;
  const [score, setScore] = useState(0);
  const [target, setTarget] = useState(null);
  const [ended, setEnded] = useState(false);
  const timeoutRef = useRef(null);

  const spawnTarget = useCallback(() => {
    setTarget({
      x: 8 + Math.random() * 72,
      y: 10 + Math.random() * 60,
      id: Date.now(),
    });
  }, []);

  useEffect(() => {
    spawnTarget();
  }, [spawnTarget]);

  const handleExpire = useCallback(() => {
    if (ended) return;
    setEnded(true);
    onFinish(score, { taps: score });
  }, [ended, score, onFinish]);

  const hit = () => {
    if (ended) return;
    setScore((s) => s + 1);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(spawnTarget, 250);
    setTarget(null);
  };

  return (
    <GameFrame
      title="Tap Challenge"
      timerSeconds={duration}
      onExpire={handleExpire}
      score={score}
      accent="secondary"
    >
      <div
        className="relative h-72 sm:h-80 overflow-hidden rounded-box bg-gradient-to-br from-plum to-plum-light"
        role="group"
        aria-label="Tap the targets before time runs out"
      >
        {!ended && target && (
          <button
            key={target.id}
            onClick={hit}
            className="absolute flex size-14 sm:size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum text-2xl font-extrabold shadow-glow active:scale-90 transition-transform"
            style={{ left: `${target.x}%`, top: `${target.y}%` }}
            aria-label="Tap me!"
          >
            ⭐
          </button>
        )}
        {ended && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-content">
            <p className="text-4xl font-extrabold text-gold">{score}</p>
            <p className="mt-1 text-sm text-neutral-content/70">taps in {duration}s</p>
          </div>
        )}
      </div>
    </GameFrame>
  );
}