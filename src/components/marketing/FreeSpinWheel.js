"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Coins, Loader2, Lock, PartyPopper, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

const SEGMENTS = [10, 20, 0, 30, 50, 0, 75, 100];
const SEGMENT_ANGLE = 360 / SEGMENTS.length;

function randomCode() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function pickGuestSegment() {
  return Math.floor(Math.random() * SEGMENTS.length);
}

export function FreeSpinWheel({ isLoggedIn = false }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinTarget, setSpinTarget] = useState(null);
  const [pendingResult, setPendingResult] = useState(null);
  const [guestCode, setGuestCode] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [guestUsed, setGuestUsed] = useState(false);
  const targetedRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setGuestUsed(Boolean(window.localStorage.getItem("guestSpinUsed")));
    if (isLoggedIn) {
      fetch("/api/games/spin-to-win/status", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.playsLeft === 0) setLocked(true);
        })
        .catch(() => {});
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (spinTarget === null || spinTarget === undefined) {
      targetedRef.current = null;
      return;
    }
    if (targetedRef.current === spinTarget) return;
    targetedRef.current = spinTarget;
    setSpinning(true);
    const base = (360 - spinTarget * SEGMENT_ANGLE) % 360;
    const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE - 12);
    setRotation((current) => {
      const extra = (base + jitter - (current % 360) + 720) % 360;
      return current + 1440 + extra;
    });
  }, [spinTarget]);

  const handleTransitionEnd = () => {
    if (!spinning) return;
    setSpinning(false);
    if (spinTarget === null) return;
    const won = SEGMENTS[spinTarget];

    if (guestCode) {
      window.localStorage.setItem("guestSpinUsed", "1");
      setGuestUsed(true);
      const prize = { amount: won, code: guestCode, claimed: false };
      window.localStorage.setItem("guestSpinPrize", JSON.stringify(prize));
      setResult({
        guest: true,
        amount: won,
        title: won > 0 ? `You won +${won} coins!` : "No coins this time",
        message:
          won > 0
            ? `The +${won} coins are saved for you — create a free account to add them to your wallet.`
            : "Register for daily free spins — luck is on your side!",
      });
      setGuestCode(null);
    } else if (pendingResult) {
      setResult(pendingResult);
      setPendingResult(null);
    }
    setSpinTarget(null);
  };

  const spin = async () => {
    if (spinning || locked) return;
    setError("");
    if (guestUsed && !isLoggedIn) return;

    if (isLoggedIn) {
      try {
        const res = await fetch("/api/games/spin-to-win/luck", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (res.status === 429 || data.dailyPlaysLeft === 0) {
          setLocked(true);
          setResult({
            title: "That's all for today!",
            message: "You've used your 3 free spins — come back tomorrow for more.",
          });
          return;
        }
        if (!res.ok) {
          setError(data.error || "Could not spin right now. Try again.");
          return;
        }
        setPendingResult({
          title: data.coins > 0 ? "Coins landed!" : "No luck this time",
          amount: data.coins,
          message:
            data.coins > 0
              ? `Your +${data.coins} coins were added to your wallet instantly.`
              : "Spin again — 3 chances every day.",
        });
        setSpinTarget(data.segment);
      } catch {
        setError("Could not spin right now. Try again.");
      }
      return;
    }

    setGuestCode(randomCode());
    setSpinTarget(pickGuestSegment());
  };

  const buttonDisabled = spinning || locked || (guestUsed && !isLoggedIn);
  const buttonLabel = spinning ? "Spinning…" : locked ? "Come back tomorrow" : "Free spin";

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <div
          onTransitionEnd={handleTransitionEnd}
          className="relative size-64 sm:size-72 rounded-full border-[10px] border-plum-dark shadow-glow overflow-hidden"
          style={{
            background:
              "conic-gradient(from -22.5deg, #F2C230 0 45deg, #46334F 45deg 90deg, #F2C230 90deg 135deg, #46334F 135deg 180deg, #F2C230 180deg 225deg, #46334F 225deg 270deg, #F2C230 270deg 315deg, #46334F 315deg 360deg)",
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 2.8s cubic-bezier(0.15, 0.9, 0.3, 1.05)"
              : "none",
          }}
          aria-hidden="true"
        >
          {SEGMENTS.map((value, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{ transform: `rotate(${i * SEGMENT_ANGLE}deg)` }}
            >
              <span
                className="absolute left-1/2 top-7 sm:top-8 -translate-x-1/2 text-lg sm:text-xl font-extrabold drop-shadow"
                style={{ color: i % 2 === 1 ? "#FFF8EE" : "#46334F" }}
              >
                {value === 0 ? "0" : `+${value}`}
              </span>
            </div>
          ))}
          <div className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum shadow-card">
            <Coins className="size-6" />
          </div>
          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-full bg-plum/70 backdrop-blur-sm">
              <Lock className="size-9 text-gold" />
              <span className="text-sm font-bold text-neutral-content">Wheel locked</span>
            </div>
          )}
        </div>
        <div
          className="absolute left-1/2 -top-2 z-10 -translate-x-1/2 border-x-[14px] border-x-transparent border-t-[26px] border-t-gold drop-shadow-lg"
          aria-hidden="true"
        />
      </div>

      {error && (
        <p className="rounded-box bg-error/10 px-3 py-2 text-xs font-semibold text-error">
          {error}
        </p>
      )}

            {guestUsed && !isLoggedIn ? (
        <Link
          href="/register"
          className="btn btn-secondary btn-lg shadow-card w-full max-w-[16rem]"
        >
          <Sparkles className="size-5" /> Create account for more spins
        </Link>
      ) : (
        <button
          onClick={spin}
          disabled={buttonDisabled}
          className="btn btn-primary btn-lg shadow-card w-full max-w-[16rem]"
        >
          {spinning ? (
            <Loader2 className="size-5 animate-spin" />
          ) : locked ? (
            <Lock className="size-5" />
          ) : (
            <Sparkles className="size-5" />
          )}
          {buttonLabel}
        </button>
      )}

      <p className="text-center text-xs text-neutral-content/70">
        {isLoggedIn
          ? "3 free spins every day — coins land instantly."
          : "1 free spin, no account needed. Register to claim your coins and spin daily!"}
      </p>

      <Modal open={Boolean(result)} onClose={() => setResult(null)} title="" size="sm">
        {result && (
          <div className="text-center py-2">
            <div className="relative mx-auto flex size-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-gold/30 animate-ping" />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum shadow-glow animate-pop-in">
                <PartyPopper className="size-8" />
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-plum">{result.title}</h2>
            {result.amount > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-box bg-primary/15 px-4 py-2.5">
                <Coins className="size-5 text-gold-dark" />
                <span className="text-lg font-extrabold text-plum">+{result.amount} coins</span>
              </div>
            )}
            <p className="mt-3 text-sm text-muted leading-relaxed">{result.message}</p>

            {result.guest ? (
              <>
                <p className="mt-4 text-base font-extrabold text-plum">
                  Enjoy more, register now! 🎉
                </p>
                <div className="mt-4 space-y-2">
                  <Link href="/register" className="btn btn-primary w-full">
                    Create free account & claim coins
                  </Link>
                  <Link href="/login" className="btn btn-outline w-full text-muted">
                    I already have an account
                  </Link>
                </div>
              </>
            ) : (
              <div className="mt-6 space-y-2">
                <Link href="/dashboard/spin" className="btn btn-primary w-full">
                  Spin again
                </Link>
                <Link href="/dashboard" className="btn btn-outline w-full text-muted">
                  Go to dashboard
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}