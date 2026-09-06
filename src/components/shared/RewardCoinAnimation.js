"use client";

import { useEffect, useState } from "react";
import { Coins, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function RewardCoinAnimation({ id, amount = 0, source = "reward", onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance on mount
    const t = setTimeout(() => setVisible(true), 16);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss?.(id), 250);
  };

  if (!amount || amount <= 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-1/2 left-1/2 z-[200] pointer-events-none"
      style={{
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className={cn(
          "pointer-events-auto relative flex items-center gap-3 rounded-full bg-gradient-to-r from-gold to-orange px-6 py-3 shadow-2xl border-2 border-white/30",
          "transition-all duration-300",
          visible && !leaving
            ? "opacity-100 scale-100"
            : "opacity-0 scale-50"
        )}
        style={{
          animation: visible && !leaving ? "reward-pop 2.5s ease-out forwards" : "none",
        }}
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-white/25 text-white text-2xl shrink-0 animate-spin-slow">
          🪙
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold text-white drop-shadow-sm whitespace-nowrap">
            +{new Intl.NumberFormat("en-US").format(amount)} coins
          </p>
          <p className="text-xs text-white/85 font-semibold capitalize">
            {source.replace(/_/g, " ")}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 btn btn-ghost btn-xs btn-circle text-white/80 hover:bg-white/20 hover:text-white"
          aria-label="Dismiss reward"
        >
          <X className="size-4" />
        </button>

        {/* Sparkle particles */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="absolute top-1/2 left-1/2 size-2 rounded-full bg-white/80"
              style={{
                animation: "sparkle 1.2s ease-out infinite",
                animationDelay: `${i * 0.1}s`,
                transform: `rotate(${i * 45}deg) translateY(-30px)`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes reward-pop {
          0% { transform: scale(0.3); opacity: 0; }
          15% { transform: scale(1.15); opacity: 1; }
          25% { transform: scale(1); }
          80% { transform: scale(1) translateY(0); opacity: 1; }
          100% { transform: scale(0.8) translateY(-30px); opacity: 0; }
        }
        @keyframes sparkle {
          0% { opacity: 0; }
          30% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
