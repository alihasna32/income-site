import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const feedbackUpdateSchema = z.object({
  message: z.string().trim().min(1).max(2000).optional(),
  is_active: z.boolean().optional(),
  user_label: z.string().trim().min(1).max(40).optional(),
});

export async function PATCH(request, { params }) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = feedbackUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const update = { updated_at: new Date().toISOString() };
    if (parsed.data.message !== undefined) update.message = parsed.data.message;
    if (parsed.data.is_active !== undefined) update.is_active = parsed.data.is_active;
    if (parsed.data.user_label !== undefined) update.user_label = parsed.data.user_label;

    const { data, error } = await admin
      .from("feedback")
      .update(update)
      .eq("id", id)
      .select("id, message, is_active, user_label, created_at, updated_at, admin_id")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, feedback: data });
  } catch (err) {
    console.error("/api/admin/feedback/[id] PATCH", err?.message || err);
    return NextResponse.json({ error: "Could not update feedback" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("feedback").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("/api/admin/feedback/[id] DELETE", err?.message || err);
    return NextResponse.json({ error: "Could not delete feedback" }, { status: 500 });
  }
}
