"use client";

import { useEffect, useState } from "react";
import { Check, Coins, Loader2 } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { cn } from "@/lib/utils/cn";

export function ClaimRewardButton({ game, size = "md" }) {
  const { toast } = useToast();
  const { refresh } = useWallet();
  const [claimed, setClaimed] = useState(null);
  const [claiming, setClaiming] = useState(false);
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

  const handleClaim = async () => {
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

  return (
    <button
      type="button"
      onClick={handleClaim}
      disabled={claimed || claiming}
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
      ) : (
        <>
          <Coins className="size-4" /> Claim +{amount}
        </>
      )}
    </button>
  );
}