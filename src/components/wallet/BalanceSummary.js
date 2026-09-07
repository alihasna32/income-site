"use client";

import Link from "next/link";
import { ArrowRight, Banknote, Coins, Sparkles, TrendingUp } from "lucide-react";
import { useWallet } from "@/hooks/WalletProvider";
import { cn } from "@/lib/utils/cn";

function formatNumber(n) {
  return new Intl.NumberFormat("en-US").format(Number(n) || 0);
}

function compactFormat(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  return formatNumber(num);
}

export function BalanceSummary({ initialCoins, initialTakaBalance, totalEarnedToday, totalTakaWithdrawn }) {
  const { wallet } = useWallet();
  const coins = wallet?.coins ?? initialCoins ?? 0;
  const takaBalance = wallet?.taka_balance ?? initialTakaBalance ?? 0;
  const earned = totalEarnedToday ?? 0;
  const withdrawn = totalTakaWithdrawn ?? 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
      {/* ── Coin balance card ─────────────────────────────────────── */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-card",
          "p-5 sm:p-6 transition-shadow hover:shadow-soft"
        )}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-secondary/10 blur-2xl transition-opacity group-hover:opacity-80"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <span className="flex size-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                <Coins className="size-4" />
              </span>
              <span>Coin balance</span>
            </div>
            <p
              className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight text-plum tabular-nums"
              title={formatNumber(coins)}
            >
              {formatNumber(coins)}
              <span className="ml-1.5 text-base font-semibold text-muted">coins</span>
            </p>
            <p className="mt-2 text-xs text-muted">
              Earned today:{" "}
              <span className="font-semibold text-plum">
                <Sparkles className="inline size-3 text-gold-dark" /> {formatNumber(earned)}
              </span>
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-success">
              <TrendingUp className="inline size-3" /> Active
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/wallet#convert"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary transition-colors hover:text-plum"
        >
          Convert coins to Taka
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* ── Taka balance card ─────────────────────────────────────── */}
      <div
        className={cn(
          "group relative overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-card",
          "p-5 sm:p-6 transition-shadow hover:shadow-soft",
          takaBalance > 0 && "ring-1 ring-gold-dark/20"
        )}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-gold-dark/10 blur-2xl transition-opacity group-hover:opacity-80"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
              <span className="flex size-7 items-center justify-center rounded-lg bg-gold-dark/15 text-gold-dark">
                <Banknote className="size-4" />
              </span>
              <span>Taka balance</span>
            </div>
            <p
              className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight text-plum tabular-nums"
              title={formatNumber(takaBalance)}
            >
              <span className="text-gold-dark">৳</span>
              {formatNumber(takaBalance)}
            </p>
            <p className="mt-2 text-xs text-muted">
              Total withdrawn:{" "}
              <span className="font-semibold text-plum">
                ৳{formatNumber(withdrawn)}
              </span>
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1.5">
            {takaBalance > 0 ? (
              <span className="rounded-full bg-gold-dark/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-dark">
                Available
              </span>
            ) : (
              <span className="rounded-full bg-base-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                Empty
              </span>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/wallet#withdraw"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition-colors hover:text-plum"
        >
          Withdraw Taka
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
