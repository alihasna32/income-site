"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LENGTH = 6;

export function OtpVerificationForm({
  email,
  cooldownUntil,
  onVerify,
  onResend,
  onBack,
  loading,
  error,
  resending,
}) {
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [now, setNow] = useState(Date.now());
  const refs = useRef([]);

  const secondsLeft = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const focusIndex = (i) => {
    refs.current[i]?.focus();
    refs.current[i]?.select();
  };

  const setDigit = (i, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 1) {
      const next = [...digits];
      next[i] = cleaned;
      setDigits(next);
      if (i < LENGTH - 1) focusIndex(i + 1);
      return next;
    }
    if (cleaned.length > 1) {
      const next = [...digits];
      for (let k = 0; k < LENGTH && k < cleaned.length; k += 1) {
        next[k] = cleaned[k];
      }
      setDigits(next);
      focusIndex(Math.min(LENGTH - 1, cleaned.length - 1));
      return next;
    }
    return digits;
  };

  const submit = async (nextDigits) => {
    if (loading) return;
    const code = (nextDigits || digits).join("");
    if (code.length !== LENGTH) return;
    await onVerify(code);
  };

  const handleChange = (i, value) => {
    const next = setDigit(i, value);
    if (next.every((d) => d !== "") && next.join("").length === LENGTH) {
      submit(next);
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (digits[i] !== "") {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        focusIndex(i - 1);
      }
    }
    if (e.key === "ArrowLeft" && i > 0) focusIndex(i - 1);
    if (e.key === "ArrowRight" && i < LENGTH - 1) focusIndex(i + 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!text) return;
    const next = [...digits];
    for (let k = 0; k < LENGTH; k += 1) {
      next[k] = k < text.length ? text[k] : "";
    }
    setDigits(next);
    focusIndex(Math.min(LENGTH - 1, text.length - 1));
    if (text.length === LENGTH) submit(next);
  };

  const clearAll = () => {
    setDigits(Array(LENGTH).fill(""));
    focusIndex(0);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="btn btn-ghost btn-sm btn-circle"
          aria-label="Back to email"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h3 className="text-lg font-bold text-plum">Enter your code</h3>
          <p className="text-xs text-muted">
            Sent to <span className="font-semibold">{email}</span>
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
        </div>
      )}

      <div
        className="flex justify-between gap-2"
        role="group"
        aria-label="6-digit verification code"
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={loading}
            aria-label={`Digit ${i + 1}`}
            autoFocus={i === 0}
            className={cn(
              "input input-bordered w-11 sm:w-12 text-center text-xl font-bold tabular-nums",
              loading && "opacity-60"
            )}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={async () => {
          if (secondsLeft > 0 || resending) return;
          await onResend();
        }}
        disabled={secondsLeft > 0 || resending || loading}
        className="btn btn-ghost btn-sm w-full text-secondary"
      >
        {resending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : secondsLeft > 0 ? (
          <>
            <RefreshCw className="size-4" /> Resend available in {secondsLeft}s
          </>
        ) : (
          <>
            <RefreshCw className="size-4" /> Resend code
          </>
        )}
      </button>
    </form>
  );
}