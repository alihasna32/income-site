"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, ShieldOff, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { formatDateTime } from "@/lib/utils/format";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils/cn";

const STATUS_TONE = {
  pending: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-error/15 text-error",
  active: "bg-success/15 text-success",
  inactive: "bg-muted/15 text-muted",
  restricted: "bg-error/15 text-error",
  disabled: "bg-base-200 text-muted",
};

export function IncomeRequestsTable({ initialData = [] }) {
  const { toast } = useToast();
  const [rows, setRows] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [actingId, setActingId] = useState(null);
  const [disableFor, setDisableFor] = useState(null);
  const [disableSubmitting, setDisableSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/income-requests", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRows(data.requests || []);
      } else {
        const body = await res.json().catch(() => null);
        toast(body?.error || "Could not load income requests", "error");
      }
    } catch (err) {
      toast("Could not load income requests", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // If initialData is empty, fetch; otherwise rely on server-provided initialData but still allow refresh
    if (!initialData || initialData.length === 0) {
      load();
    }
  }, [initialData, load]);

  const act = async (id, action) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/income-requests/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        toast(action === "approve" ? "Request approved" : "Request rejected", "success");
        // Refresh list
        await load();
      } else {
        toast(data?.error || "Could not process request", "error");
      }
    } catch (err) {
      toast("Could not process request", "error");
    } finally {
      setActingId(null);
    }
  };

  const confirmDisable = async () => {
    if (!disableFor) return;
    setDisableSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${disableFor.user_id}/income-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable" }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        toast("Income Mode disabled for user", "success");
        await load();
      } else {
        toast(data?.error || "Could not disable Income Mode", "error");
      }
    } catch {
      toast("Could not disable Income Mode", "error");
    } finally {
      setDisableSubmitting(false);
      setDisableFor(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-secondary" />
      </div>
    );
  }

  const pending = rows.filter((r) => r.status === "pending");
  const resolved = rows.filter((r) => r.status !== "pending");

  const renderRow = (r) => (
    <tr key={r.id} className="align-top">
      <td>
        <div className="flex items-center gap-2.5">
          <div>
            <div className="font-semibold text-plum">{r.name || "Unknown"}</div>
            <div className="text-xs text-muted">@{(r.user_id || "—").slice ? r.user_id.slice(0, 8) : "—"}</div>
          </div>
        </div>
      </td>
      <td className="max-w-xs">
        <div className="text-sm text-muted">
          <div className="truncate">{r.transaction_id}</div>
          <div className="text-xs text-muted">{r.phone}</div>
        </div>
      </td>
      <td className="whitespace-nowrap text-xs text-muted">{formatDateTime(r.created_at)}</td>
      <td>
        <span className={cn("badge badge-sm", STATUS_TONE[r.status] || STATUS_TONE.pending)}>
          {r.status}
        </span>
      </td>
      <td className="text-right">
        {r.status === "pending" ? (
          <div className="flex justify-end gap-2">
            {actingId === r.id ? (
              <Loader2 className="size-4 animate-spin text-secondary" />
            ) : (
              <>
                <button onClick={() => act(r.id, "approve")} className="btn btn-sm btn-success btn-ghost" aria-label="Approve">
                  <Check className="size-4" /> Approve
                </button>
                <button onClick={() => act(r.id, "reject")} className="btn btn-sm btn-error btn-ghost" aria-label="Reject">
                  <X className="size-4" /> Reject
                </button>
              </>
            )}
          </div>
        ) : r.status === "approved" ? (
          <button
            onClick={() => setDisableFor(r)}
            className="btn btn-sm btn-outline btn-error"
            aria-label="Disable Income Mode"
          >
            <ShieldOff className="size-4" /> Disable Income Mode
          </button>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <section className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
        <div className="px-5 pt-5 flex items-center justify-between">
          <h2 className="font-bold text-plum">Income Mode Requests <span className="badge badge-sm ml-2">{pending.length}</span></h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm sm:table-md">
            <thead>
              <tr className="text-muted text-xs uppercase tracking-wider">
                <th>User</th>
                <th>Transaction / Phone</th>
                <th className="hidden md:table-cell">Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length ? pending.map(renderRow) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-sm text-muted">No pending requests.</td>
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
                  <th>Transaction / Phone</th>
                  <th className="hidden md:table-cell">Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resolved.map(renderRow)}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Disable Income Mode confirmation modal */}
      <Modal
        open={Boolean(disableFor)}
        onClose={() => setDisableFor(null)}
        title="Disable Income Mode?"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setDisableFor(null)}
              className="btn btn-ghost btn-sm"
              disabled={disableSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={confirmDisable}
              className="btn btn-error btn-sm"
              disabled={disableSubmitting}
            >
              {disableSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldOff className="size-4" />
              )}
              Disable Income Mode
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-error/10 text-error shrink-0">
              <ShieldOff className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-plum">
                {disableFor?.name || "User"}
              </p>
              <p className="text-xs text-muted">
                @{disableFor?.user_id?.slice(0, 8) || "—"}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted">
            This will prevent this user from converting coins into Taka until Income Mode is enabled again.
          </p>
        </div>
      </Modal>
    </div>
  );
}