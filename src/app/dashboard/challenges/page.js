import Link from "next/link";
import { ArrowRight, Brain, Calculator, CalendarDays, Ticket } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { TodayChallengeCard } from "@/components/dashboard/TodayChallengeCard";
import { getTodayChallenge } from "@/services/dashboardService";
import { getActiveChallenges } from "@/services/catalogService";
import { getSession } from "@/lib/auth/session";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Challenges",
};

export default async function ChallengesPage() {
  const user = await getSession();
  if (!user) return null;

  const [today, allChallenges] = await Promise.all([
    getTodayChallenge(user.id),
    getActiveChallenges(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Challenges"
        description="A fresh challenge every day. Solve it for coins and XP."
      />

      {today ? (
        <TodayChallengeCard challenge={today} />
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No active challenge"
          description="Check back soon — challenges rotate daily."
        />
      )}

      <section>
        <h2 className="text-lg font-bold text-plum">More ways to challenge yourself</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/challenges/math"
            className="card bg-base-100 border border-base-300 p-5 shadow-card hover:shadow-soft transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
                <Calculator className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-plum group-hover:text-secondary">Daily Math</h3>
                <p className="text-xs text-muted">One question a day · streak rewards</p>
              </div>
            </div>
            <span className="btn btn-outline btn-sm mt-4 self-start">
              Solve today's <ArrowRight className="size-4" />
            </span>
          </Link>
          <Link
            href="/dashboard/math-challenge"
            className="card bg-base-100 border border-base-300 p-5 shadow-card hover:shadow-soft transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <Brain className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-plum group-hover:text-secondary">Math Challenge</h3>
                <p className="text-xs text-muted">4 difficulties · timed · up to 120 coins</p>
              </div>
            </div>
            <span className="btn btn-outline btn-sm mt-4 self-start">
              Start solving <ArrowRight className="size-4" />
            </span>
          </Link>
          <Link
            href="/dashboard/scratch"
            className="card bg-base-100 border border-base-300 p-5 shadow-card hover:shadow-soft transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Ticket className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-plum group-hover:text-secondary">Scratch Cards</h3>
                <p className="text-xs text-muted">One daily card · server-picked prizes</p>
              </div>
            </div>
            <span className="btn btn-outline btn-sm mt-4 self-start">
              Scratch a card <ArrowRight className="size-4" />
            </span>
          </Link>
        </div>
      </section>

      {allChallenges.length > 1 && (
        <section>
          <h2 className="text-lg font-bold text-plum">Upcoming rotation</h2>
          <p className="mt-1 text-sm text-muted">
            These challenges appear in the daily rotation. One new one each day!
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allChallenges.map((challenge) => (
              <div key={challenge.id} className="card bg-base-100 border border-base-300 p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="badge badge-sm bg-base-200 text-muted capitalize">
                    {challenge.difficulty}
                  </span>
                  <span className="coin text-gold-dark text-xs">
                    +{challenge.reward_coins}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-plum">{challenge.title}</h3>
                <p className="mt-1 text-xs text-muted line-clamp-2">{challenge.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}