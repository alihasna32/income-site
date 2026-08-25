import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const { data: existing, error: fetchErr } = await admin
      .from("income_requests")
      .select("id,user_id,status")
      .eq("id", id)
      .single();
    if (fetchErr) throw fetchErr;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status !== "pending") return NextResponse.json({ error: "Only pending requests can be rejected" }, { status: 400 });

    const { data, error } = await admin
      .from("income_requests")
      .update({ status: "rejected", admin_id: adminUser.id, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id,status,admin_id,updated_at")
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({ ok: true, request: data });
  } catch (err) {
    console.error("/api/admin/income-requests/[id]/reject POST", err?.message || err);
    return NextResponse.json({ error: "Could not reject request" }, { status: 500 });
  }
}
