import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/** GET — list all Taka withdrawal requests (admin) */
export async function GET() {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("taka_withdrawals")
      .select("id, user_id, amount, status, method, details, admin_note, created_at, processed_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;

    // Join profile info for display
    const userIds = Array.from(new Set((data || []).map((w) => w.user_id)));
    let profileMap = {};
    if (userIds.length) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, username, display_name, avatar_emoji")
        .in("id", userIds);
      (profiles || []).forEach((p) => {
        profileMap[p.id] = p;
      });
    }

    return NextResponse.json({
      ok: true,
      withdrawals: (data || []).map((w) => ({
        id: w.id,
        userId: w.user_id,
        amount: w.amount,
        status: w.status,
        method: w.method,
        details: w.details,
        adminNote: w.admin_note,
        createdAt: w.created_at,
        processedAt: w.processed_at,
        profile: profileMap[w.user_id] || null,
      })),
    });
  } catch (err) {
    console.error("/api/admin/taka-withdrawals GET", err?.message || err);
    return NextResponse.json({ error: "Could not load" }, { status: 500 });
  }
}
