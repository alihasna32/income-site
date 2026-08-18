import Link from "next/link";
import { ArrowRight, Coins, Gift, Sparkles, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { getSession } from "@/lib/auth/session";

export const metadata = {
  title: "Rewards",
  description:
    "See how CoinQuest rewards work — coins, XP, achievements, streaks and what you can do with them.",
};

const REWARD_SYSTEMS = [
  {
    icon: Coins,
    title: "Coins",
    description:
      "Your virtual reward balance. Earn coins from games, challenges, scratch cards, missions, streaks and referrals. Track every coin in your wallet with a full transaction history.",
    tone: "bg-primary/15 text-gold-dark",
    stat: "Balance",
    statValue: "Tracked live",
  },
  {
    icon: Sparkles,
    title: "XP",
    description:
      "Your progression points. Every activity awards XP. As XP grows, you climb from Beginner to Living Legend with 10 levels in between.",
    tone: "bg-secondary/15 text-secondary",
    stat: "Levels",
    statValue: "1 → 10",
  },
  {
    icon: Trophy,
    title: "Achievements",
    description:
      "Badges for milestones: first win, 7-day streaks, 50 games, 100 challenges, referral master and more. Each unlock also pays coins and XP.",
    tone: "bg-accent/10 text-accent",
    stat: "Badges",
    statValue: "12 and growing",
  },
  {
    icon: Gift,
    title: "Daily Rewards",
    description:
      "A guaranteed daily claim that grows with your streak. Day 7 of every cycle is a big bonus day. Streaks are the heart of CoinQuest.",
    tone: "bg-success/10 text-success",
    stat: "Day 7",
    statValue: "100 coins",
  },
];

export default async function RewardsPage() {
  const user = await getSession();
  const ctaHref = user ? "/dashboard" : "/register";
  const ctaLabel = user ? "Open your dashboard" : "Start earning";

  return (
    <div className="py-10 sm:py-14">
      <div className="container-page">
        <PageHeader
          title="How rewards work"
          description="Simple, honest reward mechanics. Everything is virtual, everything is tracked, and nothing costs real money."
        />

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {REWARD_SYSTEMS.map((reward) => (
            <div key={reward.title} className="card bg-base-100 border border-base-300 p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className={`flex size-12 items-center justify-center rounded-xl ${reward.tone}`}>
                  <reward.icon className="size-6" />
                </span>
                <div className="text-right">
                  <p className="text-xs text-muted">{reward.stat}</p>
                  <p className="font-extrabold text-plum">{reward.statValue}</p>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold text-plum">{reward.title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{reward.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-box bg-base-200 p-6">
          <div>
            <h3 className="font-bold text-plum">Ready to start earning?</h3>
            <p className="text-sm text-muted mt-1">
              Create your free account and claim your day-1 reward in under a minute.
            </p>
          </div>
          <Link href={ctaHref} className="btn btn-primary shrink-0">
            {ctaLabel} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}