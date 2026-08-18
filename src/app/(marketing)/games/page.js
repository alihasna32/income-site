import Link from "next/link";
import { Coins, Play, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { GameIcon } from "@/components/games/GameIcon";
import { ExternalGameCard } from "@/components/games/ExternalGameCard";
import { GAME_CATEGORIES } from "@/lib/constants/games";
import { getActiveGames } from "@/services/catalogService";

export const metadata = {
  title: "Games",
  description:
    "Browse all CoinQuest mini-games — memory, reaction, quizzes, puzzles and more. Free to play, fun by design.",
};

export default async function GamesPage() {
  const games = await getActiveGames();

  const grouped = Object.keys(GAME_CATEGORIES)
    .map((key) => ({
      key,
      label: GAME_CATEGORIES[key],
      games: games.filter((g) => g.category === key),
    }))
    .filter((group) => group.games.length > 0);

  return (
    <div className="py-10 sm:py-14">
      <div className="container-page">
        <PageHeader
          title="Explore games"
          description="Every game is free, lightweight and mobile-friendly. Rewards are skill-based and fairly limited per day."
        />

        {grouped.map((group) => (
          <section key={group.key} className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
              <Sparkles className="size-5 text-gold-dark" />
              {group.label}
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.games.map((game) =>
                game.embed_url ? (
                  <ExternalGameCard key={game.slug} game={game} variant="full" />
                ) : (
                <Link
                  key={game.slug}
                  href={`/games/${game.slug}`}
                  className="card bg-base-100 border border-base-300 p-5 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-orange text-plum shadow-card">
                      <GameIcon name={game.icon} className="size-6" />
                    </span>
                    <span className="badge badge-sm bg-base-200 text-muted capitalize">
                      {game.difficulty}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold text-plum">{game.title}</h3>
                  <p className="mt-1 text-sm text-muted">{game.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="coin text-gold-dark text-sm">
                      <Coins className="size-4" />
                      up to {game.config?.thresholds?.[0]?.coins || game.reward_coins}
                    </span>
                    <span className="btn btn-primary btn-sm">
                      <Play className="size-4" /> Play
                    </span>
                  </div>
                </Link>
                )
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}