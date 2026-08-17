import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Calculator,
  Coins,
  Flag,
  Flame,
  Gamepad2,
  Gift,
  Sparkles,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import { DailyRewardBanner } from "@/components/dashboard/DailyRewardBanner";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CoinValue } from "@/components/shared/CoinValue";
import { levelProgress } from "@/lib/constants/levels";
import { getOverviewData, getTodayChallenge } from "@/services/dashboardService";
import { getActiveGames } from "@/services/catalogService";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { supabaseReady } from "@/lib/supabase/env";
import { GameIcon } from "@/components/games/GameIcon";
import { TodayChallengeCard } from "@/components/dashboard/TodayChallengeCard";
import { formatDateTime } from "@/lib/utils/format";
import { TRANSACTION_TYPES } from "@/lib/constants/transactions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardOverview() {
  const user = await getSession();
  if (!user) return null;

  if (!supabaseReady()) {
    return <div className="text-sm text-muted">Connect Supabase to get started.</div>;
  }

  const [data, todayChallenge, games] = await Promise.all([
    getOverviewData(user.id),
    getTodayChallenge(user.id),
    getActiveGames({ limit: 4 }),
  ]);

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const { profile, wallet, streak, stats } = data;
  const level = levelProgress(profile?.xp || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-plum">
          Welcome back, {profile?.display_name || "player"}!
        </h1>
        <p className="text-sm text-muted">
          You're doing great — here's what's waiting for you today.
        </p>
      </div>

      <DailyRewardBanner />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Coins}
          label="Available coins"
          value={<CoinValue value={wallet?.coins} className="text-plum" />}
          sub={`${new Intl.NumberFormat("en-US").format(wallet?.total_earned || 0)} earned all time`}
          tone="primary"
        />
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${streak?.current_streak || 0} days`}
          sub={`Best: ${streak?.longest_streak || 0} days`}
          tone="accent"
        />
        <StatCard
          icon={Sparkles}
          label={`Level ${level.level.level} · ${level.level.title}`}
          value={`${new Intl.NumberFormat("en-US").format(profile?.xp || 0)} XP`}
          sub={
            level.next
              ? `${new Intl.NumberFormat("en-US").format(level.next.xp_required - (profile?.xp || 0))} XP to level ${level.next.level}`
              : "Max level reached!"
          }
          tone="secondary"
        />
        <StatCard
          icon={Trophy}
          label="Achievements"
          value={stats.achievementsUnlocked}
          sub="unlocked so far"
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {todayChallenge && <TodayChallengeCard challenge={todayChallenge}/>}

          <section>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
                <Gamepad2 className="size-5 text-gold-dark" /> Quick play
              </h2>
              <Link href="/dashboard/games" className="btn btn-ghost btn-sm">
                All games <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {games.map((game) => (
                <Link
                  key={game.slug}
                  href={`/dashboard/games/${game.slug}`}
                  className="card bg-base-100 border border-base-300 p-4 text-center shadow-card hover:shadow-soft hover:-translate-y-0.5 transition-all"
                >
                  <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-orange text-plum">
                    <GameIcon name={game.icon} className="size-5" />
                  </span>
                  <p className="mt-2 text-xs font-bold text-plum truncate">{game.title}</p>
                  <p className="coin text-gold-dark text-[10px] mt-0.5">
                    +{game.config?.thresholds?.[0]?.coins || game.reward_coins} max
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
                <Gift className="size-5 text-gold-dark" /> Active missions
              </h2>
              <Link href="/dashboard/missions" className="btn btn-ghost btn-sm">
                All missions <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-4 card bg-base-100 border border-base-300 p-5 shadow-card">
              {data.missions.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  All missions complete — you're on fire! 🔥
                </p>
              ) : (
                <div className="space-y-4">
                  {data.missions.map((m) => (
                    <MissionRow key={m.id} missionId={m.mission_id} progress={m.progress} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6 min-w-0">
          <section className="card bg-base-100 border border-base-300 p-5 shadow-card">
            <h2 className="text-lg font-bold text-plum">Level progress</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-lg font-extrabold text-plum shadow-card">
                {level.level.level}
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold">{level.level.title}</p>
                <ProgressBar value={level.progress} tone="secondary" className="mt-1.5" showValue />
              </div>
            </div>
          </section>

          <section className="card bg-base-100 border border-base-300 p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
              <Brain className="size-5 text-secondary" /> Train your brain
            </h2>
            <p className="mt-1 text-sm text-muted">
              Timed math challenges across 4 difficulty levels.
            </p>
            <Link href="/dashboard/math-challenge" className="btn btn-secondary btn-sm mt-4 w-full">
              <Calculator className="size-4" /> Start a math challenge
            </Link>
          </section>

          <section className="card bg-base-100 border border-base-300 p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
              <Ticket className="size-5 text-accent" /> Recent activity
            </h2>
            {data.recentTransactions.length === 0 ? (
              <EmptyState
                icon={Coins}
                title="No activity yet"
                description="Play a game or scratch a card to see transactions here."
                className="mt-3 py-6"
              />
            ) : (
              <ul className="mt-3 space-y-3">
                {data.recentTransactions.map((tx) => {
                  const meta = TRANSACTION_TYPES[tx.type] || {};
                  return (
                    <li key={tx.id} className="flex items-center gap-3 text-sm">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-base-200 text-muted">
                        <GameIcon name={meta.icon || "Coins"} className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-plum">
                          {tx.description || meta.label || tx.type}
                        </p>
                        <p className="text-xs text-muted">{formatDateTime(tx.created_at)}</p>
                      </div>
                      <span className={`font-bold ${tx.amount > 0 ? "text-success" : "text-error"}`}>
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

async function MissionRow({ missionId, progress }) {
  const admin = createAdminClient();
  const { data: mission } = await admin
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .single();

  if (!mission) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-plum flex items-center gap-2">
          <GameIcon name={mission.icon} className="size-4 text-gold-dark shrink-0" />
          <span className="truncate">{mission.title}</span>
        </p>
        <span className="coin text-gold-dark text-xs shrink-0">
          +{mission.reward_coins}
        </span>
      </div>
      <ProgressBar
        value={progress}
        max={mission.target}
        tone="primary"
        className="mt-1.5"
        showValue
      />
    </div>
  );
}