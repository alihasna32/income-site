"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Clock3, Coins, Loader2, LockKeyhole } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { cn } from "@/lib/utils/cn";

export function ClaimRewardButton({ game, size = "md" }) {
  const { toast } = useToast();
  const { refresh } = useWallet();
  const [claimed, setClaimed] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [rewardStatus, setRewardStatus] = useState(null);
  const [now, setNow] = useState(Date.now());
  const amount = Math.max(1, game.reward_coins || 10);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${game.slug}/status`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRewardStatus(data);
      setClaimed(Boolean(data.dailyRewardClaimed));
      setNow(Date.now());
    } catch {
      // The button remains safely disabled until the next successful status check.
    }
  }, [game.slug]);

  useEffect(() => {
    void loadStatus();

    const handleGameStarted = (event) => {
      if (event.detail?.slug === game.slug) void loadStatus();
    };
    window.addEventListener("external-game-started", handleGameStarted);
    return () => window.removeEventListener("external-game-started", handleGameStarted);
  }, [game.slug, loadStatus]);

  const eligibleAt = rewardStatus?.eligibleAt
    ? new Date(rewardStatus.eligibleAt).getTime()
    : null;
  const hasStarted = Boolean(rewardStatus?.startedAt);
  const secondsRemaining = eligibleAt ? Math.max(0, Math.ceil((eligibleAt - now) / 1000)) : 0;
  const canClaim = Boolean(rewardStatus?.canClaim);

  useEffect(() => {
    if (!hasStarted || claimed || canClaim || !eligibleAt) return undefined;

    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= eligibleAt) void loadStatus();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [canClaim, claimed, eligibleAt, hasStarted, loadStatus]);

  const handleClaim = async () => {
    if (claiming || claimed || !canClaim) return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/games/${game.slug}/claim`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.earned) {
        setClaimed(true);
        toast(`+${data.coins} coins claimed!`, "success");
        refresh();
      } else if (data.alreadyClaimed) {
        setClaimed(true);
        toast("Already claimed today — come back tomorrow!", "info");
      } else {
        if (data.eligibleAt) {
          setRewardStatus((current) => ({ ...current, ...data, canClaim: false }));
          setNow(Date.now());
        }
        toast(data.error || "Could not claim your reward", "error");
      }
    } catch {
      toast("Could not claim your reward", "error");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClaim}
      disabled={claimed || claiming || !canClaim}
      className={cn(
        "btn",
        size === "sm" && "btn-sm",
        claimed ? "btn-success btn-outline" : "btn-secondary"
      )}
    >
      {claiming ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Claiming…
        </>
      ) : claimed ? (
        <>
          <Check className="size-4" /> Claimed today
        </>
      ) : rewardStatus === null ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Checking…
        </>
      ) : !hasStarted ? (
        <>
          <LockKeyhole className="size-4" /> Play 1 min to unlock
        </>
      ) : secondsRemaining > 0 ? (
        <>
          <Clock3 className="size-4" /> Claim in {String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:{String(secondsRemaining % 60).padStart(2, "0")}
        </>
      ) : !canClaim ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Unlocking…
        </>
      ) : (
        <>
          <Coins className="size-4" /> Claim +{amount}
        </>
      )}
    </button>
  );
}
