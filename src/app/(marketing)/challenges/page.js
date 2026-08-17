import Link from "next/link";
import { ArrowRight, Brain, Coins, Flag, RotateCcw, Ticket } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionHeader } from "@/components/shared/SectionHeader";

export const metadata = {
  title: "Challenges",
  description:
    "Daily challenges, math challenges and scratch cards on CoinQuest. New puzzles every day — free to play.",
};

const CHALLENGE_TYPES = [
  {
    icon: RotateCcw,
    title: "Daily Challenge",
    description:
      "A fresh brain-teaser every day. Riddles, logic puzzles and word games that rotate automatically.",
    points: "Up to 35 coins",
    cta: "Try today's challenge",
    href: "/dashboard/challenges",
    tone: "bg-primary/15 text-gold-dark",
  },
  {
    icon: Brain,
    title: "Math Challenge",
    description:
      "Timed arithmetic, sequences, percentages and logic across 4 difficulty levels. Test your speed.",
    points: "Up to 120 coins",
    cta: "Solve math challenges",
    href: "/dashboard/math-challenge",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    icon: Ticket,
    title: "Scratch Cards",
    description:
      "One free scratch card per day. Scratch, reveal and claim your prize. Outcomes are decided server-side — always fair.",
    points: "Up to 500 coins",
    cta: "Scratch today's card",
    href: "/dashboard/scratch",
    tone: "bg-accent/10 text-accent",
  },
  {
    icon: Flag,
    title: "Missions",
    description:
      "Play games, win rounds, maintain streaks and invite friends. Missions auto-track your progress.",
    points: "Up to 100 coins each",
    cta: "See your missions",
    href: "/dashboard/missions",
    tone: "bg-success/10 text-success",
  },
];

export default function ChallengesPage() {
  return (
    <div className="py-10 sm:py-14">
      <div className="container-page">
        <PageHeader
          title="Challenges & daily fun"
          description="There's always something to solve. Complete challenges to earn coins, XP and keep your streak alive."
        />

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {CHALLENGE_TYPES.map((item) => (
            <div key={item.title} className="card bg-base-100 border border-base-300 p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span className={`flex size-12 items-center justify-center rounded-xl ${item.tone}`}>
                  <item.icon className="size-6" />
                </span>
                <div>
                  <h3 className="font-bold text-plum">{item.title}</h3>
                  <p className="coin text-gold-dark text-xs mt-0.5">{item.points}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted leading-relaxed">{item.description}</p>
              <Link href={item.href} className="btn btn-outline btn-sm mt-5 self-start">
                {item.cta} <ArrowRight className="size-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-box bg-gradient-to-br from-plum to-plum-light p-6 sm:p-8 text-neutral-content">
          <SectionHeader
            eyebrow="Fair play"
            title="Every reward is validated server-side"
            description="You can't influence your reward by refreshing, replaying or tampering. Daily limits keep things fair for everyone, and reward rules are transparent."
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="badge badge-outline border-gold/50 text-gold">Server-validated</span>
            <span className="badge badge-outline border-white/25 text-neutral-content/80">Fair daily limits</span>
            <span className="badge badge-outline border-white/25 text-neutral-content/80">No purchases needed</span>
          </div>
        </div>
      </div>
    </div>
  );
}