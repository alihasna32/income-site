import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Coins,
  History,
  PiggyBank,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CoinValue } from "@/components/shared/CoinValue";
import { GameIcon } from "@/components/games/GameIcon";
import { WithdrawalCard } from "@/components/wallet/WithdrawalCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils/format";
import { TRANSACTION_TYPES } from "@/lib/constants/transactions";

export const metadata = {
  title: "Wallet",
};

export default async function WalletPage() {
  const user = await getSession();
  if (!user) return null;

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [walletRes, txRes, todayRes, withdrawalsRes, settingsRes] = await Promise.all([
    admin.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
    admin
      .from("wallet_transactions")
      .select("id, type, amount, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    admin
      .from("wallet_transactions")
      .select("amount")
      .eq("user_id", user.id)
      .gt("amount", 0)
      .gte("created_at", today),
    admin
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("admin_settings").select("value").eq("key", "withdrawals").maybeSingle(),
  ]);

  const wallet = walletRes.data || { coins: 0, total_earned: 0, total_redeemed: 0 };
  const todayEarned = (todayRes.data || []).reduce((sum, tx) => sum + tx.amount, 0);
  const transactions = txRes.data || [];
  const withdrawals = withdrawalsRes.data || [];
  const pendingAmount = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);
  const minAmount = Number(settingsRes.data?.value?.min_amount ?? 1000);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your wallet"
        description="Here you can convert your coins as real money. All the withdrawals will be reviewed by an admin. And will be processed off-platform through your chosen method."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Coins}
          label="Available coins"
          value={<CoinValue value={wallet.coins} className="text-plum" />}
          sub="Your spendable balance"
          tone="primary"
          className="sm:col-span-1"
        />
        <StatCard
          icon={Sparkles}
          label="Today's earnings"
          value={<CoinValue value={todayEarned} className="text-plum" />}
          sub="Earned since midnight"
          tone="secondary"
        />
        <StatCard
          icon={PiggyBank}
          label="Total earned"
          value={<CoinValue value={wallet.total_earned} className="text-plum" />}
          sub={`${new Intl.NumberFormat("en-US").format(wallet.total_redeemed)} withdrawn`}
          tone="success"
        />
      </div>

      <WithdrawalCard
        minAmount={minAmount}
        coins={wallet.coins}
        totalWithdrawn={wallet.total_redeemed}
        pendingAmount={pendingAmount}
        withdrawals={withdrawals.map((w) => ({
          id: w.id,
          amount: w.amount,
          status: w.status,
          method: w.method,
          adminNote: w.admin_note,
          createdAt: w.created_at,
        }))}
      />

      <section>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
            <History className="size-5 text-gold-dark" /> Recent transactions
          </h2>
          <Link href="/dashboard/transactions" className="btn btn-ghost btn-sm">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-4">
          {transactions.length === 0 ? (
            <EmptyState
              icon={Coins}
              title="No transactions yet"
              description="Play a game, scratch a card or claim your daily reward — everything shows up here."
              action={
                <Link href="/dashboard/games" className="btn btn-primary btn-sm">
                  Play your first game
                </Link>
              }
            />
          ) : (
            <div className="card bg-base-100 border border-base-300 shadow-card divide-y divide-base-200">
              {transactions.map((tx) => {
                const meta = TRANSACTION_TYPES[tx.type] || {};
                return (
                  <div key={tx.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-base-200 text-muted">
                      <GameIcon name={meta.icon || "Coins"} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-plum">
                        {tx.description || meta.label || tx.type}
                      </p>
                      <p className="text-xs text-muted">{formatDateTime(tx.created_at)}</p>
                    </div>
                    <span
                      className={`font-extrabold shrink-0 ${
                        tx.amount > 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {new Intl.NumberFormat("en-US").format(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="rounded-box bg-base-200 p-5 text-sm text-muted flex items-start gap-3">
        <Banknote className="size-5 text-secondary shrink-0 mt-0.5" />
        <p>
          <strong className="text-plum">Withdrawals:</strong> requests are reviewed by an
          admin. Coins remain virtual until a withdrawal is approved, and payout is
          processed off-platform through your chosen method.
        </p>
      </div>
    </div>
  );
}