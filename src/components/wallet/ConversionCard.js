"use client";

import { useMemo, useState, useEffect } from "react";
import { ArrowDownUp, Coins, Loader2, Wallet as WalletIcon } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { cn } from "@/lib/utils/cn";
import { IncomeModeActivationModal } from "@/components/wallet/IncomeModeActivationModal";

const COIN_ICON = "🪙";
const TAKA_ICON = "৳";

function formatNumber(n) {
  return new Intl.NumberFormat("en-US").format(Number(n) || 0);
}

export function ConversionCard({
  initialCoins,
  initialTakaBalance,
  conversionInfo,
  incomeModeStatus = "disabled",
  incomeModeActivationSettings = {},
}) {
  const { toast } = useToast();
  const { refresh: refreshWallet, wallet } = useWallet();

  // Live values from the wallet provider (which is hydrated on mount)
  const coins = wallet?.coins ?? initialCoins ?? 0;
  const takaBalance = wallet?.taka_balance ?? initialTakaBalance ?? 0;

  const minCoins = conversionInfo?.minCoins ?? 1000;
  const coinsPerTaka = conversionInfo?.coinsPerTaka ?? 100;

  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activationModalOpen, setActivationModalOpen] = useState(false);

  const parsed = useMemo(() => {
    const raw = String(amount || "").trim();
    if (!raw) {
      return { integer: null, error: "" };
    }
    if (!/^\d+$/.test(raw)) {
      return { integer: null, error: "Enter a valid whole number of coins" };
    }
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) {
      return { integer: null, error: "Enter a positive amount" };
    }
    return { integer: n, error: "" };
  }, [amount]);

  const validations = useMemo(() => {
    if (parsed.integer === null) {
      return {
        ok: false,
        message: parsed.error,
        belowMin: false,
        insufficient: false,
      };
    }
    if (parsed.integer < minCoins) {
      return {
        ok: false,
        message: `Minimum conversion is ${formatNumber(minCoins)} coins.`,
        belowMin: true,
        insufficient: false,
      };
    }
    if (parsed.integer > coins) {
      return {
        ok: false,
        message: "Insufficient coin balance.",
        belowMin: false,
        insufficient: true,
      };
    }
    const taka = Math.floor(parsed.integer / coinsPerTaka);
    return {
      ok: true,
      message: `${formatNumber(parsed.integer)} coins = ${TAKA_ICON}${formatNumber(taka)}`,
      belowMin: false,
      insufficient: false,
      taka,
    };
  }, [parsed, minCoins, coins, coinsPerTaka]);

  const takaPreview = useMemo(() => {
    if (parsed.integer === null || !validations.ok) return 0;
    return Math.floor(parsed.integer / coinsPerTaka);
  }, [parsed, validations, coinsPerTaka]);

  const submit = async (e) => {
    e.preventDefault();
    if (!validations.ok || submitting) return;

    // Check income mode status before proceeding
    if (incomeModeStatus === "disabled") {
      setActivationModalOpen(true);
      return;
    }

    if (incomeModeStatus !== "active") {
      toast(
        "Income Mode is currently restricted. Please check your settings.",
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: parsed.integer }),
      });

      // Handle income mode disabled - server should return 403
      if (res.status === 403) {
        const errorData = await res.json();
        if (errorData.error && errorData.error.includes("Income Mode")) {
          setActivationModalOpen(true);
          return;
        }
      }

      const data = await res.json();
      if (res.ok) {
        toast(
          `Converted ${formatNumber(data.coinsSpent)} coins to ${TAKA_ICON}${formatNumber(data.takaCredited)}`,
          "success"
        );
        setAmount("");
        // Refresh wallet provider so header / page show new balances
        await refreshWallet();
      } else {
        toast(data.error || "Conversion failed", "error");
      }
    } catch {
      toast("Conversion failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const minCoinsLabel = formatNumber(minCoins);
  const coinsLabel = formatNumber(coins);
  const takaLabel = formatNumber(takaBalance);

  return (
    <>
      <section id="convert" className="card bg-base-100 border border-base-300 shadow-card p-6 scroll-mt-20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold text-plum">
            <ArrowDownUp className="size-5 text-secondary" /> Convert coins to Taka
          </h2>
          <span className="text-xs text-muted">
            Rate: <strong className="text-plum">{formatNumber(coinsPerTaka)} coins = {TAKA_ICON}1</strong>
          </span>
        </div>

        <p className="mt-1 text-sm text-muted">
          Convert your earned coins into Taka. Conversions are atomic — your coin balance is reduced
          and your Taka balance is credited in a single transaction.
        </p>

        <form onSubmit={submit} className="mt-4 space-y-4 max-w-xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-field border border-base-200 bg-base-200/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current coins</p>
              <p className="mt-1 text-2xl font-extrabold text-plum flex items-center gap-2">
                <span>{COIN_ICON}</span>
                <span>{coinsLabel}</span>
              </p>
            </div>
            <div className="rounded-field border border-base-200 bg-base-200/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current Taka balance</p>
              <p className="mt-1 text-2xl font-extrabold text-plum flex items-center gap-2">
                <WalletIcon className="size-5 text-gold-dark" />
                <span>{TAKA_ICON}{takaLabel}</span>
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="convert-amount" className="label-text font-semibold text-plum">
              Coins to convert
            </label>
            <input
              id="convert-amount"
              type="number"
              inputMode="numeric"
              min={minCoins}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "." || e.key === "," || e.key === "e" || e.key === "+" || e.key === "-") {
                  e.preventDefault();
                }
              }}
              className="input input-bordered w-full mt-1"
              placeholder={`Minimum ${minCoinsLabel}`}
              required
              disabled={submitting}
            />
            {validations.message && (
              <p
                className={cn(
                  "text-xs mt-1",
                  validations.ok ? "text-success" : "text-error"
                )}
              >
                {validations.message}
              </p>
            )}
          </div>

          <div className="rounded-field border border-secondary/30 bg-secondary/5 p-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-plum">You will receive</p>
            <p className="text-2xl font-extrabold text-secondary">
              {TAKA_ICON}{formatNumber(takaPreview)}
            </p>
          </div>

          <button
            type="submit"
            disabled={!validations.ok || submitting}
            className="btn btn-primary"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Converting…
              </>
            ) : (
              <>
                <Coins className="size-4" /> Convert coins
              </>
            )}
          </button>

          <p className="text-xs text-muted">
            Minimum {minCoinsLabel} coins · You have {coinsLabel} available
          </p>
        </form>
      </section>

      {/* Income Mode Activation Modal */}
      <IncomeModeActivationModal
        open={activationModalOpen}
        onClose={() => setActivationModalOpen(false)}
        userHasIncomeMode={incomeModeStatus}
        config={incomeModeActivationSettings}
      />
    </>
  );
}