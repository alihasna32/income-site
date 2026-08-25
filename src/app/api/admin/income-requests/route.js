import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, parseInt(searchParams.get("limit") || "50", 10));

    const { data, error } = await admin
      .from("income_requests")
      .select("id,user_id,name,phone,transaction_id,status,admin_id,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(limit || 50);

    if (error) throw error;
    return NextResponse.json({ ok: true, requests: data });
  } catch (err) {
    console.error("/api/admin/income-requests GET", err?.message || err);
    return NextResponse.json({ error: "Could not fetch income requests" }, { status: 500 });
  }
}
