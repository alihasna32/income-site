import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Durations in days mapped to null (permanent) or ISO string
const DURATION_MS = {
  "1_day": 1 * 24 * 60 * 60 * 1000,
  "3_days": 3 * 24 * 60 * 60 * 1000,
  "7_days": 7 * 24 * 60 * 60 * 1000,
  "30_days": 30 * 24 * 60 * 60 * 1000,
  "90_days": 90 * 24 * 60 * 60 * 1000,
  "365_days": 365 * 24 * 60 * 60 * 1000,
  "permanent": null,
};

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

  const { action, type, duration, reason } = body;

  if (!action || !["block", "suspend", "lift"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  // Admins cannot restrict themselves
  if (userId === adminUser.id) {
    return NextResponse.json({ error: "You cannot restrict yourself" }, { status: 403 });
  }

  try {
    if (action === "lift") {
      // Remove all active restrictions for the user
      const now = new Date().toISOString();
      const { error } = await admin
        .from("user_restrictions")
        .update({ end_time: now })
        .eq("user_id", userId)
        .or("end_time.is.null,end_time.gt." + now);

      if (error) throw error;
      return NextResponse.json({ ok: true, action: "lifted" });
    }

    if (action === "block") {
      if (!reason?.trim()) return NextResponse.json({ error: "A reason is required for blocking" }, { status: 400 });

      const { error } = await admin.from("user_restrictions").insert({
        user_id: userId,
        type: "blocked",
        start_time: new Date().toISOString(),
        end_time: null, // permanent
        reason: reason.trim(),
        admin_id: adminUser.id,
      });

      if (error) throw error;
      return NextResponse.json({ ok: true, action: "blocked" });
    }

    if (action === "suspend") {
      if (!type || !DURATION_MS.hasOwnProperty(type)) {
        return NextResponse.json({ error: "Invalid suspension duration" }, { status: 400 });
      }
      if (!reason?.trim()) return NextResponse.json({ error: "A reason is required for suspension" }, { status: 400 });

      const ms = DURATION_MS[type];
      const startTime = new Date();
      const endTime = ms ? new Date(startTime.getTime() + ms) : null;

      const { error } = await admin.from("user_restrictions").insert({
        user_id: userId,
        type: "suspended",
        start_time: startTime.toISOString(),
        end_time: endTime ? endTime.toISOString() : null,
        reason: reason.trim(),
        admin_id: adminUser.id,
      });

      if (error) throw error;
      return NextResponse.json({
        ok: true,
        action: "suspended",
        ends_at: endTime ? endTime.toISOString() : null,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("/api/admin/users/[id]/restriction POST", err?.message || err);
    return NextResponse.json({ error: "Could not apply restriction" }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("user_restrictions")
    .select("id,user_id,type,start_time,end_time,reason,admin_id,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not fetch restrictions" }, { status: 500 });

  // Mark which ones are currently active
  const withActive = (data || []).map((r) => ({
    ...r,
    is_active: !r.end_time || new Date(r.end_time) > new Date(),
  }));

  return NextResponse.json({ ok: true, restrictions: withActive });
}
