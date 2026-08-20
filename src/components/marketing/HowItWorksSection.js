import { Coins, Gamepad2, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";

const STEPS = [
  {
    icon: Gamepad2,
    step: "01",
    title: "Create your free account",
    description:
      "Sign up in seconds with email. You get a wallet, a referral code and a starter streak — no purchase needed, ever.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Play and complete challenges",
    description:
      "Play mini-games, scratch cards, solve math challenges and finish daily missions. Every activity earns virtual coins and XP.",
  },
  {
    icon: Coins,
    step: "03",
    title: "Build streaks and unlock rewards",
    description:
      "Come back daily, keep your streak alive, climb the leaderboard, unlock achievements and watch your coin balance grow.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-10 sm:py-12">
      <div className="container-page">
        <SectionHeader
          eyebrow="How it works"
          title="Three steps to start earning virtual rewards"
          description="Simple, transparent and fun. No hidden catches, no real money involved."
        />
        <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="card bg-base-100 border border-base-300 p-6 shadow-card hover:shadow-soft hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-orange text-plum shadow-card">
                  <step.icon className="size-6" />
                </span>
                <span className="text-3xl font-extrabold text-base-300">{step.step}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-plum">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}