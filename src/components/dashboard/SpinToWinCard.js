"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Coins, Loader2 } from "lucide-react";

export function SpinToWinCard() {
  const [playsLeft, setPlaysLeft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/games/spin-to-win/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setPlaysLeft(data?.playsLeft ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative overflow-hidden rounded-box bg-gradient-to-r from-plum via-plum-light to-plum p-5 sm:p-6 text-neutral-content shadow-card">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 20%, rgba(242,194,48,0.35) 0%, transparent 45%)",
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum shadow-glow">
            <Coins className="size-6" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold">Spin to Win</h2>
            <p className="text-sm text-neutral-content/80">
              3 spins a day — win 10 to 100 coins!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-lg bg-white/10 border-white/20 text-neutral-content">
            {playsLeft === null ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              `${playsLeft} spin${playsLeft === 1 ? "" : "s"} left today`
            )}
          </span>
          <Link href="/dashboard/spin" className="btn btn-primary">
            Spin now <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}