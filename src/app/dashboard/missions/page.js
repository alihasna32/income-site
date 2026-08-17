import { Coins, Gift, Loader2, Target } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GameIcon } from "@/components/games/GameIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { supabaseReady } from "@/lib/supabase/env";

export const metadata = {
  title: "Missions",
};

export default async function MissionsPage() {
  const user = await getSession();
  if (!user) return null;

  if (!supabaseReady()) return null;

  const admin = createAdminClient();
  const [missionsRes, progressRes] = await Promise.all([
    admin.from("missions").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    admin.from("mission_progress").select("*").eq("user_id", user.id),
  ]);

  const missions = missionsRes.data || [];
  const progressMap = new Map(
    (progressRes.data || []).map((row) => [row.mission_id, row])
  );

  const daily = missions.filter((m) => m.is_daily);
  const longTerm = missions.filter((m) => !m.is_daily);

  const renderMission = (mission) => {
    const progress = progressMap.get(mission.id) || { progress: 0, completed: false };
    const done = progress.completed;

    return (
      <div
        key={mission.id}
        className={`card min-w-0 bg-base-100 border p-5 shadow-card ${
          done ? "border-success/40" : "border-base-300"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                done ? "bg-success/10 text-success" : "bg-primary/15 text-gold-dark"
              }`}
            >
              <GameIcon name={mission.icon} className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-plum flex items-center gap-2 min-w-0">
                <span className="truncate">{mission.title}</span>
                {done && <span className="badge badge-xs badge-success shrink-0">Done</span>}
              </h3>
              <p className="text-xs text-muted truncate">{mission.description}</p>
            </div>
          </div>
          <span className="coin text-gold-dark text-sm shrink-0">
            <Coins className="size-4" /> +{mission.reward_coins}
          </span>
        </div>
        <ProgressBar
          value={Math.min(progress.progress, mission.target)}
          max={mission.target}
          tone={done ? "success" : "primary"}
          className="mt-4"
          showValue
        />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Missions"
        description="Missions track your activity automatically. Complete them and the rewards land in your wallet."
      />

      {daily.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
            <Gift className="size-5 text-gold-dark" /> Daily missions
          </h2>
          <p className="mt-1 text-sm text-muted">Fresh challenges for today.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{daily.map(renderMission)}</div>
        </section>
      )}

      {longTerm.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-lg font-bold text-plum">
            <Target className="size-5 text-secondary" /> Long-term missions
          </h2>
          <p className="mt-1 text-sm text-muted">Big goals worth chasing.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{longTerm.map(renderMission)}</div>
        </section>
      )}

      {missions.length === 0 && (
        <EmptyState
          icon={Target}
          title="No missions yet"
          description="Missions are on the way — check back soon!"
        />
      )}
    </div>
  );
}
