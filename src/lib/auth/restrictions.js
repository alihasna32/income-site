import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fetch the active restriction (suspended or blocked) for a user.
 * Returns null if the user has no active restriction.
 * `suspended` is automatically filtered to records whose end_time is in the future (or null).
 */
export async function getActiveRestriction(userId) {
  if (!userId) return null;
  const admin = createAdminClient();
  if (!admin) return null;

  const now = new Date().toISOString();
  const { data } = await admin
    .from("user_restrictions")
    .select("id,user_id,type,start_time,end_time,reason,admin_id,created_at,updated_at")
    .eq("user_id", userId)
    .or(`type.eq.blocked,end_time.is.null,end_time.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!data || data.length === 0) return null;

  // Priority: a blocked restriction always wins.
  const blocked = data.find((r) => r.type === "blocked" && (!r.end_time || new Date(r.end_time) > new Date()));
  if (blocked) return blocked;

  // Otherwise pick the most recent still-active suspension.
  const suspended = data.find(
    (r) => r.type === "suspended" && (!r.end_time || new Date(r.end_time) > new Date())
  );
  return suspended || null;
}
