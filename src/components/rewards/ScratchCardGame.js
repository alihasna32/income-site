"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Coins,
  Loader2,
  PartyPopper,
  Sparkles,
  Ticket,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";

export function ScratchCardGame() {
  const { toast } = useToast();
  const { refresh } = useWallet();

  const canvasRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | scratching | claimed
  const [campaign, setCampaign] = useState(null);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const isScratching = useRef(false);
  const lastPoint = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/scratch/status", { cache: "no-store" });
      const data = await res.json();
      setCampaign(data.campaign);
      if (data.result) {
        setResult({ prizeLabel: data.result.prize_label, coins: data.result.reward_coins });
        setStatus("claimed");
        setRevealed(true);
      } else {
        setStatus(data.campaign ? "ready" : "unavailable");
      }
    } catch {
      setStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const size = Math.min(window.innerWidth - 48, 520);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * 0.62 * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size * 0.62}px`;
    ctx.scale(dpr, dpr);

    const gradient = ctx.createLinearGradient(0, 0, size, size * 0.62);
    gradient.addColorStop(0, "#F2C230");
    gradient.addColorStop(0.55, "#F2921D");
    gradient.addColorStop(1, "#F24F13");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size * 0.62);

    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(70, 51, 79, 0.45)";
    ctx.fillText("SCRATCH HERE", size / 2, size * 0.62 * 0.55);
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    setupCanvas();
  }, [status, setupCanvas]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top,
    };
  };

  const scratchAt = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 42;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (lastPoint.current) {
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    lastPoint.current = { x, y };

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const total = imageData.data.length / 4;
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent += 1;
    }
    const percent = Math.round((transparent / total) * 100);
    setScratchPercent(percent);
    return percent;
  };

  const claim = useCallback(async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/scratch/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setStatus("claimed");
        setRevealed(true);
        toast(`You won ${data.prizeLabel}!`, "success");
        refresh();
      } else if (res.status === 409) {
        toast("You've already scratched today", "info");
        load();
      } else {
        toast(data.error || "Could not scratch right now", "error");
        if (res.status === 429) load();
      }
    } catch {
      toast("Could not scratch right now", "error");
    } finally {
      setClaiming(false);
    }
  }, [claiming, load, refresh, toast]);

  const startScratch = () => {
    setStatus("scratching");
    setRevealed(false);
    setScratchPercent(0);
  };

  const onPointerDown = (e) => {
    if (status !== "scratching" || claiming) return;
    e.preventDefault();
    isScratching.current = true;
    lastPoint.current = null;
    const { x, y } = getPos(e);
    scratchAt(x, y);
  };

  const onPointerMove = (e) => {
    if (!isScratching.current || status !== "scratching") return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const percent = scratchAt(x, y);
    if (percent >= 65) {
      isScratching.current = false;
      setStatus("claiming-ui");
      claim();
    }
  };

  const endScratch = () => {
    isScratching.current = false;
    lastPoint.current = null;
  };

  if (status === "loading") {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-card p-8 flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-secondary" />
        <p className="text-sm text-muted">Checking your card…</p>
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <div className="card bg-base-100 border border-base-300 shadow-card p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted/15 text-muted">
          <Ticket className="size-7" />
        </span>
        <h2 className="mt-4 text-lg font-extrabold text-plum">No scratch campaign right now</h2>
        <p className="mt-1 text-sm text-muted">
          Check back soon — new scratch events are always coming.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-plum">Scratch to win</h1>
          <p className="text-sm text-muted">
            {campaign?.name || "Daily scratch card"} — one card, real server-picked prizes.
          </p>
        </div>
        <span className="badge badge-lg bg-base-200 text-muted shrink-0">
          Daily limit: {campaign?.dailyLimit || 1}
        </span>
      </div>

      {status === "ready" && (
        <div className="flex flex-col items-center gap-5">
          <div className="w-full max-w-[520px]">
            <div className="flex items-center justify-between px-1 text-sm font-semibold text-plum">
              <span>Your card</span>
              <span className="coin text-gold-dark">
                <Coins className="size-4" /> up to 500
              </span>
            </div>
            <div className="relative mt-2 overflow-hidden rounded-box border-4 border-gold/70 shadow-soft">
              <div className="flex aspect-[1.61] items-center justify-center bg-gradient-to-br from-plum to-plum-light">
                <div className="text-center px-6">
                  <Ticket className="mx-auto size-10 text-gold" />
                  <p className="mt-2 text-xl font-extrabold text-neutral-content">
                    {campaign?.name || "Daily Scratch"}
                  </p>
                  <p className="text-xs text-neutral-content/60">
                    Prize picked securely on the server
                  </p>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-pointer touch-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endScratch}
                onPointerLeave={endScratch}
                aria-label="Scratch card — drag to reveal your prize"
              />
            </div>
          </div>
          <button onClick={startScratch} className="btn btn-primary btn-lg shadow-card">
            <Ticket className="size-5" /> Scratch my card
          </button>
          <p className="text-xs text-muted max-w-sm text-center">
            Drag across the card to reveal your prize. Rewards are credited to
            your wallet automatically.
          </p>
        </div>
      )}

      {(status === "scratching" || status === "claiming-ui") && (
        <div className="flex flex-col items-center gap-5">
          <div className="w-full max-w-[520px]">
            <div className="relative overflow-hidden rounded-box border-4 border-gold/70 shadow-soft">
              <div className="flex aspect-[1.61] items-center justify-center bg-gradient-to-br from-plum to-plum-light">
                <div className="text-center px-6">
                  <Ticket className="mx-auto size-10 text-gold" />
                  <p className="mt-2 text-xl font-extrabold text-neutral-content">
                    {campaign?.name || "Daily Scratch"}
                  </p>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-pointer touch-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endScratch}
                onPointerLeave={endScratch}
                aria-label="Scratch card — drag to reveal your prize"
              />
            </div>
          </div>
          {status === "claiming-ui" && (
            <p className="flex items-center gap-2 text-sm font-bold text-secondary">
              <Loader2 className="size-4 animate-spin" /> Revealing your prize…
            </p>
          )}
        </div>
      )}

      {status === "claimed" && result && (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-gold/25 animate-ping" />
            <span className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum shadow-glow animate-pop-in">
              <PartyPopper className="size-9" />
            </span>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-extrabold text-plum">You won!</h2>
            <p className="mt-1 text-sm text-muted">{result.prizeLabel} added to your wallet</p>
            <p className="mt-3 flex items-center justify-center gap-2 text-3xl font-extrabold text-gold-dark">
              <Coins className="size-7" />
              +{result.coins}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/dashboard/wallet" className="btn btn-primary">
              <Coins className="size-4" /> View wallet
            </Link>
            <Link href="/dashboard/games" className="btn btn-outline">
              <Sparkles className="size-4" /> Play a game
            </Link>
          </div>
          <p className="text-xs text-muted">Come back tomorrow for another card!</p>
        </div>
      )}
    </div>
  );
}