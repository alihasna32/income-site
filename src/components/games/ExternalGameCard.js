"use client";

import { ExternalLink, Play } from "lucide-react";
import { GameIcon } from "@/components/games/GameIcon";
import { externalGameSrc } from "@/lib/games/external";
import { cn } from "@/lib/utils/cn";
import { ClaimRewardButton } from "@/components/games/ClaimRewardButton";

export function ExternalGameCard({ game, variant = "full", claimable = false }) {
  const src = externalGameSrc(game.embed_url);

  return (
    <div
      className={cn(
        "card bg-base-100 border border-base-300 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-200 group",
        variant === "full" && "p-5",
        variant === "featured" && "p-4 sm:p-5",
        variant === "tile" && "p-4 text-center hover:-translate-y-0.5"
      )}
    >
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-left"
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
            <span className="flex items-center gap-1 text-xs font-semibold text-secondary">
              <ExternalLink className="size-3.5" /> Opens in new tab
            </span>
            <span className="btn btn-primary btn-xs sm:btn-sm opacity-90 group-hover:opacity-100">
              <Play className="size-3.5" /> Play
            </span>
          </div>
        )}
        {variant === "tile" && (
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-semibold text-secondary">
            <ExternalLink className="size-3" /> Free play
          </p>
        )}
      </a>

      {claimable && (
        <div
          className={cn(
            "border-base-200",
            variant !== "tile" && "mt-4 flex items-center justify-between gap-2 border-t pt-3",
            variant === "tile" && "mt-2 border-t pt-2"
          )}
        >
          <ClaimRewardButton game={game} size={variant === "tile" ? "sm" : "md"} />
        </div>
      )}
    </div>
  );
}