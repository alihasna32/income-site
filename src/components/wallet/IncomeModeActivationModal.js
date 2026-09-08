"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/shared/ToastProvider";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const DEFAULT_CONFIG = {
  enabled: true,
  title: "Income Mode চালু করুন",
  message:
    "এই নম্বরে ১০০ টাকা Send Money করে Income Mode চালু করুন এবং ইনকাম করুন।",
  provider: "bKash",
  number: "017XXXXXXXX",
  amount: 100,
  button_text: "Income Mode চালু করুন",
};

export function IncomeModeActivationModal({
  open,
  onClose,
  userHasIncomeMode,
}) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [numberCopied, setNumberCopied] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadConfig = async () => {
      setLoading(true);
      setNumberCopied(false);

      try {
        const res = await fetch(
          "/api/admin/income-mode-activation",
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to load configuration");
        }

        const data = await res.json();

        if (!cancelled && data?.config) {
          setConfig({
            ...DEFAULT_CONFIG,
            ...data.config,
          });
        }
      } catch {
        if (!cancelled) {
          setConfig(DEFAULT_CONFIG);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open || userHasIncomeMode === "active") {
    return null;
  }

  const handleCopy = async () => {
    if (!config.number) return;

    try {
      await navigator.clipboard.writeText(config.number);
      setNumberCopied(true);
      toast("Payment number copied", "success");

      setTimeout(() => {
        setNumberCopied(false);
      }, 2000);
    } catch {
      toast("Could not copy number", "error");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config.title}
      size="sm"
    >
      <div className="flex flex-col items-center gap-4 py-3 text-center">
        {loading ? (
          <div className="py-8">
            <span className="loading loading-spinner loading-md" />
            <p className="mt-3 text-sm text-muted">
              Loading activation information...
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm leading-6 text-muted">
              {config.message}
            </p>

            {config.provider && (
              <div className="pt-1">
                <span className="badge badge-lg bg-secondary/10 px-4 py-3 text-secondary font-bold">
                  {config.provider}
                </span>
              </div>
            )}

            <div className="w-full rounded-field border border-base-300 bg-base-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Payment Number
              </p>

              <div className="mt-2 flex items-center justify-center gap-2">
                <p className="break-all text-2xl font-extrabold tracking-wider text-plum">
                  {config.number}
                </p>

                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    "btn btn-ghost btn-sm shrink-0",
                    numberCopied
                      ? "text-success"
                      : "text-muted"
                  )}
                  aria-label="Copy payment number"
                  title="Copy payment number"
                >
                  {numberCopied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="w-full rounded-field border border-gold/30 bg-gold/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Activation Amount
              </p>

              <p className="mt-1 text-xl font-extrabold text-plum">
                Send Money: ৳
                {new Intl.NumberFormat("en-US").format(
                  config.amount
                )}
              </p>
            </div>

            <div className="mt-3 flex w-full flex-col gap-2">
              <Link
                href="/dashboard/settings"
                onClick={onClose}
                className="btn btn-primary w-full"
              >
                {config.button_text}
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-ghost w-full"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}