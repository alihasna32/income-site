"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { cn } from "@/lib/utils/cn";

export function LuckyWheel({ config, onLuck }) {
  const segments = config.segments || 8;
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const spinRef = useRef(null);

  const segmentAngle = 360 / segments;

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    const target = rotation + 1440 + Math.floor(Math.random() * 720);
    spinRef.current = setTimeout(() => {
      setRotation(target % 360);
      setSpinning(false);
      onLuck?.();
    }, 2800);
  };

  return (
    <GameFrame title="Lucky Wheel" timerSeconds={null} score={null}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div
            className="relative size-64 sm:size-80 rounded-full border-8 border-plum shadow-soft overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 2.8s cubic-bezier(0.15, 0.9, 0.3, 1.05)" : "none",
            }}
            aria-hidden="true"
          >
            {Array.from({ length: segments }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 flex items-start justify-center"
                style={{ transform: `rotate(${i * segmentAngle}deg)` }}
              >
                <div
                  className="flex w-16 sm:w-20 items-center justify-center rounded-full font-extrabold"
                  style={{
                    height: "50%",
                    background:
                      i % 2 === 0
                        ? "linear-gradient(to bottom, #F2C230, #F2921D)"
                        : "linear-gradient(to bottom, #5B4566, #46334F)",
                    color: i % 2 === 0 ? "#46334F" : "#FFF8EE",
                    transform: "translateY(-6px)",
                    clipPath: "polygon(50% 100%, 0 0, 100% 0)",
                  }}
                >
                  <span className="mt-1 text-[10px] sm:text-xs text-center px-1">{i + 1}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex size-12 items-center justify-center rounded-full bg-plum text-gold shadow-glow">
            🪙
          </div>
          <div
            className="absolute left-1/2 -top-2 -translate-x-1/2 text-3xl"
            aria-hidden="true"
          >
            ⬇️
          </div>
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className="btn btn-primary btn-lg shadow-card"
        >
          {spinning ? <Loader2 className="size-5 animate-spin" /> : "🎰 Spin the wheel"}
        </button>
        <p className="text-xs text-muted max-w-xs text-center">
          The outcome is decided on the server for fairness — your luck is
          always real luck.
        </p>
      </div>
    </GameFrame>
  );
}