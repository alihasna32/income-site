import { LeaderboardTabs } from "@/components/leaderboard/LeaderboardTabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { getSession } from "@/lib/auth/session";

export const metadata = {
  title: "Leaderboard",
};

export default async function DashboardLeaderboardPage() {
  const user = await getSession();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Daily, weekly, monthly and all-time rankings. Names only — privacy always."
      />
      <LeaderboardTabs userId={user?.id} />
    </div>
  );
}