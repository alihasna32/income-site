import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getWithdrawalSettings,
  submitWithdrawal,
} from "@/lib/services/withdrawalService";
import { withdrawalSubmitSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getWithdrawalSettings();
  const admin = createAdminClient();

  const { data: wallet } = await admin
    .from("wallets")
    .select("coins, total_earned, total_redeemed")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: withdrawals } = await admin
    .from("withdrawals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const pendingAmount = (withdrawals || [])
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.amount, 0);

  return NextResponse.json({
    settings: { minAmount: settings.minAmount },
    wallet: {
      coins: wallet?.coins ?? 0,
      totalWithdrawn: wallet?.total_redeemed ?? 0,
    },
    pendingAmount,
    withdrawals: (withdrawals || []).map((w) => ({
      id: w.id,
      amount: w.amount,
      status: w.status,
      method: w.method,
      adminNote: w.admin_note,
      createdAt: w.created_at,
      processedAt: w.processed_at,
    })),
  });
}

export async function POST(request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = withdrawalSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const withdrawal = await submitWithdrawal(user.id, parsed.data);
    return NextResponse.json(
      {
        ok: true,
        withdrawal: {
          id: withdrawal.id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          createdAt: withdrawal.created_at,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (["BELOW_MINIMUM", "INSUFFICIENT_BALANCE", "PENDING_WITHDRAWAL_EXISTS", "INVALID_DETAILS"].includes(err.code)) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[withdrawals]", err.message);
    return NextResponse.json({ error: "Could not submit withdrawal" }, { status: 500 });
  }
}