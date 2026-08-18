"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Play, X } from "lucide-react";
import { GameIcon } from "@/components/games/GameIcon";
import { externalGameSrc } from "@/lib/games/external";
import { cn } from "@/lib/utils/cn";

export function ExternalGameCard({ game, variant = "full" }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const src = externalGameSrc(game.embed_url);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "card bg-base-100 border border-base-300 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-200 group",
          variant === "full" && "p-5 text-left",
          variant === "featured" && "p-4 sm:p-5 text-left",
          variant === "tile" && "p-4 text-center hover:-translate-y-0.5"
        )}
        aria-label={`Play ${game.title}`}
      >
        {variant !== "tile" && (
          <div className="flex items-start justify-between">
            <span className="flex size-11 sm:size-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-orange text-plum shadow-card">
              <GameIcon name={game.icon} className="size-5 sm:size-6" />
            </span>
            <span className="badge badge-sm bg-base-200 text-muted capitalize">
              {game.difficulty}
            </span>
          </div>
        )}
        {variant === "tile" && (
          <span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-orange text-plum">
            <GameIcon name={game.icon} className="size-5" />
          </span>
        )}
        <h3
          className={cn(
            "font-bold text-plum group-hover:text-secondary transition-colors",
            variant === "full" && "mt-4",
            variant === "featured" && "mt-4 text-sm sm:text-base",
            variant === "tile" && "mt-2 text-xs truncate"
          )}
        >
          {game.title}
        </h3>
        {variant !== "tile" && (
          <p
            className={cn(
              "mt-1 text-sm text-muted",
              variant === "featured" && "text-xs sm:text-sm line-clamp-2"
            )}
          >
            {game.description}
          </p>
        )}
        {variant !== "tile" && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary">Free play</span>
            <span className="btn btn-primary btn-xs sm:btn-sm opacity-90 group-hover:opacity-100">
              <Play className="size-3.5" /> Play
            </span>
          </div>
        )}
        {variant === "tile" && (
          <p className="text-[10px] font-semibold text-secondary mt-0.5">Free play</p>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-plum text-neutral-content" role="dialog" aria-modal="true" aria-label={`${game.title} — fullscreen`}>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <p className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-orange text-plum">
                <GameIcon name={game.icon} className="size-4" />
              </span>
              <span className="truncate">{game.title}</span>
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-xs text-neutral-content/80"
              >
                <ExternalLink className="size-3.5" /> New tab
              </a>
              <button
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm btn-circle text-neutral-content"
                aria-label="Close game"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 bg-black">
            <iframe
              src={src}
              title={game.title}
              className="h-full w-full border-0"
              scrolling="no"
              allow="autoplay; fullscreen; gamepad"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}