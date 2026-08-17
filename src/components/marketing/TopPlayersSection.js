import Link from "next/link";
import { ArrowRight, Crown, Trophy } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { avatarGradient, initials } from "@/lib/utils/format";

export async function TopPlayersSection() {
  let players = [];

  if (supabaseReady()) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("display_name, username, xp")
      .order("xp", { ascending: false })
      .limit(5);
    players = data || [];
  }

  if (!players.length) {
    return null;
  }

  const medals = ["text-gold", "text-muted", "text-orange"];

  return (
    <section className="py-16 sm:py-20">
      <div className="container-page">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

        <div className="mt-10 grid gap-3">
          {players.map((player, i) => (
            <div
              key={player.username || i}
              className="card bg-base-100 border border-base-300 px-4 sm:px-6 py-4 flex items-center gap-4 shadow-card"
            >
              <div className="flex w-10 justify-center">
                {i < 3 ? (
                  <Trophy className={`size-6 ${medals[i]}`} />
                ) : (
                  <span className="text-lg font-extrabold text-muted">{i + 1}</span>
                )}
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-sm font-bold text-plum">
                {initials(player.display_name || player.username)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-plum truncate">
                  {player.display_name || player.username}
                </p>
                <p className="text-xs text-muted">@{player.username}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-plum">
                  {new Intl.NumberFormat("en-US").format(player.xp)}
                </p>
                <p className="text-xs text-muted">XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}