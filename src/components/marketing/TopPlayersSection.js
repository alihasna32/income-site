import Link from "next/link";
import { ArrowRight, Crown, Medal, Trophy } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { avatarGradient, initials } from "@/lib/utils/format";

const PODIUM_STYLES = {
  1: {
    card: "py-6 sm:py-10 border-2 border-gold/50 shadow-soft",
    avatar: "size-16 sm:size-20 text-2xl sm:text-3xl",
    icon: Crown,
    iconCls: "text-gold",
    badge: "bg-gold/15 text-gold-dark",
    xpText: "text-base sm:text-xl",
    name: "text-base sm:text-lg",
    rank: "#1",
  },
  2: {
    card: "py-5 sm:py-7 border border-base-300",
    avatar: "size-12 sm:size-14 text-lg sm:text-xl",
    icon: Trophy,
    iconCls: "text-muted",
    badge: "bg-base-200 text-secondary",
    xpText: "text-sm sm:text-base",
    name: "text-sm sm:text-base",
    rank: "#2",
  },
  3: {
    card: "py-4 sm:py-5 border border-base-300",
    avatar: "size-10 sm:size-11 text-base",
    icon: Medal,
    iconCls: "text-orange",
    badge: "bg-orange/10 text-orange",
    xpText: "text-sm",
    name: "text-sm",
    rank: "#3",
  },
};

export async function TopPlayersSection() {
  let players = [];

  if (supabaseReady()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("display_name, username, xp")
      .order("xp", { ascending: false })
      .limit(3);
    players = data || [];
  }

  if (!players.length) {
    return null;
  }

  const podium = [
    { player: players[1], rank: 2 },
    { player: players[0], rank: 1 },
    { player: players[2], rank: 3 },
  ].filter((entry) => entry.player);

  const smOrder = { 1: "sm:order-2", 2: "sm:order-1", 3: "sm:order-3" };

  return (
    <section className="py-10 sm:py-12">
      <div className="container-page">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Leaderboard"
            title="Top players this season"
            description="Earn XP, climb the ranks, and make your mark. Names only — privacy always respected."
            align="left"
          />
          <Link href="/leaderboard" className="btn btn-outline btn-sm shrink-0">
            Full leaderboard <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 items-end gap-3 sm:grid-cols-3 sm:gap-4">
          {podium.map(({ player, rank }) => {
            const style = PODIUM_STYLES[rank];
            const RankIcon = style.icon;
            return (
              <div key={player.username || rank} className={`order-${rank} ${smOrder[rank]}`}>
                <div className={`card bg-base-100 px-4 text-center shadow-card ${style.card}`}>
                  <div
                    className={`mx-auto flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange font-bold text-plum shadow-card ${style.avatar}`}
                  >
                    {initials(player.display_name || player.username)}
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <RankIcon className={`size-4 sm:size-5 ${style.iconCls}`} />
                    <span className="text-[10px] font-extrabold tracking-wider text-muted uppercase">
                      {style.rank}
                    </span>
                  </div>
                  <p className={`mt-1 font-extrabold text-plum truncate ${style.name}`}>
                    {player.display_name || player.username}
                  </p>
                  <p className="text-xs text-muted">@{player.username}</p>
                  <div
                    className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 font-extrabold ${style.badge} ${style.xpText}`}
                  >
                    {new Intl.NumberFormat("en-US").format(player.xp)} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}