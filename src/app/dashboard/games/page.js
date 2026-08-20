import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExternalGameCard } from "@/components/games/ExternalGameCard";
import { getActiveGames } from "@/services/catalogService";
import { GAME_CATEGORIES } from "@/lib/constants/games";

export const metadata = {
  title: "Games",
};

export default async function DashboardGamesPage() {
  const games = (await getActiveGames()).filter((game) => game.embed_url);

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
        description="Pick a game and play instantly — no setup, no downloads, free on any device."
      />

      {grouped.map((group) => (
        <section key={group.key}>
          <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
            <Sparkles className="size-5 text-gold-dark" />
            {group.label}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.games.map((game) => (
              <ExternalGameCard
                key={game.slug}
                game={game}
                variant="full"
                claimable
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
