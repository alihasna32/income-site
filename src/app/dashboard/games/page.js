import Link from "next/link";
import { Coins, Play, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { GameIcon } from "@/components/games/GameIcon";
import { getActiveGames } from "@/services/catalogService";
import { GAME_CATEGORIES } from "@/lib/constants/games";

export const metadata = {
  title: "Games",
};

export default async function DashboardGamesPage() {
  const games = await getActiveGames();

  const grouped = Object.keys(GAME_CATEGORIES)
    .map((key) => ({
      key,
      label: GAME_CATEGORIES[key],
      games: games.filter((g) => g.category === key),
    }))
    .filter((group) => group.games.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Play games"
        description="Pick a game, aim for the top tier, and earn coins. Each game has a fair daily play limit."
      />

      {grouped.map((group) => (
        <section key={group.key}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
            <Sparkles className="size-5 text-gold-dark" />
            {group.label}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.games.map((game) => (
              <Link
                key={game.slug}
                href={`/dashboard/games/${game.slug}`}
                className="card bg-base-100 border border-base-300 p-5 shadow-card hover:shadow-soft hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-orange text-plum shadow-card">
                    <GameIcon name={game.icon} className="size-6" />
                  </span>
                  <div className="text-right">
                    <span className="badge badge-sm bg-base-200 text-muted capitalize">
                      {game.difficulty}
                    </span>
                    <p className="mt-1 text-[10px] text-muted">
                      {game.max_plays_per_day}/day
                    </p>
                  </div>
                </div>
                <h3 className="mt-4 font-bold text-plum group-hover:text-secondary transition-colors">
                  {game.title}
                </h3>
                <p className="mt-1 text-sm text-muted line-clamp-2">{game.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="coin text-gold-dark text-sm">
                    <Coins className="size-4" />
                    up to {game.config?.thresholds?.[0]?.coins || game.config?.outcomes?.at(-1)?.coins || game.reward_coins}
                  </span>
                  <span className="btn btn-primary btn-sm">
                    <Play className="size-4" /> Play
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}