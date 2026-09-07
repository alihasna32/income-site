import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Try the full projection first (includes Taka columns added in
  // 202609070002_taka_wallet.sql). If the columns don't exist yet
  // (e.g. migration not applied), fall back to the legacy columns so the
  // navbar / wallet page still load with coin values.
  const res = await supabase
    .from("wallets")
    .select("coins, total_earned, total_redeemed, taka_balance, total_taka_withdrawn")
    .eq("user_id", user.id)
    .maybeSingle();

  if (res.error) {
    const msg = res.error.message || "";
    if (/column .* does not exist/i.test(msg)) {
      // Migration not applied yet — fall back to legacy columns.
      const fallback = await supabase
        .from("wallets")
        .select("coins, total_earned, total_redeemed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (fallback.error) {
        console.error("/api/wallet/me fallback error", fallback.error);
        return NextResponse.json(
          { error: "Could not load wallet" },
          { status: 500 }
        );
      }
      return NextResponse.json({
        wallet:
          fallback.data || {
            coins: 0,
            total_earned: 0,
            total_redeemed: 0,
            taka_balance: 0,
            total_taka_withdrawn: 0,
          },
      });
    }
    // Any other Supabase error should surface to the client.
    console.error("/api/wallet/me error", res.error);
    return NextResponse.json({ error: "Could not load wallet" }, { status: 500 });
  }

  return NextResponse.json({
    wallet:
      res.data || {
        coins: 0,
        total_earned: 0,
        total_redeemed: 0,
        taka_balance: 0,
        total_taka_withdrawn: 0,
      },
  });
}
