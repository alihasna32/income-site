"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Coins, Flame, Gift, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";

const DEFAULT_DAYS = [
  { day: 1, coins: 10 },
  { day: 2, coins: 15 },
  { day: 3, coins: 20 },
  { day: 4, coins: 25 },
  { day: 5, coins: 35 },
  { day: 6, coins: 50 },
  { day: 7, coins: 100, bonus: true },
];

export function DailyRewardBanner() {
  const { toast } = useToast();
  const { refresh } = useWallet();

  const [status, setStatus] = useState("loading"); // loading | ready | claimed
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [streak, setStreak] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    fetch("/api/daily/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setStatus(data.claimedToday ? "claimed" : "ready");
          setStreak(data.currentStreak);
          if (data.days?.length) setDays(data.days);
        }
      })
      .catch(() => setStatus("ready"));
  }, []);

  const claim = useCallback(async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/daily/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok && data.claimed) {
        setStatus("claimed");
        setStreak(data.currentStreak);
        if (data.days?.length) setDays(data.days);
        setCelebrate(true);
        toast(
          `Day ${data.dayInStreak} claimed — +${data.coins} coins!`,
          "success"
        );
        refresh();
        setTimeout(() => setCelebrate(false), 2500);
      } else if (res.status === 409) {
        setStatus("claimed");
        toast("You already claimed today's reward", "info");
      } else {
        toast(data.error || "Could not claim right now", "error");
      }
    } catch {
      toast("Could not claim right now", "error");
    } finally {
      setClaiming(false);
    }
  }, [claiming, refresh, toast]);

  if (status === "loading") {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-card p-5">
        <div className="skeleton h-20 w-full rounded-box" />
      </div>
    );
  }

  const currentDayIndex = status === "claimed"
    ? Math.min(streak - 1, days.length - 1)
    : Math.min(streak, days.length - 1);

  return (
    <div className="relative overflow-hidden rounded-box bg-gradient-to-br from-plum via-plum-light to-plum-dark p-5 sm:p-6 text-neutral-content shadow-soft">
      {celebrate && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-coin-burst text-xl"
              style={{
                left: `${8 + i * 9}%`,
                top: "60%",
                "--burst-x": `${(i % 5) * 22 - 44}px`,
                "--burst-y": `${-70 - (i % 3) * 30}px`,
                animationDelay: `${i * 90}ms`,
              }}
            >
              🪙
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-plum shadow-card">
            {status === "claimed" ? <Check className="size-6" /> : <Gift className="size-6" />}
          </span>
          <div>
            <h2 className="text-lg font-extrabold">
              {status === "claimed" ? "Daily reward claimed!" : "Your daily reward awaits"}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-neutral-content/80">
              <Flame className="size-4 text-orange" />
              {streak} day streak
              {streak > 0 && status === "ready" && " — claim today to keep it alive!"}
              {status === "claimed" && " — see you tomorrow!"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {days.map((d) => {
              const claimed = status === "claimed" && d.day <= currentDayIndex + 1;
              const isToday = status === "ready" && d.day === currentDayIndex + 1;
              return (
                <div
                  key={d.day}
                  className={cn(
                    "relative flex w-12 shrink-0 flex-col items-center gap-1 rounded-box border p-2 text-center",
                    d.bonus
                      ? "border-gold/60 bg-gold/15"
                      : "border-white/15 bg-white/5",
                    isToday && "border-gold bg-gold/25 animate-shimmer"
                  )}
                >
                  {isToday && (
                    <span className="absolute -top-2 rounded-full bg-gold px-1.5 py-px text-[9px] font-bold text-plum">
                      TODAY
                    </span>
                  )}
                  <Flame className={cn("size-3.5", claimed ? "text-gold" : "text-orange/60")} />
                  <span className="text-[10px] font-semibold text-neutral-content/70">D{d.day}</span>
                  <span className={cn("flex items-center gap-0.5 text-xs font-extrabold", claimed ? "text-gold" : "text-neutral-content/60")}>
                    <Coins className="size-3" />
                    {d.coins}
                  </span>
                </div>
              );
            })}
          </div>

          {status === "ready" ? (
            <button
              onClick={claim}
              disabled={claiming}
              className="btn btn-primary shrink-0 shadow-card"
            >
              {claiming ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />}
              Claim
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}