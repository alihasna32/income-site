import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const rate = parseInt(body?.coins_per_taka, 10);
  if (!rate || rate <= 0) return NextResponse.json({ error: "Invalid rate" }, { status: 400 });

  try {
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    // Call helper function if present (migration may not be applied)
    const { data, error } = await admin.rpc("set_active_conversion_as", { p_coins_per_taka: rate, p_admin_id: adminUser.id });
    if (error) {
      // RPC failed — do NOT perform fallback DB modifications here.
      // Return a clear 500 error so the migration can be applied first and admin can retry.
      console.error("set_active_conversion_as rpc failed", error.message);
      return NextResponse.json({ error: "set_active_conversion_as RPC failed", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    console.error("/api/admin/conversion-rate POST", err?.message || err);
    return NextResponse.json({ error: "Could not set conversion rate" }, { status: 500 });
  }
}
