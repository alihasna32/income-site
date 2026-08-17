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
  const { data } = await supabase
    .from("wallets")
    .select("coins, total_earned, total_redeemed")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    wallet: data || { coins: 0, total_earned: 0, total_redeemed: 0 },
  });
}