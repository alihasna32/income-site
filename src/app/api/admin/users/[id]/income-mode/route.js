import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { action } = body;
  if (action !== "disable" && action !== "enable") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  try {
    const { data: existing, error: fetchErr } = await admin
      .from("profiles")
      .select("id, income_mode_status")
      .eq("id", userId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (action === "enable") {
      // Admin cannot enable their own income mode
      if (userId === adminUser.id) {
        return NextResponse.json({ error: "You cannot enable your own Income Mode" }, { status: 403 });
      }
      if (existing.income_mode_status === "active") {
        return NextResponse.json({ error: "Income Mode is already active" }, { status: 400 });
      }

      // Directly set profile to active (no payment required for admin-enable)
      const { data, error } = await admin
        .from("profiles")
        .update({ income_mode_status: "active", updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select("id, income_mode_status, updated_at")
        .single();

      if (error) throw error;
      return NextResponse.json({ ok: true, profile: data, action: "enable" });
    }

    // action === "disable"
    if (userId === adminUser.id) {
      return NextResponse.json({ error: "You cannot disable your own Income Mode" }, { status: 403 });
    }
    if (existing.income_mode_status === "disabled") {
      return NextResponse.json({ error: "Income Mode is already disabled" }, { status: 400 });
    }

    // Update profile status
    const { data, error } = await admin
      .from("profiles")
      .update({ income_mode_status: "disabled", updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("id, income_mode_status, updated_at")
      .single();

    if (error) throw error;

    // Also cancel the user's most recent approved income request so the UI reflects the change
    await admin
      .from("income_requests")
      .update({ status: "cancelled", admin_id: adminUser.id, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "approved");

    return NextResponse.json({ ok: true, profile: data, action: "disable" });
  } catch (err) {
    console.error("/api/admin/users/[id]/income-mode POST", err?.message || err);
    return NextResponse.json({ error: "Could not update Income Mode" }, { status: 500 });
  }
}