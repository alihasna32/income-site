"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { cn } from "@/lib/utils/cn";

const BOX_EMOJIS = ["🎁", "📦", "🧰"];

export function MysteryBox({ config, onLuck }) {
  const boxCount = config.boxes || 3;
  const [picked, setPicked] = useState(null);
  const [revealing, setRevealing] = useState(false);

  const open = (index) => {
    if (revealing || picked !== null) return;
    setPicked(index);
    setRevealing(true);
    setTimeout(() => {
      setRevealing(false);
      onLuck?.();
    }, 1600);
  };

  return (
    <GameFrame title="Mystery Box" timerSeconds={null} score={null}>
      <div className="max-w-lg mx-auto text-center">
        <p className="text-sm text-muted">
          Three boxes, one mystery reward. Pick one — what's inside is decided
          on the server. Surprises only!
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-5">
          {Array.from({ length: boxCount }).map((_, i) => {
            const isPicked = picked === i;
            return (
              <button
                key={i}
                onClick={() => open(i)}
                disabled={picked !== null}
                aria-label={`Open mystery box ${i + 1}`}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-2xl border-2 text-5xl sm:text-6xl transition-all duration-300",
                  isPicked
                    ? "scale-110 border-gold bg-gold/15 shadow-glow"
                    : "border-plum/20 bg-gradient-to-br from-plum to-plum-light hover:scale-105 hover:border-gold active:scale-95"
                )}
              >
                <span className={cn(isPicked ? "animate-pop-in" : "opacity-90")}>
                  {isPicked ? "✨" : BOX_EMOJIS[i % BOX_EMOJIS.length]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 h-8">
          {revealing && (
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-secondary">
              <Loader2 className="size-4 animate-spin" /> Consulting the server… 🪄
            </p>
          )}
          {picked !== null && !revealing && (
            <p className="text-sm font-bold text-plum animate-pop-in">Revealing your surprise…</p>
          )}
        </div>
      </div>
    </GameFrame>
  );
}