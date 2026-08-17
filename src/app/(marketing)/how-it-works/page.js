import Link from "next/link";
import { ArrowRight, Coins, Flame, Gamepad2, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = {
  title: "How It Works",
  description:
    "Learn how CoinQuest works — earning coins, building streaks, leveling up and redeeming your virtual rewards.",
};

const STEPS = [
  {
    icon: Gamepad2,
    title: "1. Create your free account",
    description:
      "Sign up with email in under a minute. Your profile, wallet and 7-day reward cycle are created instantly. A unique referral link is generated for you automatically.",
  },
  {
    icon: Sparkles,
    title: "2. Play games & complete challenges",
    description:
      "Explore 10+ mini-games, solve the daily challenge, run math challenges and scratch your daily card. Every completed activity credits coins and XP to your account — always validated on the server.",
  },
  {
    icon: Flame,
    title: "3. Build your streak",
    description:
      "Claim your daily reward once per day. Consecutive days grow your streak and payouts. Day 7 of each cycle delivers a big bonus, and 7-day and 30-day streaks unlock special achievements.",
  },
  {
    icon: Trophy,
    title: "4. Level up & unlock achievements",
    description:
      "XP powers your level — from Beginner to Living Legend. Achievements track milestones like first win, 50 games played and referral master, each with their own coin rewards.",
  },
  {
    icon: Coins,
    title: "5. Track everything in your wallet",
    description:
      "Every coin earned is recorded in a transparent transaction history. Your wallet shows available balance, total earned, pending rewards and redemption totals.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="py-10 sm:py-14">
      <div className="container-page max-w-3xl">
        <PageHeader
          title="How CoinQuest works"
          description="A simple, honest loop: play something fun, earn virtual rewards, come back tomorrow."
        />

        <div className="mt-10 space-y-4">
          {STEPS.map((step) => (
            <div key={step.title} className="card bg-base-100 border border-base-300 p-6 shadow-card">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-orange text-plum shadow-card">
                  <step.icon className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold text-plum">{step.title}</h2>
                  <p className="mt-1.5 text-sm text-muted leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-box bg-base-200 p-6">
          <SectionHeader
            eyebrow="Fair play promise"
            title="What CoinQuest never does"
            align="left"
          />
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li className="flex gap-2"><ShieldCheck className="size-4 text-success shrink-0 mt-0.5" /> Never promises real income or profits</li>
            <li className="flex gap-2"><ShieldCheck className="size-4 text-success shrink-0 mt-0.5" /> Never sells loot boxes or paid advantages</li>
            <li className="flex gap-2"><ShieldCheck className="size-4 text-success shrink-0 mt-0.5" /> Never lets clients decide their own rewards</li>
            <li className="flex gap-2"><ShieldCheck className="size-4 text-success shrink-0 mt-0.5" /> Never hides reward rules or play limits</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link href="/register" className="btn btn-primary btn-lg">
            Get started for free <ArrowRight className="size-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}