"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { formatDateTime } from "@/lib/utils/format";
import { WITHDRAWAL_METHODS, WITHDRAWAL_STATUS } from "@/lib/constants/withdrawals";
import { avatarGradient, initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const STATUS_TONE = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-info/15 text-info",
  rejected: "bg-error/15 text-error",
  completed: "bg-success/15 text-success",
};

export function AdminWithdrawalsTable() {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/withdrawals", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRows(data.withdrawals || []);
      }
    } catch {
      toast("Could not load withdrawals", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, action) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: rejectNote }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(action === "approve" ? "Withdrawal approved" : "Withdrawal rejected", "success");
        setRejectNote("");
        load();
      } else {
        toast(data.error || "Could not process", "error");
      }
    } catch {
      toast("Could not process withdrawal", "error");
    } finally {
      setActingId(null);
    }
  };

  const pending = rows.filter((r) => r.status === "pending");
  const resolved = rows.filter((r) => r.status !== "pending");
  const renderRows = (list) =>
    list.map((w) => (
      <tr key={w.id} className="align-top">
        <td>
          <span className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full text-lg",
                w.user?.avatarEmoji
                  ? ""
                  : `bg-gradient-to-br ${avatarGradient(w.user?.displayName || w.user?.username || "u")}`
              )}
            >
              {w.user?.avatarEmoji ||
                initials(w.user?.displayName || w.user?.username || "U")}
            </span>
            <span>
              <span className="block font-semibold text-plum whitespace-nowrap">
                {w.user?.displayName || "Unknown"}
              </span>
              <span className="block text-xs text-muted">
                @{w.user?.username || "—"} · {w.user?.id.slice(0, 8)}…
              </span>
            </span>
          </span>
        </td>
        <td>
          <span className="font-bold text-plum whitespace-nowrap">
            {new Intl.NumberFormat("en-US").format(w.amount)} coins
          </span>
          <span className="block text-xs text-muted capitalize">
            {WITHDRAWAL_METHODS[w.method]?.label || w.method}
          </span>
        </td>
        <td className="max-w-56">
          <div className="space-y-1 text-xs text-muted">
            {Object.entries(w.details || {}).map(([key, value]) => (
              <p key={key} className="truncate">
                <span className="font-semibold text-plum capitalize">{key}:</span> {value}
              </p>
            ))}
            {w.adminNote && (
              <p className="text-error">
                <span className="font-semibold">Reason:</span> {w.adminNote}
              </p>
            )}
          </div>
        </td>
        <td className="whitespace-nowrap text-xs text-muted">
          {formatDateTime(w.createdAt)}
          {w.processedAt && (
            <span className="block">→ {formatDateTime(w.processedAt)}</span>
          )}
        </td>
        <td>
          <span className={cn("badge badge-sm", STATUS_TONE[w.status] || STATUS_TONE.pending)}>
            {(WITHDRAWAL_STATUS[w.status] || {}).label || w.status}
          </span>
        </td>
        <td className="text-right">
          {w.status === "pending" ? (
            <div className="flex justify-end gap-2">
              {w.id === actingId ? (
                <Loader2 className="size-4 animate-spin text-secondary" />
              ) : (
                <>
                  <button
                    onClick={() => act(w.id, "approve")}
                    className="btn btn-sm btn-success btn-ghost"
                    aria-label="Approve withdrawal"
                  >
                    <Check className="size-4" /> Approve
                  </button>
                  <button
                    onClick={() => act(w.id, "reject")}
                    className="btn btn-sm btn-error btn-ghost"
                    aria-label="Reject withdrawal"
                  >
                    <X className="size-4" /> Reject
                  </button>
                </>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted">—</span>
          )}
        </td>
      </tr>
    ));

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <h2 className="font-bold text-plum">
            Pending reviews{" "}
            <span className="badge badge-sm ml-1 bg-warning/15 text-warning">
              {pending.length}
            </span>
          </h2>
          {pending.length > 0 && (
            <label className="text-xs text-muted">
              Rejection note (optional)
              <input
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                maxLength={500}
                placeholder="e.g. details look incorrect"
                className="input input-sm input-bordered w-56 mt-1"
              />
            </label>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm sm:table-md">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wider">
                <th>User</th>
                <th>Amount</th>
                <th>Details</th>
                <th className="hidden lg:table-cell">Dates</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length ? (
                renderRows(pending)
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-muted">
                    <ShieldCheck className="size-6 mx-auto text-success mb-2" />
                    Nothing to review — all requests have been handled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {resolved.length > 0 && (
        <section className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
          <h2 className="px-5 pt-5 font-bold text-plum">History</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm sm:table-md">
              <thead>
                <tr className="text-muted text-xs uppercase tracking-wider">
                  <th>User</th>
                  <th>Amount</th>
                  <th>Details</th>
                  <th className="hidden lg:table-cell">Dates</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>{renderRows(resolved)}</tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}