import { Award, CalendarCheck, ShieldCheck, Sparkles, Trophy, Zap } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";

const REASONS = [
  {
    icon: Sparkles,
    title: "Something new every day",
    description:
      "Daily challenges, rotating missions and surprise events mean there's always a reason to come back.",
  },
  {
    icon: Zap,
    title: "Fast, lightweight games",
    description:
      "Every game loads instantly and plays smoothly on any phone. Perfect for a quick break.",
  },
  {
    icon: CalendarCheck,
    title: "Progress you can see",
    description:
      "Streaks, XP, levels and achievement badges make every session feel meaningful.",
  },
  {
    icon: ShieldCheck,
    title: "Fair and transparent",
    description:
      "Reward rules are clear, play limits are fair, and outcomes are always validated server-side.",
  },
  {
    icon: Trophy,
    title: "Friendly competition",
    description:
      "Daily, weekly and monthly leaderboards let you compete without pressure.",
  },
  {
    icon: Award,
    title: "Achievements that last",
    description:
      "Unlock badges and milestones that show off how far you've come.",
  },
];

export function WhyLoveItSection() {
  return (
    <section className="py-16 sm:py-20 bg-base-200/60">
      <div className="container-page">
        <SectionHeader
          eyebrow="Why players like it"
          title="Built for fun, designed with respect"
          description="No dark patterns, no fake promises — just honest, enjoyable earning mechanics."
        />
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <div key={reason.title} className="card bg-base-100 border border-base-300 p-5 sm:p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-gold-dark">
                <reason.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-bold text-plum">{reason.title}</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}