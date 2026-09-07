import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { z } from "zod";

export const dynamic = "force-dynamic";

const DEFAULT_MIN_TAKA = 200;

const takaWithdrawalSubmitSchema = z.object({
  amount: z.number().int().min(1, "Enter a positive amount"),
  method: z.enum(["bank_transfer", "mobile_wallet", "paypal"]),
  details: z.record(z.string().max(200)).optional().default({}),
});

/** Read admin settings: min Taka withdrawal amount */
async function getMinTakaAmount() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("admin_settings")
      .select("value")
      .eq("key", "taka_withdrawals")
      .maybeSingle();
    return Number(data?.value?.min_amount ?? DEFAULT_MIN_TAKA);
  } catch {
    return DEFAULT_MIN_TAKA;
  }
}

/** Validate the method-specific details (mirrors withdrawalService.js) */
function validateDetails(method, details) {
  const FIELDS = {
    bank_transfer: [
      { key: "account_name", required: true, label: "Account name" },
      { key: "account_number", required: true, label: "Account number" },
      { key: "bank_name", required: true, label: "Bank name" },
    ],
    mobile_wallet: [
      { key: "provider", required: true, label: "Provider", placeholder: "bKash / Nagad / Rocket / Upay" },
      { key: "number", required: true, label: "Mobile number", placeholder: "01XXXXXXXXX" },
    ],
    paypal: [
      { key: "email", required: true, label: "PayPal email" },
    ],
  };

  const fields = FIELDS[method] || [];
  const clean = {};
  for (const field of fields) {
    const value = ((details && details[field.key]) || "").toString().trim();
    if (field.required && !value) {
      const err = new Error(`${field.label} is required`);
      err.code = "INVALID_DETAILS";
      throw err;
    }
    if (field.key === "number" && value && !/^01\d{9}$/.test(value)) {
      const err = new Error("Enter a valid 11-digit mobile number");
      err.code = "INVALID_DETAILS";
      throw err;
    }
    if (field.key === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      const err = new Error("Enter a valid email address");
      err.code = "INVALID_DETAILS";
      throw err;
    }
    clean[field.key] = value;
  }
  return clean;
}

/** GET — list the user's Taka withdrawal requests */
export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const [withdrawalsRes, settingsRes] = await Promise.all([
      admin
        .from("taka_withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("wallets")
        .select("taka_balance")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const minAmount = await getMinTakaAmount();

    return NextResponse.json({
      ok: true,
      takaBalance: settingsRes?.data?.taka_balance ?? 0,
      minAmount,
      withdrawals: (withdrawalsRes.data || []).map((w) => ({
        id: w.id,
        amount: w.amount,
        status: w.status,
        method: w.method,
        details: w.details,
        adminNote: w.admin_note,
        createdAt: w.created_at,
        processedAt: w.processed_at,
      })),
    });
  } catch (err) {
    console.error("/api/taka-withdrawals GET", err?.message || err);
    return NextResponse.json({ error: "Could not load withdrawals" }, { status: 500 });
  }
}

/** POST — submit a new Taka withdrawal request */
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

  const parsed = takaWithdrawalSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { amount, method, details } = parsed.data;

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const admin = createAdminClient();

  try {
    // 1. Validate method details
    const cleanDetails = validateDetails(method, details);

    // 2. Fetch min withdrawal and user's taka balance
    const [minAmount, walletRes] = await Promise.all([
      getMinTakaAmount(),
      admin
        .from("wallets")
        .select("taka_balance")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    // Check if wallet query failed
    if (walletRes.error) {
      console.error(
        "[taka-withdrawals] wallet fetch error",
        walletRes.error
      );

      return NextResponse.json(
        { error: "Could not load Taka balance" },
        { status: 500 }
      );
    }

    const takaBalance = walletRes.data?.taka_balance ?? 0;

    if (amount < minAmount) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ৳${minAmount}` },
        { status: 400 }
      );
    }

    if (amount > takaBalance) {
      return NextResponse.json(
        { error: "Insufficient Taka balance" },
        { status: 400 }
      );
    }

    // 3. Check no pending taka withdrawal already exists
    const { data: existing } = await admin
      .from("taka_withdrawals")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending Taka withdrawal request" },
        { status: 400 }
      );
    }

    // 4. Insert withdrawal request
    const { data: withdrawal, error: wError } = await admin
      .from("taka_withdrawals")
      .insert({
        user_id: user.id,
        amount,
        method,
        details: cleanDetails,
        status: "pending",
      })
      .select()
      .maybeSingle();

    if (wError) {
      console.error("[taka-withdrawals] insert error", wError);
      return NextResponse.json(
        { error: "Could not submit withdrawal request" },
        { status: 500 }
      );
    }

    // 5. Deduct taka balance immediately so user can't overdraw
    const { error: deductError } = await admin.rpc("deduct_taka_for_withdrawal", {
      p_user_id: user.id,
      p_amount: amount,
      p_idempotency_key: `taka_withdrawal:${withdrawal.id}`,
    });

    if (deductError) {
      // Rollback: delete the withdrawal request
      await admin.from("taka_withdrawals").delete().eq("id", withdrawal.id);
      console.error("[taka-withdrawals] deduct_taka error", deductError);
      return NextResponse.json(
        { error: "Could not reserve Taka balance" },
        { status: 500 }
      );
    }

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
    if (err.code === "INVALID_DETAILS") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("/api/taka-withdrawals POST", err?.message || err);
    return NextResponse.json({ error: "Could not submit withdrawal" }, { status: 500 });
  }
}
