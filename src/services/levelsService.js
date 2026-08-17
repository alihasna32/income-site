import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { LEVELS } from "@/lib/constants/levels";

let cachedLevels = null;

export async function getDbLevels() {
  if (!supabaseReady()) return LEVELS;
  if (cachedLevels) return cachedLevels;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("levels")
    .select("level, title, xp_required")
    .order("level", { ascending: true });
  if (error || !data || !data.length) return LEVELS;
  cachedLevels = data.map((row) => ({
    level: row.level,
    title: row.title,
    xp_required: row.xp_required,
  }));
  return cachedLevels;
}

export function levelForXp(xp, levels) {
  let current = levels[0];
  for (const level of levels) {
    if (xp >= level.xp_required) current = level;
  }
  return current;
}

export function levelProgress(xp, levels) {
  const current = levelForXp(xp, levels);
  const next = levels.find((l) => l.level === current.level + 1) || null;
  if (!next) return { level: current, next: null, progress: 100 };
  const span = next.xp_required - current.xp_required;
  const progress = Math.min(
    100,
    Math.round(((xp - current.xp_required) / span) * 100)
  );
  return { level: current, next, progress };
}