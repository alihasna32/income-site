import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const feedbackSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(2000),
  is_active: z.boolean().optional().default(true),
  user_label: z.string().trim().min(1).max(40).optional(),
});

export async function GET() {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("feedback")
      .select("id, message, is_active, user_label, created_at, updated_at, admin_id")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, feedbacks: data || [] });
  } catch (err) {
    console.error("/api/admin/feedback GET", err?.message || err);
    return NextResponse.json({ error: "Could not load feedback" }, { status: 500 });
  }
}

// Returns the next suggested "User N" label based on existing rows.
async function nextUserLabel(admin) {
  const { data } = await admin
    .from("feedback")
    .select("user_label")
    .order("created_at", { ascending: true });
  const labels = new Set((data || []).map((r) => r.user_label).filter(Boolean));
  let n = (data || []).length + 1;
  // walk up until we find an unused label
  while (labels.has(`User ${n}`)) n += 1;
  return `User ${n}`;
}

export async function POST(request) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();
    const userLabel = parsed.data.user_label || (await nextUserLabel(admin));

    const { data, error } = await admin
      .from("feedback")
      .insert({
        message: parsed.data.message,
        is_active: parsed.data.is_active ?? true,
        user_label: userLabel,
        admin_id: adminUser.id,
      })
      .select("id, message, is_active, user_label, created_at, updated_at, admin_id")
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, feedback: data }, { status: 201 });
  } catch (err) {
    console.error("/api/admin/feedback POST", err?.message || err);
    return NextResponse.json({ error: "Could not create feedback" }, { status: 500 });
  }
}
