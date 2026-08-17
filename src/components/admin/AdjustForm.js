"use client";

import { useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";

export function AdjustForm() {
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (sign) => {
    const finalAmount = sign * Math.abs(Number(amount) || 0);
    if (!userId.trim()) {
      toast("Enter the user's profile id", "error");
      return;
    }
    if (finalAmount === 0) {
      toast("Enter a non-zero amount", "error");
      return;
    }
    if (reason.trim().length < 3) {
      toast("Add a short reason (audit trail)", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim(), amount: finalAmount, reason: reason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast(`Adjusted â€” new balance ${data.newBalance}`, "success");
        setAmount(0);
        setReason("");
      } else {
        toast(data.error || "Could not adjust", "error");
      }
    } catch {
      toast("Could not adjust", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card bg-base-100 border border-base-300 shadow-card p-6">
      <h2 className="font-bold text-plum">Manual adjustment</h2>
      <p className="mt-1 text-sm text-muted">
        Use sparingly â€” every adjustment is written to the user's audit trail.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="input input-bordered"
          placeholder="User id (uuid)"
          aria-label="User id"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="input input-bordered"
          placeholder="Amount"
          aria-label="Amount"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          className="input input-bordered"
          placeholder="Reason (e.g. contest prize)"
          aria-label="Reason"
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={() => submit(1)} className="btn btn-success btn-sm" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Credit coins
        </button>
        <button onClick={() => submit(-1)} className="btn btn-outline btn-error btn-sm" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Minus className="size-4" />}
          Deduct coins
        </button>
      </div>
    </section>
  );
}