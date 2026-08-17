import { Award, Coins, Lock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { GameIcon } from "@/components/games/GameIcon";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const metadata = {
  title: "Achievements",
};

export default async function AchievementsPage() {
  const user = await getSession();
  if (!user) return null;

  const admin = createAdminClient();
  const [achievementsRes, userAchRes] = await Promise.all([
    admin.from("achievements").select("*").order("sort_order", { ascending: true }),
    admin.from("user_achievements").select("*").eq("user_id", user.id),
  ]);

  const achievements = achievementsRes.data || [];
  const achMap = new Map(
    (userAchRes.data || []).map((row) => [row.achievement_id, row])
  );

  const unlocked = achievements.filter((a) => achMap.get(a.id)?.unlocked_at);
  const locked = achievements.filter((a) => !achMap.get(a.id)?.unlocked_at);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Achievements"
        description={`${unlocked.length} of ${achievements.length} unlocked â€” keep going!`}
      />

      {achievements.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No achievements yet"
          description="Achievements unlock automatically as you play."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => {
            const row = achMap.get(achievement.id);
            const isUnlocked = Boolean(row?.unlocked_at);
            const progress = row?.progress || 0;
            const pct = Math.min(100, Math.round((progress / achievement.criteria_value) * 100));

            return (
              <div
                key={achievement.id}
                className={cn(
                  "card bg-base-100 border p-5 shadow-card",
                  isUnlocked ? "border-gold/60 bg-gradient-to-b from-primary/10 to-base-100" : "border-base-300"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-xl",
                      isUnlocked
                        ? "bg-gradient-to-br from-gold to-orange text-plum shadow-card"
                        : "bg-base-200 text-muted"
                    )}
                  >
                    <GameIcon name={achievement.icon} className="size-6" />
                  </span>
                  <div className="text-right shrink-0">
                    {isUnlocked ? (
                      <span className="badge badge-sm bg-gold text-plum font-bold">
                        Unlocked
                      </span>
                    ) : (
                      <span className="badge badge-sm bg-base-200 text-muted">
                        <Lock className="size-3 mr-1" /> Locked
                      </span>
                    )}
                    {achievement.reward_coins > 0 && (
                      <p className="coin text-gold-dark text-xs mt-1.5 justify-end">
                        <Coins className="size-3" /> +{achievement.reward_coins}
                      </p>
                    )}
                  </div>
                </div>
                <h3 className={cn("mt-4 font-bold", isUnlocked ? "text-plum" : "text-muted")}>
                  {achievement.title}
                </h3>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  {achievement.description}
                </p>
                <ProgressBar
                  value={progress}
                  max={achievement.criteria_value}
                  tone={isUnlocked ? "success" : "primary"}
                  className="mt-4"
                  showValue
                />
                {isUnlocked && row.unlocked_at && (
                  <p className="mt-2 text-[10px] text-muted">
                    Unlocked {formatDate(row.unlocked_at)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}