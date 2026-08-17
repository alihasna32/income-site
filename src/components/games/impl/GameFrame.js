"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function GameFrame({ title, timerSeconds, onExpire, score, children, accent = "plum" }) {
  const [remaining, setRemaining] = useState(timerSeconds);

  useEffect(() => {
    if (timerSeconds === null || timerSeconds === undefined) return;
    setRemaining(timerSeconds);
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSeconds]);

  return (
    <div className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
      <div className={cn("flex items-center justify-between gap-3 px-4 sm:px-6 py-4", accent === "plum" ? "bg-plum text-neutral-content" : "bg-gradient-to-r from-secondary to-accent text-white")}>
        <h2 className="font-bold text-sm sm:text-base">{title}</h2>
        <div className="flex items-center gap-3">
          {timerSeconds !== null && timerSeconds !== undefined && (
            <span
              className={cn(
                "font-mono text-lg font-bold",
                remaining <= 5 ? "text-accent animate-pulse" : ""
              )}
              aria-label={`${remaining} seconds remaining`}
            >
              ⏱ {remaining}s
            </span>
          )}
          {score !== null && score !== undefined && (
            <span className="badge badge-lg bg-white/15 text-white font-bold">
              Score: {score}
            </span>
          )}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}