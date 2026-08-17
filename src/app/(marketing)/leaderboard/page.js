import { LeaderboardTabs } from "@/components/leaderboard/LeaderboardTabs";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = {
  title: "Leaderboard",
  description:
    "CoinQuest leaderboards — daily, weekly, monthly and all-time rankings by XP, coins and games played.",
};

export default function LeaderboardPage() {
  return (
    <div className="py-10 sm:py-14">
      <div className="container-page max-w-4xl">
        <PageHeader
          title="Leaderboard"
          description="See who's on top. We only show display names and avatars — your private data stays private."
        />
        <div className="mt-8">
          <LeaderboardTabs />
        </div>
      </div>
    </div>
  );
}