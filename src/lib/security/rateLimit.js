import { createAdminClient } from "@/lib/supabase/admin";

const memoryBuckets = new Map();

function memoryCheck(key, max, windowSeconds) {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || now - bucket.windowStart > windowSeconds * 1000) {
    memoryBuckets.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

export async function checkRateLimit({ key, max, windowSeconds }) {
  const admin = createAdminClient();

  if (admin) {
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (!error && typeof data === "boolean") return data;
  }

  return memoryCheck(key, max, windowSeconds);
}