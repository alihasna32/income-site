"use client";

import { Check, Coins, Loader2, Lock, Timer } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ClaimRewardButton({ game, size = "md", claim }) {
  const amount = Math.max(1, game.reward_coins || 10);
  const { state, secondsLeft, claiming, claim: doClaim } = claim;

  const disabled =
    claiming ||
    state === "loading" ||
    state === "locked" ||
    state === "countdown" ||
    state === "claimed";

  return (
    <button
      type="button"
      onClick={doClaim}
      disabled={disabled}
      className={cn(
        "btn",
        size === "sm" && "btn-sm",
        state === "claimed"
          ? "btn-success btn-outline"
          : state === "ready"
            ? "btn-secondary"
            : "btn-neutral"
      )}
    >
      {claiming ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Claiming…
        </>
      ) : state === "claimed" ? (
        <>
          <Check className="size-4" /> Claimed today
        </>
      ) : state === "countdown" ? (
        <>
          <Timer className="size-4" /> Claim in {secondsLeft}s
        </>
      ) : state === "ready" ? (
        <>
          <Coins className="size-4" /> Claim +{amount}
        </>
      ) : state === "locked" ? (
        <>
          <Lock className="size-4" /> Play to unlock
        </>
      ) : (
        <>
          <Loader2 className="size-4 animate-spin" /> …
        </>
      )}
    </button>
  );
}