import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Coins,
  History,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameIcon } from "@/components/games/GameIcon";
import { ConversionCard } from "@/components/wallet/ConversionCard";
import { TakaWithdrawalCard } from "@/components/wallet/TakaWithdrawalCard";
import { BalanceSummary } from "@/components/wallet/BalanceSummary";
import { WalletPageClient } from "@/components/wallet/WalletPageClient";
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

  const [
    walletRes,
    txRes,
    todayRes,
    adminSettingsRes,
    convSettingsRes,
    takaWithdrawalsRes,
  ] = await Promise.all([
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
    admin.from("admin_settings").select("key, value").in("key", ["taka_conversion", "taka_withdrawals"]),
    admin
      .from("conversion_settings")
      .select("coins_per_taka")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
    admin
      .from("taka_withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const wallet = walletRes.data || {
    coins: 0,
    total_earned: 0,
    total_redeemed: 0,
    taka_balance: 0,
    total_taka_withdrawn: 0,
  };

  const todayEarned = (todayRes.data || []).reduce((sum, tx) => sum + tx.amount, 0);
  const transactions = txRes.data || [];

  // Taka-related settings
  const takaConversionSettings = adminSettingsRes.data?.find((s) => s.key === "taka_conversion")?.value || {};
  const takaWithdrawalSettings = adminSettingsRes.data?.find((s) => s.key === "taka_withdrawals")?.value || {};
  const minTakaWithdrawal = Number(takaWithdrawalSettings.min_amount ?? 200);
  const minConversionCoins = Number(takaConversionSettings.min_coins ?? 1000);
  const coinsPerTaka = convSettingsRes.data?.coins_per_taka ?? 100;

  const takaWithdrawals = (takaWithdrawalsRes.data || []).map((w) => ({
    id: w.id,
    amount: w.amount,
    status: w.status,
    method: w.method,
    details: w.details,
    adminNote: w.admin_note,
    createdAt: w.created_at,
    processedAt: w.processed_at,
  }));

  return (
    <WalletPageClient>
      <div className="space-y-8">
        <PageHeader
          title="Your wallet"
          description="Convert your coins into real money. Withdrawals are reviewed by an admin and processed off-platform."
        />

        {/* Balance summary — coins and taka */}
        <BalanceSummary
          initialCoins={wallet.coins}
          initialTakaBalance={wallet.taka_balance ?? 0}
          totalEarnedToday={todayEarned}
          totalTakaWithdrawn={wallet.total_taka_withdrawn ?? 0}
        />

        {/* Coin → Taka conversion */}
        <ConversionCard
          initialCoins={wallet.coins}
          initialTakaBalance={wallet.taka_balance ?? 0}
          conversionInfo={{
            minCoins: minConversionCoins,
            coinsPerTaka,
          }}
        />

        {/* Taka withdrawal (only available when balance >= min) */}
        <TakaWithdrawalCard
          minAmount={minTakaWithdrawal}
          takaBalance={wallet.taka_balance ?? 0}
          initialWithdrawals={takaWithdrawals}
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
            <strong className="text-plum">Withdrawals:</strong> Taka withdrawal requests are reviewed
            by an admin. Taka is deducted from your balance as soon as you submit, and the payout
            is processed off-platform through your chosen method.
          </p>
        </div>
      </div>
    </WalletPageClient>
  );
}
