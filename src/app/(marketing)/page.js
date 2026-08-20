import { HeroSection } from "@/components/marketing/HeroSection";
import { TrustBar } from "@/components/marketing/TrustBar";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { FeaturedGamesSection } from "@/components/marketing/FeaturedGamesSection";
import { SpinToWinSection } from "@/components/marketing/SpinToWinSection";
import { TopPlayersSection } from "@/components/marketing/TopPlayersSection";
import { WhyLoveItSection } from "@/components/marketing/WhyLoveItSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { CtaSection } from "@/components/marketing/CtaSection";
import { getActiveGames } from "@/services/catalogService";

export const metadata = {
  title: "Play, Challenge Yourself, Earn Rewards!",
  description:
    "CoinQuest is the free gaming platform where fun meets rewards. Play games, scratch cards, solve math challenges, keep your daily streak and climb the leaderboard — all with virtual coins.",
  keywords: [
    "free games",
    "play and earn",
    "virtual rewards",
    "daily rewards",
    "scratch cards",
    "math challenge",
    "leaderboard",
    "CoinQuest",
  ],
};

export default async function HomePage() {
  const games = await getActiveGames();

  return (
    <>
      <HeroSection />
      <TrustBar />
      <HowItWorksSection />
      <FeaturedGamesSection games={games} />
      <SpinToWinSection />
      <TopPlayersSection />
      <WhyLoveItSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}