import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const NOTIFICATION_TYPES = [
  "info",
  "reward",
  "achievement",
  "mission",
  "referral",
  "streak",
  "system",
];

export async function GET(request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 20)));
  const type = searchParams.get("type") || null;

  const supabase = await createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (type && NOTIFICATION_TYPES.includes(type)) {
    query = query.eq("type", type);
  }

  const { data, count } = await query.range(from, to);

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return NextResponse.json({
    notifications: data || [],
    page,
    total: count || 0,
    unreadCount: unreadCount || 0,
  });
}
