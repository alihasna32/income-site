"use client";

import { useEffect, useRef, useState } from "react";
import { Coins, Loader2, Lock } from "lucide-react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { cn } from "@/lib/utils/cn";

export function LuckyWheel({ config, onLuck, spinTarget, onSpinComplete, playsLeft }) {
  const segments = config.segments || 8;
  const outcomes = Array.isArray(config.outcomes) ? config.outcomes : [];
  const segmentAngle = 360 / segments;
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const targetedRef = useRef(null);
  const locked = playsLeft !== null && playsLeft <= 0;

  const labelFor = (i) => {
    const outcome = outcomes[i];
    if (!outcome) return `${i + 1}`;
    return outcome.coins > 0 ? `+${outcome.coins}` : "0";
  };

  const isDark = (i) => i % 2 === 1;

  useEffect(() => {
    if (spinTarget === null || spinTarget === undefined) {
      targetedRef.current = null;
      return;
    }
    if (targetedRef.current === spinTarget) return;
    targetedRef.current = spinTarget;
    setSpinning(true);
    const base = (360 - spinTarget * segmentAngle) % 360;
    const jitter = (Math.random() - 0.5) * (segmentAngle - 12);
    setRotation((current) => {
      const extra = (base + jitter - (current % 360) + 720) % 360;
      return current + 1440 + extra;
    });
  }, [spinTarget, segmentAngle]);

  const handleTransitionEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    onSpinComplete?.();
  };

  const spin = () => {
    if (spinning || locked) return;
    setSpinning(true);
    onLuck?.();
  };

  return (
    <GameFrame title="Spin to Win" timerSeconds={null} score={null}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div
            onTransitionEnd={handleTransitionEnd}
            className="relative size-72 sm:size-96 rounded-full border-[10px] border-plum shadow-glow overflow-hidden"
            style={{
              background:
                "conic-gradient(from -22.5deg, #F2C230 0 45deg, #46334F 45deg 90deg, #F2C230 90deg 135deg, #46334F 135deg 180deg, #F2C230 180deg 225deg, #46334F 225deg 270deg, #F2C230 270deg 315deg, #46334F 315deg 360deg)",
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 2.8s cubic-bezier(0.15, 0.9, 0.3, 1.05)" : "none",
            }}
            aria-hidden="true"
          >
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0"
                style={{ transform: `rotate(${i * segmentAngle}deg)` }}
              >
                <span
                  className={cn(
                    "absolute left-1/2 top-7 sm:top-9 -translate-x-1/2 text-lg sm:text-2xl font-extrabold drop-shadow",
                    isDark(i) ? "text-neutral-content" : "text-plum"
                  )}
                >
                  {labelFor(i)}
                </span>
              </div>
            ))}
            <div className="absolute left-1/2 top-1/2 flex size-14 sm:size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum shadow-card">
              <Coins className="size-7" />
            </div>
            {locked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-full bg-plum/70 backdrop-blur-sm">
                <Lock className="size-10 text-gold" />
                <span className="text-sm font-bold text-neutral-content">
                  Wheel locked — come back tomorrow
                </span>
              </div>
            )}
          </div>
          <div
            className="absolute left-1/2 -top-2 z-10 -translate-x-1/2 border-x-[14px] border-x-transparent border-t-[26px] border-t-gold drop-shadow-lg"
            aria-hidden="true"
          />
        </div>

        <button
          onClick={spin}
          disabled={spinning || locked}
          className="btn btn-primary btn-lg shadow-card"
        >
          {spinning ? (
            <Loader2 className="size-5 animate-spin" />
          ) : locked ? (
            <Lock className="size-5" />
          ) : (
            <Coins className="size-5" />
          )}
          {spinning ? "Spinning…" : locked ? "Come back tomorrow" : "Spin the wheel"}
        </button>
        <p className="text-xs text-muted max-w-xs text-center">
          Where the wheel stops is your reward — decided on the server for
          fairness.
        </p>
      </div>
    </GameFrame>
  );
}