"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { startExternalGame } from "@/lib/games/external";

export function useExternalClaim(game) {
  const { toast } = useToast();
  const { refresh } = useWallet();
  const [state, setState] = useState("loading"); // loading | locked | countdown | ready | claimed
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [claiming, setClaiming] = useState(false);

  const applyData = useCallback((data) => {
    if (!data) return;
    if (data.dailyRewardClaimed) {
      setState("claimed");
      return;
    }
    if (data.canClaim) {
      setState("ready");
      return;
    }
    if (data.secondsRemaining > 0) {
      setSecondsLeft(Math.ceil(data.secondsRemaining));
      setState("countdown");
      return;
    }
    setState("locked");
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/games/${game.slug}/status`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.dailyRewardClaimed) setState("claimed");
        else if (data?.canClaim) setState("ready");
        else setState("locked");
      })
      .catch(() => {
        if (!cancelled) setState("locked");
      });
    return () => {
      cancelled = true;
    };
  }, [game.slug]);

  useEffect(() => {
    const handler = (event) => {
      if (event.detail?.slug === game.slug) applyData(event.detail);
    };
    window.addEventListener("external-game-started", handler);
    return () => window.removeEventListener("external-game-started", handler);
  }, [game.slug, applyData]);

  useEffect(() => {
    if (state !== "countdown") return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearInterval(timer);
          setState("ready");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const start = async () => {
    const data = await startExternalGame(game.slug);
    if (!data) {
      toast("Could not start the game timer", "error");
      return;
    }
    applyData(data);
  };

  const claim = async () => {
    if (claiming || state !== "ready") return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/games/${game.slug}/claim`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.earned) {
        setState("claimed");
        toast(`+${data.coins} coins claimed!`, "success");
        refresh();
      } else if (data.alreadyClaimed) {
        setState("claimed");
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

  return { state, secondsLeft, claiming, start, claim };
}