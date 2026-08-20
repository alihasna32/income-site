"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Coins,
  Flame,
  Gamepad2,
  Info,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { GameIcon } from "@/components/games/GameIcon";
import { getGameComponent } from "@/components/games/registry";
import { externalPlayerSrc, startExternalGame } from "@/lib/games/external";
import { ClaimRewardButton } from "@/components/games/ClaimRewardButton";
import { cn } from "@/lib/utils/cn";

export function GameShell({ game, children }) {
  const { toast } = useToast();
  const { refresh } = useWallet();

  const [status, setStatus] = useState("loading"); // loading | ready | playing | submitting
  const [playsLeft, setPlaysLeft] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [result, setResult] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [spinTarget, setSpinTarget] = useState(null);
  const [pendingResult, setPendingResult] = useState(null);
  const finishedRef = useRef(false);

  const GameComponent = getGameComponent(game.component);

  const maxCoins =
    game.config?.luck && Array.isArray(game.config.outcomes) && game.config.outcomes.length
      ? Math.max(...game.config.outcomes.map((o) => o.coins || 0))
      : game.config?.thresholds?.[0]?.coins || game.reward_coins;

  useEffect(() => {
    fetch(`/api/games/${game.slug}/status`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setPlaysLeft(data?.playsLeft ?? null);
        setStatus("ready");
      })
      .catch(() => setStatus("ready"));
  }, [game.slug]);

  const start = useCallback(() => {
    finishedRef.current = false;
    setResult(null);
    setSpinTarget(null);
    setPendingResult(null);
    setStartedAt(Date.now());
    setStatus("playing");
  }, []);

  const handleFinish = useCallback(
    async (score, metadata = {}) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      const durationMs = startedAt ? Date.now() - startedAt : 0;
      const idempotencyKey =
        (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      setStatus("submitting");

      try {
        const res = await fetch(`/api/games/${game.slug}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score, durationMs, idempotencyKey, metadata }),
        });
        const data = await res.json();

        if (res.ok) {
          setResult(data);
          if (data.earned) {
            toast(`+${data.coins} coins earned!`, "success");
            refresh();
          } else if (data.dailyRewardClaimed) {
            toast("Daily reward already claimed today — play again for fun!", "info");
          } else if (data.duplicate) {
            toast("Already recorded — nice play!", "info");
          } else {
            toast("Good try — play again to score higher!", "info");
          }
        } else {
          setResult({ error: data.error, earned: false, score });
          toast(data.error || "Could not record your score", "error");
        }
      } catch {
        setResult({ error: "Could not record your score", earned: false, score });
        toast("Could not record your score", "error");
      } finally {
        setStatus("ready");
      }
    },
    [game.slug, refresh, startedAt, toast]
  );

  const handleLuck = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    try {
      const res = await fetch(`/api/games/${game.slug}/luck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        if (data.segment !== undefined && data.segment !== null) {
          setPendingResult(data);
          setSpinTarget(data.segment);
          return;
        }
        setStatus("submitting");
        setResult(data);
        if (data.dailyRewardClaimed) {
          toast("Daily reward already claimed today — play again for fun!", "info");
        } else {
          toast(`${data.prizeLabel} — nice luck!`, "success");
        }
        refresh();
        setStatus("ready");
      } else {
        setResult({ error: data.error, earned: false });
        toast(data.error || "Could not record your result", "error");
      }
    } catch {
      setResult({ error: "Could not record your result", earned: false });
      toast("Could not record your result", "error");
    }
  }, [game.slug, refresh, toast]);

  const handleSpinComplete = useCallback(() => {
    setResult(pendingResult);
    setSpinTarget(null);
    setPendingResult(null);
    if (pendingResult?.dailyRewardClaimed) {
      toast("Daily reward already claimed today — play again for fun!", "info");
    } else {
      toast(`${pendingResult?.prizeLabel || "Nice luck"} — nice luck!`, "success");
    }
    refresh();
  }, [pendingResult, refresh, toast]);

  const renderStage = () => {
    if (game.embed_url) {
      const playerSrc = externalPlayerSrc(game.embed_url);

      return (
        <div className="flex min-h-[24rem] flex-col items-center justify-center gap-5 rounded-box border border-dashed border-base-300 bg-base-100 p-8 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-orange text-plum shadow-card">
            <GameIcon name={game.icon} className="size-8" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-plum">{game.title}</h1>
            <p className="mt-1 max-w-md text-sm text-muted">{game.description}</p>
          </div>
          <div>
            <a
              href={playerSrc}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void startExternalGame(game.slug)}
              className="btn btn-primary btn-lg shadow-card"
            >
              <Play className="size-5" /> Play now
            </a>
          </div>
          <ClaimRewardButton game={game} />
          <p className="text-xs text-muted">
            The game opens on its official provider page. Play for one minute to unlock your daily coins.
          </p>
        </div>
      );
    }

    if (status === "loading") {
      return <div className="skeleton h-72 w-full rounded-box" />;
    }

    if (status === "ready" && !result) {
      return (
        <div className="flex min-h-72 flex-col items-center justify-center gap-5 rounded-box border border-dashed border-base-300 bg-base-100 p-8 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-orange text-plum shadow-card">
            <GameIcon name={game.icon} className="size-8" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-plum">{game.title}</h1>
            <p className="mt-1 max-w-md text-sm text-muted">{game.description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="badge bg-base-200 text-muted capitalize">{game.difficulty}</span>
            <span className="coin badge bg-primary/15 text-gold-dark">
              <Coins className="size-3.5" /> up to {maxCoins}
            </span>
            {playsLeft !== null && (
              <span className="badge bg-base-200 text-muted">
                {playsLeft} play{playsLeft === 1 ? "" : "s"} left today
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={start} className="btn btn-primary btn-lg shadow-card" disabled={playsLeft === 0}>
              <Play className="size-5" /> Play now
            </button>
            <button
              onClick={() => setShowInstructions(true)}
              className="btn btn-outline"
              disabled={playsLeft === 0}
            >
              <Info className="size-4" /> How to play
            </button>
          </div>
          {playsLeft === 0 && (
            <p className="text-xs text-muted">
              Daily limit reached for this game — try another game or come back tomorrow!
            </p>
          )}
        </div>
      );
    }

    if (status === "playing" && GameComponent) {
      const isLuck = Boolean(game.config?.luck);
      return (
        <GameComponent
          config={game.config || {}}
          onFinish={handleFinish}
          onLuck={isLuck ? handleLuck : undefined}
          spinTarget={spinTarget}
          onSpinComplete={handleSpinComplete}
          disabled={false}
        />
      );
    }

    if (status === "submitting") {
      return (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-box border border-base-300 bg-base-100">
          <Loader2 className="size-8 animate-spin text-secondary" />
          <p className="text-sm font-semibold text-muted">Recording your score…</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {status === "playing" && (
        <div className="flex items-center justify-between">
          <button onClick={start} className="btn btn-ghost btn-sm" title="Restart">
            <RotateCcw className="size-4" /> Restart
          </button>
          <span className="badge badge-lg bg-plum text-neutral-content font-bold">
            Playing…
          </span>
        </div>
      )}

      {renderStage()}

      <Modal
        open={Boolean(result && !result.error)}
        onClose={() => setResult(null)}
        title=""
        size="sm"
      >
        {result && !result.error && (
          <div className="text-center py-2">
            <div className="relative mx-auto flex size-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <span className="relative flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum shadow-glow animate-pop-in">
                <Trophy className="size-8" />
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-plum">
              {result.earned ? "Reward earned!" : "Great effort!"}
            </h2>
            <p className="mt-1 text-sm text-muted">Your score: {result.score}</p>
            <div className="mt-5 flex justify-center gap-3">
              {result.earned && (
                <div className="flex items-center gap-2 rounded-box bg-primary/15 px-4 py-2.5">
                  <Coins className="size-5 text-gold-dark" />
                  <span className="text-lg font-extrabold text-plum">+{result.coins}</span>
                </div>
              )}
              {result.xp > 0 && (
                <div className="flex items-center gap-2 rounded-box bg-secondary/15 px-4 py-2.5">
                  <Sparkles className="size-5 text-secondary" />
                  <span className="text-lg font-extrabold text-plum">+{result.xp} XP</span>
                </div>
              )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <button onClick={start} className="btn btn-primary flex-1">
                <RotateCcw className="size-4" /> Play again
              </button>
              <Link href="/dashboard/games" onClick={() => setResult(null)} className="btn btn-outline flex-1">
                More games
              </Link>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(result?.error)}
        onClose={() => setResult(null)}
        title=""
        size="sm"
      >
        <div className="text-center py-2">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
            <X className="size-7" />
          </span>
          <h2 className="mt-4 text-xl font-extrabold text-plum">Couldn't record score</h2>
          <p className="mt-1 text-sm text-muted">{result?.error}</p>
          <button onClick={start} className="btn btn-primary mt-6 w-full">
            <RotateCcw className="size-4" /> Try again
          </button>
        </div>
      </Modal>

      <Modal
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={`How to play ${game.title}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted leading-relaxed">{game.description}</p>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2 items-center">
              <Gamepad2 className="size-4 text-secondary shrink-0" />
              Works great with mouse and touch — just tap or click.
            </li>
            <li className="flex gap-2 items-center">
              <Coins className="size-4 text-gold-dark shrink-0" />
              Higher scores earn more coins based on published thresholds.
            </li>
            <li className="flex gap-2 items-center">
              <Flame className="size-4 text-accent shrink-0" />
              Daily play limits keep rewards fair for everyone.
            </li>
          </ul>
          <button onClick={() => setShowInstructions(false)} className="btn btn-primary w-full">
            Got it
          </button>
        </div>
      </Modal>

      {children}
    </div>
  );
}
