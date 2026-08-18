import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "read", "replied", "archived"];

export async function GET(request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || 50)));

  const supabase = createAdminClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("contact_messages")
    .select("*, profiles(display_name, avatar_emoji)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (status && STATUSES.includes(status)) {
    query = query.eq("status", status);
  }

  const { data, count } = await query.range(from, to);

  const { count: newCount } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  return NextResponse.json({
    messages: data || [],
    page,
    total: count || 0,
    newCount: newCount || 0,
  });
}