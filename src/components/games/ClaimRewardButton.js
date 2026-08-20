"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Coins, Loader2, Timer } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { cn } from "@/lib/utils/cn";

export function ClaimRewardButton({ game, size = "md" }) {
  const { toast } = useToast();
  const { refresh } = useWallet();
  const [claimed, setClaimed] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);
  const amount = Math.max(1, game.reward_coins || 10);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/games/${game.slug}/status`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setClaimed(Boolean(data?.dailyRewardClaimed));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [game.slug]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const claim = async () => {
    if (claiming || claimed) return;
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
        toast(data.error || "Could not claim your reward", "error");
      }
    } catch {
      toast("Could not claim your reward", "error");
    } finally {
      setClaiming(false);
    }
  };

  const handleClick = async () => {
    if (claiming || claimed) return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/games/${game.slug}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Could not start the game timer", "error");
        return;
      }
      if (data.dailyRewardClaimed) {
        setClaimed(true);
        toast("Already claimed today — come back tomorrow!", "info");
        return;
      }
      if (data.canClaim) {
        await claim();
        return;
      }
      const start = Math.ceil(data.secondsRemaining || 1);
      setSecondsLeft(start);
      timerRef.current = setInterval(() => {
        setSecondsLeft((current) => {
          if (current <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            claim();
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    } catch {
      toast("Could not start the game timer", "error");
    } finally {
      setClaiming(false);
    }
  };

  const waiting = secondsLeft > 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={claimed || claiming || waiting}
      className={cn(
        "btn",
        size === "sm" && "btn-sm",
        claimed ? "btn-success btn-outline" : waiting ? "btn-neutral" : "btn-secondary"
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
      ) : waiting ? (
        <>
          <Timer className="size-4" /> Claim in {secondsLeft}s
        </>
      ) : (
        <>
          <Coins className="size-4" /> Claim +{amount}
        </>
      )}
    </button>
  );
}