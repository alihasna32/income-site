import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/wallet/convert-info
 *
 * Public endpoint (no auth required) that returns:
 *   - coins_per_taka  : how many coins = 1 Taka (from conversion_settings)
 *   - min_coins       : minimum coins required to convert (from admin_settings key 'taka_conversion')
 */
export async function GET() {
  try {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ ok: true, coins_per_taka: 100, min_coins: 1000 });
    }

    const [convRes, settingsRes] = await Promise.all([
      admin
        .from("conversion_settings")
        .select("coins_per_taka")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle(),
      admin
        .from("admin_settings")
        .select("value")
        .eq("key", "taka_conversion")
        .maybeSingle(),
    ]);

    return NextResponse.json({
      ok: true,
      coins_per_taka: convRes?.coins_per_taka ?? 100,
      min_coins: Number(settingsRes?.data?.value?.min_coins ?? 1000),
    });
  } catch (err) {
    console.error("/api/wallet/convert-info GET", err?.message || err);
    return NextResponse.json(
      { ok: true, coins_per_taka: 100, min_coins: 1000 },
      { status: 200 }
    );
  }
}
