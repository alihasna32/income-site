import Link from "next/link";
import { ArrowRight, Coins, Play } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { GameIcon } from "@/components/games/GameIcon";

export function FeaturedGamesSection({ games }) {
  return (
    <section className="py-16 sm:py-20 bg-base-200/60">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Games"
            title="Pick a game, any game"
            description="Lightweight, mobile-friendly games with skill-based rewards. New games rotate in regularly."
            align="left"
          />
          <Link href="/games" className="btn btn-outline btn-sm shrink-0">
            View all games <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
          {games.slice(0, 6).map((game) => (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="card bg-base-100 border border-base-300 p-4 sm:p-5 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 sm:size-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-orange text-plum shadow-card">
                  <GameIcon name={game.icon} className="size-5 sm:size-6" />
                </span>
                <span className="badge badge-sm badge-soft bg-base-200 text-muted">
                  {game.difficulty}
                </span>
              </div>
              <h3 className="mt-4 text-sm sm:text-base font-bold text-plum group-hover:text-secondary transition-colors">
                {game.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted line-clamp-2">
                {game.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="coin text-gold-dark text-xs sm:text-sm">
                  <Coins className="size-3.5 sm:size-4" />
                  up to {game.config?.thresholds?.[0]?.coins || game.reward_coins}
                </span>
                <span className="btn btn-primary btn-xs sm:btn-sm opacity-90 group-hover:opacity-100">
                  <Play className="size-3.5" /> Play
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}