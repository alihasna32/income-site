import { notFound } from "next/navigation";
import { GameShell } from "@/components/games/GameShell";
import { BackButton } from "@/components/shared/BackButton";
import { getActiveGames } from "@/services/catalogService";

export const metadata = {
  title: "Play",
  robots: { index: false, follow: false },
};

export default async function PlayGamePage({ params }) {
  const { slug } = await params;
  const games = await getActiveGames();
  const game = games.find((g) => g.slug === slug);

  if (!game) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <BackButton fallback="/dashboard/games" />
      <GameShell game={game} />
    </div>
  );
}