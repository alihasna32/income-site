"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Gamepad2, Loader2, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { initials, avatarGradient } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "all", label: "All time" },
];

const METRICS = [
  { key: "xp", label: "XP", icon: Sparkles },
  { key: "coins", label: "Coins", icon: Coins },
  { key: "games", label: "Games", icon: Gamepad2 },
];

export function LeaderboardTabs({ userId, compact = false }) {
  const [period, setPeriod] = useState("all");
  const [metric, setMetric] = useState("xp");
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/leaderboard?period=${period}&metric=${metric}&limit=${compact ? 10 : 25}${userId ? `&me=${userId}` : ""}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEntries(data.entries || []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, metric, userId, compact]);

  const medals = useMemo(
    () => ["text-gold", "text-muted", "text-orange"],
    []
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Leaderboard period">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "btn btn-sm",
                period === p.key ? "btn-primary" : "btn-ghost bg-base-200"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Leaderboard metric">
          {METRICS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={metric === m.key}
              onClick={() => setMetric(m.key)}
              className={cn(
                "btn btn-sm gap-1.5",
                metric === m.key ? "btn-secondary" : "btn-ghost bg-base-200"
              )}
            >
              <m.icon className="size-4" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {loading && !entries && <SkeletonList count={5} />}

        {!loading && entries && entries.length === 0 && (
          <EmptyState
            icon={Trophy}
            title="No players yet"
            description="Be the first to make it onto this leaderboard. Play a game to get started!"
          />
        )}

        {entries && entries.length > 0 && (
          <div className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
            <div className="divide-y divide-base-200">
              {entries.map((entry) => (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3",
                    userId && entry.userId === userId && "bg-primary/10"
                  )}
                >
                  <div className="flex w-8 justify-center">
                    {entry.rank <= 3 ? (
                      <Trophy className={cn("size-5", medals[entry.rank - 1])} />
                    ) : (
                      <span className="text-sm font-extrabold text-muted">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-plum",
                      avatarGradient(entry.name)
                    )}
                  >
                    {initials(entry.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-plum">
                      {entry.name}
                      {userId && entry.userId === userId && (
                        <span className="ml-2 badge badge-xs badge-primary">You</span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">@{entry.username}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-extrabold text-plum text-sm sm:text-base">
                      {new Intl.NumberFormat("en-US").format(entry.value)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-muted">
                      {metric === "xp" ? "XP" : metric === "coins" ? "coins" : "games"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}