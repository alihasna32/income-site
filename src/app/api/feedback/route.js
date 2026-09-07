import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET: returns ALL active feedbacks so the client can randomly pick 3 each
// 20-second cycle. Each row includes user_label (shown as "author" to users).
export async function GET() {
  try {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json({ ok: true, feedbacks: [] });
    }

    const { data, error } = await admin
      .from("feedback")
      .select("id, message, user_label")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const feedbacks = (data || []).map((row) => ({
      id: row.id,
      message: row.message,
      author: row.user_label || "Admin",
    }));

    return NextResponse.json({ ok: true, feedbacks });
  } catch (err) {
    console.error("/api/feedback GET", err?.message || err);
    return NextResponse.json({ error: "Could not fetch feedback" }, { status: 500 });
  }
}
