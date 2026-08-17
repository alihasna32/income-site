import Link from "next/link";
import {
  CheckCircle2,
  Coins,
  Flame,
  Gift,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

const TRUST_ITEMS = [
  { icon: Gift, text: "Free to play — no purchase needed" },
  { icon: Coins, text: "Virtual coins, just for fun" },
  { icon: Flame, text: "Streaks that keep it exciting" },
  { icon: Ticket, text: "Daily scratch cards" },
  { icon: Users, text: "Friendly community leaderboards" },
  { icon: CheckCircle2, text: "Transparent reward rules" },
];

export function TrustBar() {
  return (
    <section className="border-b border-base-300 bg-base-100">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-6">
        {TRUST_ITEMS.map((item) => (
          <span key={item.text} className="flex items-center gap-2 text-sm font-medium text-plum/80">
            <item.icon className="size-4 text-secondary" />
            {item.text}
          </span>
        ))}
      </div>
    </section>
  );
}