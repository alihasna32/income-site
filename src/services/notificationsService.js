import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";

export async function createNotification({ userId, type, title, message }) {
  if (!supabaseReady()) return null;
  const admin = createAdminClient();
  const { error } = await admin
    .from("notifications")
    .insert({ user_id: userId, type, title, message });
  if (error) console.error("[notifications]", error.message);
}

export async function notifyMany(userIds, { type, title, message }) {
  if (!supabaseReady() || !userIds.length) return;
  const admin = createAdminClient();
  const rows = userIds.map((userId) => ({
    user_id: userId,
    type,
    title,
    message,
  }));
  const { error } = await admin.from("notifications").insert(rows);
  if (error) console.error("[notifications]", error.message);
}