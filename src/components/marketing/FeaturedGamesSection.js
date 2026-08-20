import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ExternalGameCard } from "@/components/games/ExternalGameCard";
import { getSession } from "@/lib/auth/session";

export async function FeaturedGamesSection({ games }) {
  const user = await getSession();
  const featured = games.filter((game) => game.embed_url).slice(0, 6);

  return (
    <section className="py-10 sm:py-12 bg-base-200/60">
      <div className="container-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {featured.map((game) => (
            <ExternalGameCard
              key={game.slug}
              game={game}
              variant="featured"
              locked={!user}
              claimable={!!user}
            />
          ))}
        </div>
      </div>
    </section>
  );
}