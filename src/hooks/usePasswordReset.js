"use client";

import { useCallback, useEffect, useState } from "react";

const COOLDOWN_MS = 60 * 1000;

export function usePasswordReset() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(Date.now());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const reset = useCallback(() => {
    setStep("email");
    setEmail("");
    setResetToken("");
    setError("");
    setLoading(false);
    setResending(false);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  const requestCode = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send the code");
      setCooldownUntil(Date.now() + COOLDOWN_MS);
      setStep("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not resend the code");
      setCooldownUntil(Date.now() + COOLDOWN_MS);
      setError("");
    } catch (err) {
      setError(err.message);
      setCooldownUntil(Date.now() + COOLDOWN_MS);
    } finally {
      setResending(false);
    }
  };

  const verifyCode = async (code) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not verify the code");
      setResetToken(data.resetToken);
      setStep("password");
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update your password");
      setStep("success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    email,
    setEmail,
    resetToken,
    cooldownUntil,
    error,
    loading,
    resending,
    reset,
    requestCode,
    resendCode,
    verifyCode,
    updatePassword,
    setStep,
  };
}