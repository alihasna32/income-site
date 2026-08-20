import { PageHeader } from "@/components/shared/PageHeader";
import { GameShell } from "@/components/games/GameShell";
import { getActiveGames } from "@/services/catalogService";

export const metadata = {
  title: "Spin to Win",
};

export default async function SpinPage() {
  const games = await getActiveGames();
  const game = games.find((g) => g.slug === "spin-to-win");

  if (!game) {
    return (
      <div className="text-sm text-muted">
        Spin to Win is not available right now — come back soon!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spin to Win"
        description="3 spins every day — win between 10 and 100 coins per spin. Pure luck!"
      />
      <GameShell game={game} />
    </div>
  );
}