import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { GAMES } from "@/lib/constants/games";
import { ensureChallengeSchedule } from "@/services/challengeScheduleService";

export async function getActiveGames({ limit } = {}) {
  if (!supabaseReady()) {
    return GAMES.filter((g) => g).slice(0, limit || GAMES.length);
  }

  const admin = createAdminClient();
  const query = admin
    .from("games")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (limit) query.limit(limit);

  const { data, error } = await query;
  if (error || !data || !data.length) {
    return GAMES.slice(0, limit || GAMES.length);
  }
  return data;
}

export async function getActiveChallenges() {
  if (!supabaseReady()) return [];
  await ensureChallengeSchedule();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("challenges")
    .select("*")
    .eq("is_active", true);
  if (error || !data) return [];
  return data;
}

export async function getScratchCampaign() {
  if (!supabaseReady()) return null;
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("scratch_campaigns")
    .select("*")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}