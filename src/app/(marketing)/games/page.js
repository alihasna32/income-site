import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ExternalGameCard } from "@/components/games/ExternalGameCard";
import { GAME_CATEGORIES } from "@/lib/constants/games";
import { getActiveGames } from "@/services/catalogService";
import { getSession } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Games",
  description:
    "Browse all CoinQuest mini-games — memory, reaction, quizzes, puzzles and more. Free to play, fun by design.",
};

export default async function GamesPage() {
  const games = (await getActiveGames()).filter((game) => game.embed_url);
  let canEarnRewards = false;

  if (supabaseConfigured()) {
    try {
      canEarnRewards = Boolean(await getSession());
    } catch {
      // Guests can still play; reward controls remain hidden until sign-in is available.
    }
  }

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
          description={
            canEarnRewards
              ? "Play any game, stay in for one full minute, then claim your daily coins."
              : "Every game is free, lightweight and mobile-friendly. Sign in to earn coins after you play."
          }
        />

        {grouped.map((group) => (
          <section key={group.key} className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
              <Sparkles className="size-5 text-gold-dark" />
              {group.label}
            </h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.games.map((game) => (
                <ExternalGameCard
                  key={game.slug}
                  game={game}
                  variant="full"
                  claimable={canEarnRewards}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
