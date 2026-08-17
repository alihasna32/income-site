import Link from "next/link";
import { Coins } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameIcon } from "@/components/games/GameIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils/format";
import { TRANSACTION_TYPES } from "@/lib/constants/transactions";

export const metadata = {
  title: "Transactions",
};

const PAGE_SIZE = 25;

export default async function TransactionsPage({ searchParams }) {
  const user = await getSession();
  if (!user) return null;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const typeFilter = typeof params.type === "string" ? params.type : "";

  const admin = createAdminClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = admin
    .from("wallet_transactions")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (typeFilter && TRANSACTION_TYPES[typeFilter]) {
    query = query.eq("type", typeFilter);
  }

  const { data: transactions, count } = await query;

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Your complete, auditable reward history."
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/dashboard/transactions"
          className={`btn btn-sm shrink-0 ${!typeFilter ? "btn-primary" : "btn-ghost bg-base-200"}`}
        >
          All
        </Link>
        {Object.entries(TRANSACTION_TYPES).map(([key, meta]) => (
          <Link
            key={key}
            href={`/dashboard/transactions?type=${key}`}
            className={`btn btn-sm shrink-0 ${typeFilter === key ? "btn-primary" : "btn-ghost bg-base-200"}`}
          >
            {meta.label}
          </Link>
        ))}
      </div>

      {!transactions?.length ? (
        <EmptyState
          icon={Coins}
          title="No transactions found"
          description="Your reward history will appear here as you play."
          action={
            <Link href="/dashboard/games" className="btn btn-primary btn-sm">
              Start playing
            </Link>
          }
        />
      ) : (
        <div className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-sm sm:table-md">
              <thead>
                <tr className="text-muted text-xs uppercase tracking-wider">
                  <th>Type</th>
                  <th className="hidden sm:table-cell">Description</th>
                  <th className="hidden md:table-cell">Status</th>
                  <th className="hidden lg:table-cell">Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const meta = TRANSACTION_TYPES[tx.type] || {};
                  return (
                    <tr key={tx.id}>
                      <td>
                        <span className="flex items-center gap-2 font-semibold text-plum">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-base-200 text-muted">
                            <GameIcon name={meta.icon || "Coins"} className="size-4" />
                          </span>
                          <span className="whitespace-nowrap">{meta.label || tx.type}</span>
                        </span>
                      </td>
                      <td className="hidden sm:table-cell text-muted max-w-64">
                        <span className="truncate block">{tx.description}</span>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="badge badge-sm badge-soft bg-base-200 text-muted capitalize">
                          {tx.status}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell text-muted whitespace-nowrap">
                        {formatDateTime(tx.created_at)}
                      </td>
                      <td className="text-right">
                        <span className={`font-extrabold whitespace-nowrap ${tx.amount > 0 ? "text-success" : "text-error"}`}>
                          {tx.amount > 0 ? "+" : ""}
                          {new Intl.NumberFormat("en-US").format(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-base-200 px-5 py-4">
              <Link
                href={`/dashboard/transactions?page=${page - 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
                className={`btn btn-sm ${page <= 1 ? "btn-disabled" : "btn-outline"}`}
                aria-disabled={page <= 1}
              >
                Previous
              </Link>
              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>
              <Link
                href={`/dashboard/transactions?page=${page + 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
                className={`btn btn-sm ${page >= totalPages ? "btn-disabled" : "btn-outline"}`}
                aria-disabled={page >= totalPages}
              >
                Next
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}