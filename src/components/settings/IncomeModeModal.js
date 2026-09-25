"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  Loader2,
  Smartphone,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export function IncomeModeModal({
  open,
  onClose,
  profile,
  onGoToIncomeSection,
}) {
  const [settings, setSettings] = useState(null);

  const [name, setName] = useState(profile?.display_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [transactionId, setTransactionId] = useState("");

  const [confirmPaid, setConfirmPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;

    setName(profile?.display_name || "");
    setPhone(profile?.phone || "");
    setTransactionId("");
    setConfirmPaid(false);
    setError("");
    setSent(false);
    setCopied(false);

    const loadSettings = async () => {
      setLoadingSettings(true);

      try {
        const res = await fetch("/api/admin/income-mode-activation", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Could not load payment settings");
        }

        const data = await res.json();

        setSettings(data?.config || null);
      } catch (err) {
        console.error("Income Mode settings:", err);
        setError("Could not load payment information");
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, [open, profile]);

  const validate = () => {
    if (!name.trim() || name.trim().length < 2) {
      return "Enter your name";
    }

    const digits = phone.replace(/[^0-9]/g, "");

    if (!digits || digits.length < 7 || digits.length > 15) {
      return "Enter a valid phone number";
    }

    if (!transactionId.trim() || transactionId.trim().length < 3) {
      return "Enter a valid transaction ID";
    }

    if (!confirmPaid) {
      return "Please confirm you have made the payment";
    }

    return null;
  };

  const copyNumber = async () => {
    const number = settings?.number;

    if (!number) return;

    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError("Could not copy the payment number");
    }
  };

  const submit = async () => {
    setError("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/income-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          transactionId: transactionId.trim(),
        }),
      });

      if (res.status === 201) {
        setSent(true);
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

      setError(
        body?.error || "Could not submit income request"
      );
    } catch (err) {
      setError(err?.message || "Could not submit income request");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    onClose();
  };

  const provider = settings?.provider || "Payment";
  const paymentNumber = settings?.number || "";
  const amount = settings?.amount ?? 100;
  const message =
    settings?.message ||
    "Complete the payment and submit the transaction details below.";

  return (
    <Modal
      open={open}
      onClose={close}
      title={sent ? "Request submitted" : "Activate Income Mode"}
      size="md"
      footer={
        sent ? (
          <button
            onClick={close}
            className="btn btn-primary"
          >
            Done
          </button>
        ) : (
          <>
            <button
              onClick={close}
              className="btn btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              onClick={submit}
              className="btn btn-primary"
              disabled={loading || loadingSettings}
            >
              {loading ? "Submitting…" : "Submit request"}
            </button>
          </>
        )
      }
    >
      {sent ? (
        <div className="py-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="size-9" />
          </div>

          <h3 className="mt-5 text-lg font-bold text-plum">
            Request submitted
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            Your request is pending review by our team.
            You will be notified when it is approved.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Payment information */}
          <div className="rounded-2xl border border-base-300 bg-base-200/60 p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CreditCard className="size-5" />
              </div>

              <div>
                <p className="text-sm font-bold text-plum">
                  Payment Details
                </p>

                <p className="text-xs text-muted">
                  Send the activation payment below
                </p>
              </div>
            </div>

            {loadingSettings ? (
              <div className="mt-5 flex items-center justify-center py-6">
                <Loader2 className="size-6 animate-spin text-secondary" />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Provider + number */}
                <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                        <Smartphone className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted">
                          {provider}
                        </p>

                        <p className="mt-0.5 truncate text-lg font-bold tracking-wide text-plum">
                          {paymentNumber || "Payment number unavailable"}
                        </p>
                      </div>
                    </div>

                    {paymentNumber && (
                      <button
                        type="button"
                        onClick={copyNumber}
                        className="btn btn-ghost btn-sm shrink-0"
                        title="Copy payment number"
                      >
                        {copied ? (
                          <>
                            <Check className="size-4 text-success" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
                  <div>
                    <p className="text-xs font-medium text-muted">
                      Activation fee
                    </p>

                    <p className="mt-1 text-sm font-semibold text-plum">
                      Send Money
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-primary">
                      ৳{Number(amount).toLocaleString("en-BD")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="rounded-xl bg-base-200/60 px-4 py-3">
            <p className="text-sm leading-6 text-muted">
              {message}
            </p>
          </div>

          {/* User information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-plum">
                Your Name
              </label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-plum">
                Your Phone Number
              </label>

              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input input-bordered w-full"
                placeholder="যে নাম্বার থেকে টাকা পাঠিয়েছেন সেটি লিখুন"
                inputMode="tel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-plum">
                Your Transaction ID
              </label>

              <input
                value={transactionId}
                onChange={(e) =>
                  setTransactionId(e.target.value)
                }
                className="input input-bordered w-full"
                placeholder="Enter your transaction ID"
              />
            </div>
          </div>

          {/* Confirmation */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-base-200/40 p-4">
            <input
              id="confirm-paid"
              type="checkbox"
              checked={confirmPaid}
              onChange={(e) =>
                setConfirmPaid(e.target.checked)
              }
              className="checkbox checkbox-primary mt-0.5"
            />

            <span className="text-sm leading-5 text-plum">
              I confirm that I have made the payment and the
              transaction details provided above are correct.
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-error/20 bg-error/5 px-4 py-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}