import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const feedbackIds = Array.isArray(body?.feedbackIds) ? body.feedbackIds : [];
  if (feedbackIds.length === 0) {
    return NextResponse.json({ ok: true, message: "No feedback to mark as seen" });
  }

  try {
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const rows = feedbackIds.map((id) => ({
      feedback_id: id,
      user_id: user.id,
    }));

    const { error } = await admin
      .from("feedback_views")
      .upsert(rows, { onConflict: "feedback_id,user_id" });

    if (error) throw error;

    return NextResponse.json({ ok: true, message: "Feedback marked as seen" });
  } catch (err) {
    console.error("/api/feedback/seen POST", err?.message || err);
    return NextResponse.json({ error: "Could not mark feedback as seen" }, { status: 500 });
  }
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const { data, error } = await admin
      .from("feedback_views")
      .select("feedback_id")
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true, seenIds: (data || []).map((r) => r.feedback_id) });
  } catch (err) {
    console.error("/api/feedback/seen GET", err?.message || err);
    return NextResponse.json({ error: "Could not fetch seen feedback" }, { status: 500 });
  }
}