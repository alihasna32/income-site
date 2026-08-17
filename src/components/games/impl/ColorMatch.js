"use client";

import { useCallback, useEffect, useState } from "react";
import { GameFrame } from "@/components/games/impl/GameFrame";
import { cn } from "@/lib/utils/cn";

const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];
const COLOR_STYLES = {
  red: { bg: "bg-red-500", text: "text-red-500" },
  blue: { bg: "bg-blue-500", text: "text-blue-500" },
  green: { bg: "bg-green-500", text: "text-green-500" },
  yellow: { bg: "bg-yellow-400", text: "text-yellow-500" },
  purple: { bg: "bg-purple-500", text: "text-purple-500" },
  orange: { bg: "bg-orange-500", text: "text-orange-500" },
};

export function ColorMatch({ config, onFinish }) {
  const totalRounds = config.rounds || 10;
  const timeLimit = config.time_limit_seconds || 30;

  const [round, setRound] = useState(0);
  const [word, setWord] = useState("");
  const [displayColor, setDisplayColor] = useState("");
  const [score, setScore] = useState(0);
  const [ended, setEnded] = useState(false);

  const nextRound = useCallback(() => {
    if (round >= totalRounds) return;
    const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const display = COLORS[Math.floor(Math.random() * COLORS.length)];
    setWord(wordColor);
    setDisplayColor(display);
  }, [round, totalRounds]);

  useEffect(() => {
    nextRound();
  }, [nextRound]);

  const pick = (color) => {
    if (ended) return;
    if (color === displayColor) {
      setScore((s) => s + 1);
    }
    if (round + 1 >= totalRounds) {
      setEnded(true);
      onFinish(score + (color === displayColor ? 1 : 0), {
        correct: score + (color === displayColor ? 1 : 0),
        total: totalRounds,
      });
    } else {
      setRound((r) => r + 1);
    }
  };

  const handleExpire = useCallback(() => {
    if (ended) return;
    setEnded(true);
    onFinish(score, { correct: score, total: totalRounds, timedOut: true });
  }, [ended, score, totalRounds, onFinish]);

  return (
    <GameFrame title="Color Match" timerSeconds={ended ? null : timeLimit} onExpire={handleExpire} score={score}>
      <div className="max-w-md mx-auto text-center">
        <p className="text-sm text-muted">
          Tap the button that matches the <em>color</em> of the word — not the word itself!
        </p>

        {!ended ? (
          <>
            <div className="mt-6">
              <span
                className={cn("text-6xl font-extrabold uppercase tracking-wide select-none", COLOR_STYLES[displayColor]?.text)}
              >
                {word}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => pick(color)}
                  aria-label={`Choose ${color}`}
                  className={cn(
                    "h-14 sm:h-16 rounded-xl shadow-card transition-transform active:scale-95 hover:scale-[1.03]",
                    COLOR_STYLES[color].bg
                  )}
                />
              ))}
            </div>

            <p className="mt-5 text-xs text-muted">
              Round {round + 1} of {totalRounds}
            </p>
          </>
        ) : (
          <div className="mt-6">
            <p className="text-3xl font-extrabold text-plum">{score}/{totalRounds}</p>
            <p className="mt-1 text-sm text-muted">correct answers</p>
          </div>
        )}
      </div>
    </GameFrame>
  );
}