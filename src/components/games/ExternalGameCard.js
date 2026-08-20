"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Lock, Play, Timer } from "lucide-react";
import { GameIcon } from "@/components/games/GameIcon";
import { externalPlayerSrc } from "@/lib/games/external";
import { cn } from "@/lib/utils/cn";
import { ClaimRewardButton } from "@/components/games/ClaimRewardButton";
import { Modal } from "@/components/ui/Modal";
import { useExternalClaim } from "@/hooks/useExternalClaim";

export function ExternalGameCard({ game, variant = "full", claimable = false, locked = false }) {
  // Direct provider pages are more reliable on mobile than raw game-file embeds.
  const src = externalPlayerSrc(game.embed_url);
  const [lockedOpen, setLockedOpen] = useState(false);
  const claim = useExternalClaim(game);
  const counting = claimable && claim.state === "countdown";
  const showClaim = claimable && (claim.state === "ready" || claim.state === "claimed");

  const handleClick = (e) => {
    if (locked) {
      e.preventDefault();
      setLockedOpen(true);
      return;
    }
    if (claimable) void claim.start();
  };

  return (
    <div
      className={cn(
        "card relative bg-base-100 border border-base-300 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-200 group",
        variant === "full" && "p-5",
        variant === "featured" && "p-4 sm:p-5",
        variant === "tile" && "p-4 text-center hover:-translate-y-0.5"
      )}
    >
      {counting && (
        <span className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-plum/90 px-3 py-1.5 text-xs font-bold text-white shadow-card">
          <Timer className="size-3.5" /> Claim in {claim.secondsLeft}s
        </span>
      )}
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
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
            "font-bold text-plum text-center group-hover:text-secondary transition-colors",
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
            {locked ? (
              <span className="btn btn-primary btn-xs sm:btn-sm opacity-90 group-hover:opacity-100">
                <Lock className="size-3.5" /> Play
              </span>
            ) : (
              <span className="btn btn-primary btn-xs sm:btn-sm opacity-90 group-hover:opacity-100">
                <Play className="size-3.5" /> Play
              </span>
            )}
          </div>
        )}
        {variant === "tile" && (
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[10px] font-semibold text-secondary">
            {locked ? (
              <>
                <Lock className="size-3" /> Play
              </>
            ) : (
              <>
                <ExternalLink className="size-3" /> Free play
              </>
            )}
          </p>
        )}
      </a>

      {showClaim && (
        <div
          className={cn(
            "border-base-200",
            variant !== "tile" && "mt-4 flex items-center justify-between gap-2 border-t pt-3",
            variant === "tile" && "mt-2 border-t pt-2"
          )}
        >
          <ClaimRewardButton game={game} size={variant === "tile" ? "sm" : "md"} claim={claim} />
        </div>
      )}

      <Modal
        open={lockedOpen}
        onClose={() => setLockedOpen(false)}
        title="Join CoinQuest to play"
        size="sm"
      >
        <div className="text-center py-2">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
            <Lock className="size-7" />
          </span>
          <h3 className="mt-4 text-lg font-extrabold text-plum">{game.title}</h3>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            You want to play games for income? Please registration first! It
            takes under a minute and unlocks every game.
          </p>
          <div className="mt-6 space-y-2">
            <Link href="/register" className="btn btn-primary w-full">
              Create free account
            </Link>
            <Link href="/login" className="btn btn-outline w-full text-muted">
              I already have an account
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
