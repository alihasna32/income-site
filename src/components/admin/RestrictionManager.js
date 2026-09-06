"use client";

import { useState } from "react";
import { Ban, Clock, Loader2, ShieldOff, Unlock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/shared/ToastProvider";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const SUSPEND_DURATIONS = [
  { value: "1_day", label: "1 day" },
  { value: "3_days", label: "3 days" },
  { value: "7_days", label: "7 days" },
  { value: "30_days", label: "30 days" },
  { value: "90_days", label: "90 days" },
  { value: "365_days", label: "365 days" },
];

export function RestrictionManager({ open, onClose, userId, profile, onUpdated }) {
  const { toast } = useToast();
  const [action, setAction] = useState(null); // 'block' | 'suspend' | 'lift'
  const [duration, setDuration] = useState("7_days");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setAction(null);
    setDuration("7_days");
    setReason("");
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const submit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      let body;
      if (action === "block") {
        body = { action: "block", reason };
      } else if (action === "suspend") {
        body = { action: "suspend", type: duration, reason };
      } else if (action === "lift") {
        body = { action: "lift" };
      } else {
        setSubmitting(false);
        return;
      }

      const res = await fetch(`/api/admin/users/${userId}/restriction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "block") toast("User blocked", "success");
        else if (action === "suspend") {
          toast(data.ends_at ? `Suspended until ${formatDateTime(data.ends_at)}` : "User suspended", "success");
        } else if (action === "lift") toast("Restriction removed", "success");
        handleClose();
        onUpdated?.();
      } else {
        toast(data.error || "Could not update restriction", "error");
      }
    } catch {
      toast("Could not update restriction", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const active = profile?.activeRestriction;
  const isAdmin = profile?.role === "admin";

  return (
    <Modal open={open} onClose={handleClose} title="Account restriction" size="md">
      <div className="space-y-4">
        {isAdmin && (
          <div className="alert alert-info text-sm py-2.5">
            <ShieldOff className="size-4" />
            <span>Admins cannot be restricted from this UI.</span>
          </div>
        )}

        {!action ? (
          <>
            {active && (
              <div
                className={cn(
                  "rounded-field px-4 py-3 text-sm",
                  active.type === "blocked"
                    ? "bg-error/10 border border-error/30"
                    : "bg-warning/10 border border-warning/30"
                )}
              >
                <p className="flex items-center gap-2 font-bold text-plum">
                  {active.type === "blocked" ? (
                    <Ban className="size-4 text-error" />
                  ) : (
                    <Clock className="size-4 text-warning" />
                  )}
                  Currently {active.type === "blocked" ? "blocked" : "suspended"}
                </p>
                {active.reason && (
                  <p className="mt-1 text-muted">Reason: {active.reason}</p>
                )}
                {active.endTime && (
                  <p className="mt-1 text-xs text-muted">Ends: {formatDateTime(active.endTime)}</p>
                )}
              </div>
            )}

            <p className="text-sm text-muted">
              Choose how to manage this user's account access.
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {active && (
                <button
                  disabled={isAdmin}
                  onClick={() => setAction("lift")}
                  className="btn btn-outline border-success text-success hover:bg-success/10"
                >
                  <Unlock className="size-4" /> Lift
                </button>
              )}
              <button
                disabled={isAdmin}
                onClick={() => setAction("suspend")}
                className="btn btn-outline border-warning text-warning hover:bg-warning/10"
              >
                <Clock className="size-4" /> Suspend
              </button>
              <button
                disabled={isAdmin}
                onClick={() => setAction("block")}
                className="btn btn-outline border-error text-error hover:bg-error/10"
              >
                <Ban className="size-4" /> Block
              </button>
            </div>
          </>
        ) : action === "suspend" ? (
          <div className="space-y-4">
            <h3 className="font-bold text-plum">Suspend for how long?</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SUSPEND_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  className={cn(
                    "btn btn-sm",
                    duration === d.value ? "btn-warning" : "btn-outline"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div>
              <label className="label-text font-semibold text-plum">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                className="textarea textarea-bordered w-full mt-1"
                placeholder="e.g. Suspected multiple-account abuse"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={reset} className="btn btn-ghost btn-sm">Back</button>
              <button
                onClick={submit}
                disabled={submitting || !reason.trim()}
                className="btn btn-warning btn-sm"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Clock className="size-4" />}
                Suspend user
              </button>
            </div>
          </div>
        ) : action === "block" ? (
          <div className="space-y-4">
            <h3 className="font-bold text-plum">Block this user permanently?</h3>
            <p className="text-sm text-muted">
              The user will lose access to the dashboard immediately. This action can be reversed by lifting the block.
            </p>

            <div>
              <label className="label-text font-semibold text-plum">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                className="textarea textarea-bordered w-full mt-1"
                placeholder="e.g. Violated terms of service"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={reset} className="btn btn-ghost btn-sm">Back</button>
              <button
                onClick={submit}
                disabled={submitting || !reason.trim()}
                className="btn btn-error btn-sm"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                Block user
              </button>
            </div>
          </div>
        ) : action === "lift" ? (
          <div className="space-y-4">
            <h3 className="font-bold text-plum">Remove restriction?</h3>
            <p className="text-sm text-muted">
              The user will be able to access the dashboard again immediately.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={reset} className="btn btn-ghost btn-sm">Back</button>
              <button
                onClick={submit}
                disabled={submitting}
                className="btn btn-success btn-sm"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Unlock className="size-4" />}
                Lift restriction
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
