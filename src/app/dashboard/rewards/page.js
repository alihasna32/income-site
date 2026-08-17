import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Calculator,
  Flag,
  Gamepad2,
  Gift,
  ShoppingBag,
  Ticket,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CoinValue } from "@/components/shared/CoinValue";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";

export const metadata = {
  title: "Rewards",
};

const EARN_OPTIONS = [
  {
    href: "/dashboard/games",
    icon: Gamepad2,
    title: "Play games",
    description: "10 games, up to 30 coins each, daily plays per game.",
    color: "bg-primary/15 text-gold-dark",
  },
  {
    href: "/dashboard/scratch",
    icon: Ticket,
    title: "Scratch a card",
    description: "One fresh scratch card every day with server-picked prizes.",
    color: "bg-accent/10 text-accent",
  },
  {
    href: "/dashboard/math-challenge",
    icon: Calculator,
    title: "Math challenge",
    description: "Timed sessions in 4 difficulties â€” earn per correct answer.",
    color: "bg-secondary/15 text-secondary",
  },
  {
    href: "/dashboard/challenges",
    icon: Flag,
    title: "Daily challenge",
    description: "A new puzzle every day. Solve it for a bonus.",
    color: "bg-success/10 text-success",
  },
  {
    href: "/dashboard/",
    icon: CalendarDays,
    title: "Daily reward",
    description: "Claim once per day â€” streaks unlock bigger bonuses.",
    color: "bg-plum/10 text-plum",
  },
  {
    href: "/dashboard/referral",
    icon: Users,
    title: "Invite friends",
    description: "50 coins for you and 25 for every friend who joins.",
    color: "bg-gold/20 text-gold-dark",
  },
];

export default async function RewardsPage() {
  const user = await getSession();
  if (!user) return null;

  const admin = createAdminClient();
  const { data: wallet } = await admin
    .from("wallets")
    .select("coins")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rewards"
        description="Every path to earning coins â€” and what the future holds."
      />

      <section className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 via-gold/15 to-secondary/15 p-6 sm:p-8">
          <p className="text-sm font-semibold text-muted uppercase tracking-wider">Your balance</p>
          <div className="mt-1 flex items-end gap-3">
            <span className="text-4xl sm:text-5xl font-extrabold text-plum">
              <CoinValue value={wallet?.coins || 0} className="text-plum" />
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            Virtual coins â€” no cash value. Build streaks, climb levels and rank up.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-plum">Ways to earn</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EARN_OPTIONS.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="card bg-base-100 border border-base-300 p-5 shadow-card hover:shadow-soft hover:-translate-y-0.5 transition-all group"
            >
              <span className={`flex size-11 items-center justify-center rounded-xl ${option.color}`}>
                <option.icon className="size-5" />
              </span>
              <h3 className="mt-3 font-bold text-plum group-hover:text-secondary">{option.title}</h3>
              <p className="mt-1 text-sm text-muted">{option.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                Go <ArrowRight className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
          <ShoppingBag className="size-5 text-secondary" /> Redeem shop (coming soon)
        </h2>
        <p className="mt-2 text-sm text-muted max-w-2xl">
          We believe in compliant, transparent rewards. A virtual marketplace where
          coins can be traded for digital perks is on the roadmap â€” no cash payouts,
          ever. Get notified when it launches by watching your notifications.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["Digital badges", "Exclusive avatars", "Team perks"].map((perk) => (
            <div key={perk} className="rounded-field bg-base-200 p-4 text-center">
              <Gift className="size-5 mx-auto text-gold-dark" />
              <p className="mt-2 text-sm font-semibold text-plum">{perk}</p>
              <p className="text-xs text-muted mt-0.5">Soon</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}