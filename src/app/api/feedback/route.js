import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET: public feedback for display (rotation)
// Returns limited feedback for dashboard display
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feedback")
      .select("id, message, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return NextResponse.json({ ok: true, feedbacks: data || [] });
  } catch (err) {
    console.error("/api/feedback GET", err?.message || err);
    return NextResponse.json({ error: "Could not fetch feedback" }, { status: 500 });
  }
}
