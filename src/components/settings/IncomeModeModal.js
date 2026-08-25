"use client";

import { useEffect, useState } from "react";
import { Check, X, CreditCard } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export function IncomeModeModal({ open, onClose, profile }) {
  const [name, setName] = useState(profile?.display_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [transactionId, setTransactionId] = useState("");
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setName(profile?.display_name || "");
      setPhone(profile?.phone || "");
      setTransactionId("");
      setConfirmPaid(false);
      setError("");
      setSent(false);
    }
  }, [open, profile]);

  const validate = () => {
    if (!name || name.trim().length < 2) return "Enter your name";
    const digits = phone.replace(/[^0-9]/g, "");
    if (!digits || digits.length < 7 || digits.length > 15) return "Enter a valid phone number";
    if (!transactionId || transactionId.trim().length < 3) return "Enter a valid transaction ID";
    if (!confirmPaid) return "Please confirm you have made the payment";
    return null;
  };

  const submit = async () => {
    setError("");
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    try {
      const res = await fetch("/api/income-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), transactionId: transactionId.trim() }),
      });

      if (res.status === 201) {
        setSent(true);
        // keep modal open to show confirmation, caller can refresh UI
        return;
      }

      if (res.status === 409) {
        setError("A pending request already exists");
        return;
      }

      if (res.status === 401) {
        setError("You must be signed in to submit a request");
        return;
      }

      const body = await res.json().catch(() => null);
      setError((body && body.error) || "Could not submit income request");
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title={sent ? "Request submitted" : "Activate Income Mode"} size="md" footer={
      sent ? (
        <>
          <button onClick={close} className="btn btn-primary">
            Done
          </button>
        </>
      ) : (
        <>
          <button onClick={close} className="btn btn-ghost">
            Cancel
          </button>
          <button onClick={submit} className="btn btn-primary" disabled={loading}>
            {loading ? "Submitting…" : "Submit request"}
          </button>
        </>
      )
    }>
      {sent ? (
        <div className="py-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-plum">Request submitted</h3>
          <p className="mt-1 text-sm text-muted">Your request is pending review by our team. You will be notified when it is approved.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">Complete the payment and submit the transaction details below. An admin will review the request.</p>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input w-full" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input w-full" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Transaction ID</label>
            <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="input w-full" />
          </div>

          <div className="flex items-start gap-3">
            <input id="confirm-paid" type="checkbox" checked={confirmPaid} onChange={(e) => setConfirmPaid(e.target.checked)} className="checkbox" />
            <label htmlFor="confirm-paid" className="text-sm">I confirm I have made the payment</label>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
