import Link from "next/link";
import { ArrowRight, Coins, Gamepad2, Sparkles, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { GameIcon } from "@/components/games/GameIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils/format";
import { TRANSACTION_TYPES } from "@/lib/constants/transactions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Overview",
};

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [usersRes, coinsRes, txRes, gamesRes, sessionsRes, recentTxs, recentUsers, topEarners] =
    await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("wallets").select("coins, total_earned"),
      admin.from("wallet_transactions").select("id", { count: "exact", head: true }),
      admin.from("games").select("id, is_active"),
      admin.from("game_sessions").select("id", { count: "exact", head: true }),
      admin
        .from("wallet_transactions")
        .select("id, type, amount, description, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("profiles")
        .select("id, display_name, username, avatar_emoji, created_at, role")
        .order("created_at", { ascending: false })
        .limit(6),
      admin
        .from("wallets")
        .select("user_id, coins, total_earned")
        .order("total_earned", { ascending: false })
        .limit(5),
    ]);

  const totalCoinsInCirculation = (coinsRes.data || []).reduce((sum, w) => sum + (w.coins || 0), 0);
  const totalEarnedEver = (coinsRes.data || []).reduce((sum, w) => sum + (w.total_earned || 0), 0);
  const activeGames = (gamesRes.data || []).filter((g) => g.is_active).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin overview"
        description="Platform health at a glance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Registered users" value={usersRes.count || 0} tone="primary" />
        <StatCard icon={Coins} label="Coins in circulation" value={totalCoinsInCirculation} tone="secondary" />
        <StatCard icon={Gamepad2} label="Games played" value={sessionsRes.count || 0} sub={`${activeGames} active games`} tone="success" />
        <StatCard icon={Sparkles} label="Total earned (all time)" value={totalEarnedEver} tone="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
            <h2 className="font-bold text-plum">Latest transactions</h2>
            <Link href="/admin/rewards" className="btn btn-ghost btn-sm">
              Ledger <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="divide-y divide-base-200">
            {recentTxs.data?.length ? (
              recentTxs.data.map((tx) => {
                const meta = TRANSACTION_TYPES[tx.type] || {};
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-base-200 text-muted shrink-0">
                      <GameIcon name={meta.icon || "Coins"} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-plum">{meta.label || tx.type}</p>
                      <p className="text-xs text-muted truncate">{tx.description}</p>
                    </div>
                    <span className="text-xs text-muted shrink-0">{formatDateTime(tx.created_at)}</span>
                    <span className={`font-bold shrink-0 ${tx.amount > 0 ? "text-success" : "text-error"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted">No transactions yet.</p>
            )}
          </div>
        </section>

        <section className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
            <h2 className="font-bold text-plum">Newest users</h2>
            <Link href="/admin/users" className="btn btn-ghost btn-sm">
              All users <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="divide-y divide-base-200">
            {recentUsers.data?.length ? (
              recentUsers.data.map((profile) => (
                <div key={profile.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-base">
                    {profile.avatar_emoji || "😀"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-plum">
                      {profile.display_name || "Player"}
                      {profile.role === "admin" && (
                        <span className="badge badge-xs badge-primary ml-2">admin</span>
                      )}
                    </p>
                    <p className="text-xs text-muted truncate">@{profile.username || "—"}</p>
                  </div>
                  <span className="text-xs text-muted shrink-0">{formatDateTime(profile.created_at)}</span>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted">No users yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-base-200">
          <h2 className="font-bold text-plum">Top earners (all time)</h2>
        </div>
        <div className="divide-y divide-base-200">
          {topEarners.data?.length ? (
            topEarners.data.map((wallet, index) => (
              <div key={wallet.user_id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className={`flex size-8 items-center justify-center rounded-full font-bold ${index === 0 ? "bg-gold text-plum" : "bg-base-200 text-muted"}`}>
                  {index + 1}
                </span>
                <span className="text-xs text-muted font-mono truncate">{wallet.user_id}</span>
                <span className="ml-auto font-bold text-plum">
                  {new Intl.NumberFormat("en-US").format(wallet.total_earned)} earned
                </span>
                <span className="w-24 text-right text-xs text-muted">
                  {new Intl.NumberFormat("en-US").format(wallet.coins)} balance
                </span>
              </div>
            ))
          ) : (
            <p className="px-5 py-8 text-center text-sm text-muted">No data yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}