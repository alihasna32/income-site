import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { notificationReadSchema } from "@/lib/validations";

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
    body = { all: true };
  }

  const parsed = notificationReadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (!parsed.data.all && parsed.data.ids.length) {
    query = query.in("id", parsed.data.ids);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: "Could not update notifications" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}