import { Coins, Heart, ShieldCheck, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata = {
  title: "About",
  description:
    "CoinQuest is a rewards platform built on a simple idea: fun games, honest rewards and something to look forward to every day.",
};

const VALUES = [
  {
    icon: Sparkles,
    title: "Fun first",
    description:
      "Every feature exists because it makes the experience more enjoyable. If it isn't fun, it doesn't ship.",
  },
  {
    icon: ShieldCheck,
    title: "Radical honesty",
    description:
      "No fake income promises, no dark patterns. Virtual rewards for real fun â€” clearly explained, always.",
  },
  {
    icon: Target,
    title: "Fair mechanics",
    description:
      "Reward outcomes are decided and validated server-side. Daily limits keep the playing field level for everyone.",
  },
  {
    icon: Coins,
    title: "Respectful by design",
    description:
      "Streaks forgive the occasional missed day, and play limits protect players from compulsive loops.",
  },
  {
    icon: Heart,
    title: "Community-minded",
    description:
      "Leaderboards, referrals and seasonal events exist to bring players together, not to pressure them.",
  },
];

export default function AboutPage() {
  return (
    <div className="py-10 sm:py-14">
      <div className="container-page max-w-4xl">
        <PageHeader
          title="About CoinQuest"
          description="We built CoinQuest because reward apps are usually boring, pushy or misleading. We wanted the opposite: something genuinely fun, honest and worth visiting daily."
        />

        <div className="mt-10 rounded-box bg-gradient-to-br from-plum to-plum-light p-8 text-neutral-content">
          <h2 className="text-xl sm:text-2xl font-extrabold">
            Play. Challenge yourself. Earn rewards. Come back tomorrow.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-content/85 leading-relaxed">
            That's the entire product philosophy. CoinQuest blends light
            mini-games, rotating challenges, scratch cards and a 7-day reward
            cycle into one friendly place. Everything you earn is virtual â€”
            coins are for fun and progress, not for real money. That keeps the
            experience light, safe and genuinely enjoyable for everyone.
          </p>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-plum">What we value</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div key={value.title} className="card bg-base-100 border border-base-300 p-6 shadow-card">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-gold-dark">
                  <value.icon className="size-5" />
                </span>
                <h3 className="mt-3 font-bold text-plum">{value.title}</h3>
                <p className="mt-1.5 text-sm text-muted leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}