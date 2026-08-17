import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";

export async function creditReward({
  userId,
  type,
  amount,
  xp = 0,
  description = "",
  idempotencyKey,
  metadata = {},
}) {
  if (!supabaseReady()) return null;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("credit_reward", {
    p_user_id: userId,
    p_type: type,
    p_amount: amount,
    p_xp: xp,
    p_description: description,
    p_idempotency_key: idempotencyKey,
    p_metadata: metadata,
  });

  if (error) {
    console.error("[creditReward]", error.message);
    return null;
  }

  return data;
}