"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Coins, Flame, Gamepad2, LogIn, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STATIC_DAYS = [
  { day: 1, coins: 10 },
  { day: 2, coins: 15 },
  { day: 3, coins: 20 },
  { day: 4, coins: 25 },
  { day: 5, coins: 35 },
  { day: 6, coins: 50 },
  { day: 7, coins: 100, bonus: true },
];

export function DailyRewardsSection() {
  const [status, setStatus] = useState(null); // null = not logged in (yet)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch("/api/daily/status", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) setStatus(data);
          }
        }
      } catch {
        // not logged in or offline — stay in the static state
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const days = status?.days?.length ? status.days : STATIC_DAYS;
  const loggedIn = Boolean(status);
  const streak = status?.currentStreak || 0;
  const claimedToday = Boolean(status?.claimedToday);

  const todayHighlight = !loggedIn
    ? 1
    : claimedToday
    ? ((streak - 1) % 7) + 1
    : (streak % 7) + 1;

  return (
    <section className="bg-gradient-to-b from-plum to-plum-dark text-neutral-content py-16 sm:py-20">
      <div className="container-page">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold">
              Daily rewards
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Keep your streak, keep the rewards
            </h2>
            <p className="mt-4 text-neutral-content/80 leading-relaxed max-w-lg">
              Log in every day to claim your daily reward. Streaks grow the
              payouts — day 7 unlocks a big bonus. Miss a day? You can always
              start a fresh streak tomorrow.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-box bg-white/10 px-4 py-3">
                <Flame className="size-5 text-orange" />
                <div>
                  <p className="text-sm font-bold">7-day cycle</p>
                  <p className="text-xs text-neutral-content/70">rewards reset weekly</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-box bg-white/10 px-4 py-3">
                <Trophy className="size-5 text-gold" />
                <div>
                  <p className="text-sm font-bold">Streak badges</p>
                  <p className="text-xs text-neutral-content/70">7 & 30-day achievements</p>
                </div>
              </div>
            </div>

            {loggedIn && (
              <div className="mt-6 flex items-center gap-2 rounded-box border border-gold/40 bg-gold/10 px-4 py-3 text-sm font-semibold">
                {claimedToday ? (
                  <>
                    <CheckCircle2 className="size-5 text-gold" />
                    {streak > 0 ? `${streak}-day streak` : "Streak"} — reward claimed today. Day{" "}
                    {((streak % 7) + 1)} is next!
                  </>
                ) : (
                  <>
                    <Flame className="size-5 text-orange" />
                    {streak > 0 ? `${streak}-day streak — ` : ""}Day {todayHighlight} reward is
                    waiting for you.
                  </>
                )}
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {loggedIn ? (
                <Link href="/dashboard" className="btn btn-primary">
                  {claimedToday ? "Back to dashboard" : "Claim today's reward"}{" "}
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary">
                    Claim your day-1 reward <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="btn btn-outline border-white/30 text-neutral-content hover:bg-white/10 hover:border-white/40"
                  >
                    <LogIn className="size-4" /> Log in
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-7 lg:grid-cols-4">
            {days.map((d) => (
              <div
                key={d.day}
                className={`relative flex flex-col items-center gap-1.5 rounded-box border p-3 text-center ${
                  d.bonus
                    ? "border-gold bg-gold/15"
                    : d.day === todayHighlight
                    ? "border-gold bg-gold/10"
                    : "border-white/15 bg-white/5"
                }`}
              >
                {d.day === todayHighlight && (
                  <span className="absolute -top-2 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-plum">
                    {loggedIn && d.day === ((streak - 1) % 7) + 1 && claimedToday
                      ? "CLAIMED"
                      : "TODAY"}
                  </span>
                )}
                <Flame className={`size-4 ${d.bonus ? "text-gold" : "text-orange/70"}`} />
                <span className="text-xs font-semibold text-neutral-content/70">Day {d.day}</span>
                <span className="flex items-center gap-1 text-sm font-extrabold text-gold">
                  <Coins className="size-3.5" />
                  {d.coins}
                </span>
              </div>
            ))}
            <div className="col-span-4 flex items-center justify-center gap-2 rounded-box border border-dashed border-white/20 p-3 text-sm text-neutral-content/70 sm:col-span-3 lg:col-span-4">
              <Gamepad2 className="size-4 text-gold" />
              Streaks make every day worth it
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}