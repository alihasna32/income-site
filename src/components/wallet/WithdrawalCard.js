"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Send,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { formatDateTime } from "@/lib/utils/format";
import { WITHDRAWAL_METHODS, WITHDRAWAL_STATUS } from "@/lib/constants/withdrawals";
import { cn } from "@/lib/utils/cn";

export function WithdrawalCard({ minAmount, coins, totalWithdrawn, pendingAmount, withdrawals }) {
  const { toast } = useToast();
  const { refresh: refreshWallet } = useWallet();

  const [method, setMethod] = useState("mobile_wallet");
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const fields = WITHDRAWAL_METHODS[method]?.fields || [];

  const pending = withdrawals.find((w) => w.status === "pending");
  const canSubmit = !pending && coins >= minAmount;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), method, details }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(data.withdrawal);
        refreshWallet();
        toast("Withdrawal requested â€” pending review", "success");
      } else {
        toast(data.error || "Could not submit", "error");
      }
    } catch {
      toast("Could not submit withdrawal", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const minLabel = useMemo(
    () => new Intl.NumberFormat("en-US").format(minAmount),
    [minAmount]
  );

  if (done) {
    return (
      <section className="card bg-base-100 border border-base-300 shadow-card p-6 sm:p-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-8" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-plum">Withdrawal requested</h2>
        <p className="mt-2 text-sm text-muted">
          <span className="font-bold text-gold-dark">
            {new Intl.NumberFormat("en-US").format(done.amount)} coins
          </span>{" "}
          is now pending review. You'll get a notification when an admin approves or
          rejects it.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted">
          <span className="badge badge-sm bg-warning/15 text-warning capitalize">{done.status}</span>
          <span>Requested {formatDateTime(done.createdAt)}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="card bg-base-100 border border-base-300 shadow-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-plum">
          <Banknote className="size-5 text-secondary" /> Withdraw coins
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="rounded-full bg-base-200 px-3 py-1">
            Withdrawn: <strong className="text-plum">{new Intl.NumberFormat("en-US").format(totalWithdrawn)}</strong>
          </span>
          {pendingAmount > 0 && (
            <span className="rounded-full bg-warning/15 px-3 py-1 text-warning">
              Pending: {new Intl.NumberFormat("en-US").format(pendingAmount)}
            </span>
          )}
        </div>
      </div>

      {pending ? (
        <div className="mt-4 rounded-field bg-base-200 p-4 text-sm text-muted">
          You have a withdrawal of{" "}
          <strong className="text-plum">{new Intl.NumberFormat("en-US").format(pending.amount)} coins</strong>{" "}
          still pending review (requested {formatDateTime(pending.createdAt)}). You can
          request the next one once it's resolved.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4 max-w-lg">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text font-semibold text-plum">Amount (coins)</label>
              <input
                type="number"
                min={minAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input input-bordered w-full mt-1"
                placeholder={`Minimum ${minLabel}`}
                required
              />
              <p className="text-xs text-muted mt-1">
                Minimum {minLabel} Â· you have {new Intl.NumberFormat("en-US").format(coins)} available
              </p>
            </div>
            <div>
              <label className="label-text font-semibold text-plum">Method</label>
              <div className="relative mt-1">
                <select
                  value={method}
                  onChange={(e) => {
                    setMethod(e.target.value);
                    setDetails({});
                  }}
                  className="select select-bordered w-full appearance-none pr-10"
                >
                  {Object.entries(WITHDRAWAL_METHODS).map(([key, m]) => (
                    <option key={key} value={key}>{m.label}</option>
                  ))}
                </select>
                <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="label-text font-semibold text-plum">{field.label}</label>
                <input
                  value={details[field.key] || ""}
                  onChange={(e) => setDetails((d) => ({ ...d, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="input input-bordered w-full mt-1"
                  maxLength={200}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || !Number(amount) || !canSubmit}
            className="btn btn-primary"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Request withdrawal
          </button>
          {!canSubmit && (
            <p className="text-xs text-muted">
              {coins < minAmount
                ? `Withdrawals need at least ${minLabel} coins. Keep earning!`
                : "You already have a pending withdrawal."}
            </p>
          )}
        </form>
      )}

      {withdrawals.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-plum">Withdrawal history</h3>
          <div className="mt-3 divide-y divide-base-200 rounded-field border border-base-200">
            {withdrawals.map((w) => {
              const meta = WITHDRAWAL_STATUS[w.status] || WITHDRAWAL_STATUS.pending;
              return (
                <div key={w.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-plum">
                      {new Intl.NumberFormat("en-US").format(w.amount)} coins
                      <span className="ml-2 text-xs font-normal text-muted capitalize">
                        {WITHDRAWAL_METHODS[w.method]?.label || w.method}
                      </span>
                    </p>
                    <p className="text-xs text-muted">{formatDateTime(w.createdAt)}</p>
                    {w.adminNote && (
                      <p className="mt-1 text-xs text-error">Reason: {w.adminNote}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "badge badge-sm shrink-0",
                      meta.tone === "warning" && "bg-warning/15 text-warning",
                      meta.tone === "success" && "bg-success/15 text-success",
                      meta.tone === "info" && "bg-info/15 text-info",
                      meta.tone === "error" && "bg-error/15 text-error"
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}