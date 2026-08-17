import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const adjustSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().int().min(-1000000).max(1000000).refine((v) => v !== 0, "Amount cannot be 0"),
  reason: z.string().trim().min(3).max(200),
});

export async function POST(request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: wallet, error: walletError } = await admin
    .from("wallets")
    .select("coins")
    .eq("user_id", parsed.data.userId)
    .maybeSingle();

  if (walletError || !wallet) {
    return NextResponse.json({ error: "User wallet not found" }, { status: 404 });
  }

  if (wallet.coins + parsed.data.amount < 0) {
    return NextResponse.json({ error: "Amount would make the balance negative" }, { status: 400 });
  }

  const { error: rpcError } = await admin.rpc("credit_reward", {
    p_user_id: parsed.data.userId,
    p_amount: parsed.data.amount,
    p_xp: 0,
    p_type: "adjustment",
    p_description: `Admin adjustment: ${parsed.data.reason}`,
    p_idempotency_key: `admin-adjust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  });

  if (rpcError) {
    return NextResponse.json({ error: "Could not apply adjustment" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, newBalance: wallet.coins + parsed.data.amount });
}