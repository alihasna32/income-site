import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { z } from "zod";

export const dynamic = "force-dynamic";

const convertSchema = z.object({
  coins: z.number().int().min(1, "Enter a positive amount of coins"),
});

/**
 * POST /api/wallet/convert
 *
 * Atomically converts coins into Taka balance using the
 * `public.convert_coins_to_taka` RPC (service-role only).
 *
 * The RPC:
 *   1. Validates the coin amount >= server-configured minimum
 *   2. Verifies the user's current coin balance
 *   3. Calculates taka_credited = coins / active_coins_per_taka_rate
 *   4. Inserts two transaction records (coins debit + taka credit)
 *   5. Updates wallets.coins and wallets.taka_balance in one UPDATE
 *
 * Returns the new balances so the client can update immediately without
 * a re-fetch.
 */
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

  const parsed = convertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const { coins } = parsed.data;

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const admin = createAdminClient();

  // Server-side check: verify user has Income Mode enabled
  const { data: profile } = await admin
    .from("profiles")
    .select("income_mode_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.income_mode_status !== "active") {
    return NextResponse.json(
      { error: "Income Mode is not enabled" },
      { status: 403 }
    );
  }

  // Fetch the active conversion rate from conversion_settings
  const { data: conv } = await admin
    .from("conversion_settings")
    .select("coins_per_taka")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const rate = conv?.coins_per_taka ?? 100;

  try {
    const { data, error } = await admin.rpc("convert_coins_to_taka", {
      p_user_id: user.id,
      p_coins: coins,
      p_rate: rate,
    });

    if (error) {
      // Postgres error messages from RAISE EXCEPTION are embedded in error.message
      const msg = error.message || "";
      if (
        msg.includes("Insufficient coin balance") ||
        msg.includes("Minimum conversion") ||
        msg.includes("Conversion yields 0")
      ) {
        return NextResponse.json({ error: msg }, { status: 400 });
      }
      if (msg.includes("Wallet not found")) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
      }
      console.error("[wallet/convert] RPC error", error);
      return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      newCoinBalance: data.new_coin_balance,
      newTakaBalance: data.new_taka_balance,
      takaCredited: data.taka_credited,
      coinsSpent: data.coins_spent,
    });
  } catch (err) {
    console.error("[wallet/convert]", err?.message || err);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
