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

    // Fetch requests and profiles in parallel so we can attach income_mode_status to each row
    const { data, error } = await admin
      .from("income_requests")
      .select("id,user_id,name,phone,transaction_id,status,admin_id,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(limit || 50);

    if (error) throw error;

    // Collect unique user IDs and fetch their income_mode_status
    const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
    const { data: profiles } = userIds.length
      ? await admin.from("profiles").select("id,income_mode_status").in("id", userIds)
      : { data: [] };

    const profileMap = Object.fromEntries(
      (profiles || []).map((p) => [p.id, p.income_mode_status || "disabled"])
    );

    const requests = (data || []).map((row) => ({
      ...row,
      income_mode_status: profileMap[row.user_id] || "disabled",
    }));

    return NextResponse.json({ ok: true, requests });
  } catch (err) {
    console.error("/api/admin/income-requests GET", err?.message || err);
    return NextResponse.json({ error: "Could not fetch income requests" }, { status: 500 });
  }
}
