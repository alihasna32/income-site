import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { creditReward } from "@/lib/rewards/credit";

export const dynamic = "force-dynamic";

const ALLOWED_AMOUNTS = new Set([0, 10, 20, 30, 50, 75, 100]);

export async function POST(request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const amount = Number(body.amount);
  const code = String(body.code || "");
  if (!ALLOWED_AMOUNTS.has(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid prize" }, { status: 400 });
  }
  if (!code || code.length < 6 || code.length > 64) {
    return NextResponse.json({ error: "Invalid claim code" }, { status: 400 });
  }

  const allowed = await checkRateLimit({
    key: `guest-spin-claim:${user.id}`,
    max: 2,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests — slow down!" }, { status: 429 });
  }

  const result = await creditReward({
    userId: user.id,
    type: "guest_reward",
    amount,
    xp: Math.max(1, Math.round(amount / 5)),
    description: "Free spin bonus from the welcome wheel",
    idempotencyKey: `guest-spin:${user.id}:${code}`,
    metadata: { source: "guest_wheel" },
  });

  if (result?.duplicate) {
    return NextResponse.json({ coins: amount, xp: 0, duplicate: true });
  }

  const admin = createAdminClient();
  await admin
    .from("notifications")
    .insert({
      user_id: user.id,
      type: "reward",
      title: "Free spin coins added!",
      message: `Your welcome-wheel spin added +${amount} coins to your wallet.`,
    });

  return NextResponse.json({ coins: amount, xp: Math.max(1, Math.round(amount / 5)) });
}