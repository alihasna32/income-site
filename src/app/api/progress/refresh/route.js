import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { refreshProgress } from "@/services/progressService";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const allowed = await checkRateLimit({
    key: `progress:${user.id}`,
    max: 5,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Too many checks — slow down!" }, { status: 429 });
  }

  await refreshProgress(user.id);

  return NextResponse.json({ ok: true });
}