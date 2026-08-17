import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { BackButton } from "@/components/shared/BackButton";
import { StatCard } from "@/components/ui/StatCard";
import { AdjustForm } from "@/components/admin/AdjustForm";
import { GameIcon } from "@/components/games/GameIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils/format";
import { TRANSACTION_TYPES } from "@/lib/constants/transactions";

export const metadata = {
  title: "Rewards & Ledger",
};

export default async function AdminRewardsPage({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const PAGE_SIZE = 30;

  const admin = createAdminClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [txRes, dailyEarned, totalEarned, totalTxs] = await Promise.all([
    admin
      .from("wallet_transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    admin
      .from("wallet_transactions")
      .select("amount")
      .gt("amount", 0)
      .gte("created_at", new Date().toISOString().slice(0, 10)),
    admin
      .from("wallet_transactions")
      .select("amount")
      .gt("amount", 0),
    admin.from("wallet_transactions").select("id", { count: "exact", head: true }),
  ]);

  const todayEarned = (dailyEarned.data || []).reduce((sum, tx) => sum + tx.amount, 0);
  const everEarned = (totalEarned.data || []).reduce((sum, tx) => sum + tx.amount, 0);
  const totalPages = Math.max(1, Math.ceil((txRes.count || 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <BackButton fallback="/admin" />
      <PageHeader
        title="Rewards & ledger"
        description="Every coin movement on the platform, fully auditable."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={ArrowRight} label="Coins issued today" value={todayEarned} tone="primary" />
        <StatCard icon={ArrowRight} label="Coins issued all time" value={everEarned} tone="secondary" />
        <StatCard icon={ArrowRight} label="Total transactions" value={totalTxs.count || 0} tone="success" />
      </div>

      <AdjustForm />

      <section className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm sm:table-md">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wider">
                <th>Type</th>
                <th className="hidden md:table-cell">User</th>
                <th className="hidden lg:table-cell">Description</th>
                <th className="hidden xl:table-cell">Date</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {txRes.data?.length ? (
                txRes.data.map((tx) => {
                  const meta = TRANSACTION_TYPES[tx.type] || {};
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span className="flex items-center gap-2 font-semibold text-plum whitespace-nowrap">
                          <span className="flex size-8 items-center justify-center rounded-lg bg-base-200 text-muted">
                            <GameIcon name={meta.icon || "Coins"} className="size-4" />
                          </span>
                          {meta.label || tx.type}
                        </span>
                      </td>
                      <td className="hidden md:table-cell">
                        <code className="text-xs text-muted">{tx.user_id.slice(0, 8)}…</code>
                      </td>
                      <td className="hidden lg:table-cell text-muted max-w-64">
                        <span className="truncate block">{tx.description}</span>
                      </td>
                      <td className="hidden xl:table-cell text-muted whitespace-nowrap">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="text-right">
                        <span className={`font-bold whitespace-nowrap ${tx.amount > 0 ? "text-success" : "text-error"}`}>
                          {tx.amount > 0 ? "+" : ""}
                          {new Intl.NumberFormat("en-US").format(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-base-200 px-5 py-4">
            <Link
              href={`/admin/rewards?page=${page - 1}`}
              className={`btn btn-sm ${page <= 1 ? "btn-disabled" : "btn-outline"}`}
              aria-disabled={page <= 1}
            >
              Previous
            </Link>
            <span className="text-sm text-muted">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`/admin/rewards?page=${page + 1}`}
              className={`btn btn-sm ${page >= totalPages ? "btn-disabled" : "btn-outline"}`}
              aria-disabled={page >= totalPages}
            >
              Next
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}