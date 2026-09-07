"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, CheckCircle2, ChevronDown, Loader2, Send, Wallet as WalletIcon } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { formatDateTime } from "@/lib/utils/format";
import { WITHDRAWAL_STATUS } from "@/lib/constants/withdrawals";
import { cn } from "@/lib/utils/cn";

const TAKA_ICON = "৳";

const METHODS = {
  bank_transfer: {
    label: "Bank transfer",
    fields: [
      { key: "account_name", label: "Account name" },
      { key: "account_number", label: "Account number" },
      { key: "bank_name", label: "Bank name" },
    ],
  },
  mobile_wallet: {
    label: "Mobile banking",
    fields: [
      { key: "provider", label: "Provider", placeholder: "bKash / Nagad / Rocket / Upay" },
      { key: "number", label: "Mobile number", placeholder: "01XXXXXXXXX" },
    ],
  },
  paypal: {
    label: "PayPal",
    fields: [
      { key: "email", label: "PayPal email" },
    ],
  },
};

function formatNumber(n) {
  return new Intl.NumberFormat("en-US").format(Number(n) || 0);
}

export function TakaWithdrawalCard({ minAmount, takaBalance: initialTaka, initialWithdrawals }) {
  const { toast } = useToast();
  const { refresh: refreshWallet, wallet } = useWallet();

  const takaBalance = wallet?.taka_balance ?? initialTaka ?? 0;

  const [method, setMethod] = useState("mobile_wallet");
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals || []);
  const [done, setDone] = useState(null);

  // Keep the withdrawals list fresh if server-side data changes (e.g. parent re-render)
  useEffect(() => {
    if (Array.isArray(initialWithdrawals)) setWithdrawals(initialWithdrawals);
  }, [initialWithdrawals]);

  const fields = METHODS[method]?.fields || [];

  const eligible = takaBalance >= minAmount;
  const pending = withdrawals.find((w) => w.status === "pending");
  const canSubmit = eligible && !pending;

  const minLabel = formatNumber(minAmount);
  const takaLabel = formatNumber(takaBalance);

  const validation = useMemo(() => {
    const n = parseInt(amount, 10);
    if (!amount || !Number.isFinite(n) || n <= 0) {
      return { ok: false, message: `Enter an amount of at least ${TAKA_ICON}${minLabel}` };
    }
    if (n < minAmount) {
      return { ok: false, message: `Minimum withdrawal amount is ${TAKA_ICON}${minLabel}.` };
    }
    if (n > takaBalance) {
      return { ok: false, message: "Insufficient Taka balance." };
    }
    return { ok: true, message: `${TAKA_ICON}${formatNumber(n)} will be requested.` };
  }, [amount, minAmount, takaBalance]);

  const submit = async (e) => {
    e.preventDefault();
    if (!validation.ok || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/taka-withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), method, details }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(data.withdrawal);
        setAmount("");
        setDetails({});
        // Refresh wallet provider so the taka balance reflects the deduction
        await refreshWallet();
        // Append the new pending withdrawal
        setWithdrawals((prev) => [
          {
            ...data.withdrawal,
            method,
            details,
            createdAt: data.withdrawal.createdAt,
          },
          ...prev,
        ]);
        toast("Withdrawal request submitted successfully.", "success");
      } else {
        toast(data.error || "Could not submit", "error");
      }
    } catch {
      toast("Could not submit withdrawal request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="card bg-base-100 border border-base-300 shadow-card p-6 sm:p-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-8" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-plum">Withdrawal request submitted</h2>
        <p className="mt-2 text-sm text-muted">
          <span className="font-bold text-gold-dark">
            {TAKA_ICON}{formatNumber(done.amount)}
          </span>{" "}
          is now pending review. You'll be notified when an admin approves or rejects the request.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted">
          <span className="badge badge-sm bg-warning/15 text-warning capitalize">{done.status}</span>
          <span>Requested {formatDateTime(done.createdAt)}</span>
        </div>
        <button
          type="button"
          onClick={() => setDone(null)}
          className="btn btn-ghost btn-sm mt-6"
        >
          Submit another
        </button>
      </section>
    );
  }

  return (
    <section id="withdraw" className="card bg-base-100 border border-base-300 shadow-card p-6 scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-plum">
          <Banknote className="size-5 text-secondary" /> Withdraw Taka
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="rounded-full bg-base-200 px-3 py-1">
            Balance: <strong className="text-plum">{TAKA_ICON}{takaLabel}</strong>
          </span>
          <span className="rounded-full bg-base-200 px-3 py-1">
            Min: <strong className="text-plum">{TAKA_ICON}{minLabel}</strong>
          </span>
        </div>
      </div>

      {!eligible ? (
        <div className="mt-4 rounded-field border border-warning/30 bg-warning/10 p-4 text-sm">
          <p className="font-semibold text-plum">
            Minimum {TAKA_ICON}{minLabel} required for withdrawal.
          </p>
          <p className="text-muted mt-1">
            Current balance: {TAKA_ICON}{takaLabel}. Convert coins into Taka from the panel above to unlock withdrawals.
          </p>
        </div>
      ) : pending ? (
        <div className="mt-4 rounded-field bg-base-200 p-4 text-sm text-muted">
          You already have a Taka withdrawal of{" "}
          <strong className="text-plum">{TAKA_ICON}{formatNumber(pending.amount)}</strong>{" "}
          pending review (requested {formatDateTime(pending.createdAt)}). You can submit the next one once it's resolved.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4 max-w-lg">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text font-semibold text-plum">Withdrawal amount (Taka)</label>
              <input
                type="number"
                min={minAmount}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "." || e.key === "," || e.key === "e" || e.key === "+" || e.key === "-") {
                    e.preventDefault();
                  }
                }}
                className="input input-bordered w-full mt-1"
                placeholder={`Minimum ${TAKA_ICON}${minLabel}`}
                required
                disabled={submitting}
              />
              {validation.message && (
                <p className={cn("text-xs mt-1", validation.ok ? "text-success" : "text-error")}>
                  {validation.message}
                </p>
              )}
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
                  disabled={submitting}
                >
                  {Object.entries(METHODS).map(([key, m]) => (
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
                  className="input input-bordered w-full mt-1"
                  maxLength={200}
                  required
                  disabled={submitting}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!canSubmit || submitting || !validation.ok}
            className="btn btn-primary"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <Send className="size-4" /> Submit withdrawal request
              </>
            )}
          </button>

          <p className="text-xs text-muted">
            You have {TAKA_ICON}{takaLabel} available · minimum request {TAKA_ICON}{minLabel}
          </p>
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
                      {TAKA_ICON}{formatNumber(w.amount)}
                      <span className="ml-2 text-xs font-normal text-muted">
                        {METHODS[w.method]?.label || w.method}
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
