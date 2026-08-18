import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { contactMessageAdminSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const { id } = await params;

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = contactMessageAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.note,
    })
    .eq("id", id)
    .select("id, status, admin_note")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ message: data });
}