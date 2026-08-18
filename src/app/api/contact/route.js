import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { notifyMany } from "@/services/notificationsService";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(4000),
});

export const dynamic = "force-dynamic";

export async function POST(request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const allowed = await checkRateLimit({
    key: `contact:${ip}`,
    max: 5,
    windowSeconds: 3600,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Message storage unavailable" }, { status: 503 });
  }

  const user = await getSession();
  const admin = createAdminClient();

  const { error } = await admin.from("contact_messages").insert({
    user_id: user?.id || null,
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (error) {
    console.error("[contact]", error.message);
    return NextResponse.json({ error: "Could not save your message" }, { status: 500 });
  }

  try {
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(10);
    await notifyMany(
      (admins || []).map((a) => a.id),
      {
        type: "system",
        title: "New contact message",
        message: `${parsed.data.name}: ${parsed.data.subject}`,
      }
    );
  } catch {
    // admin notification is best-effort
  }

  return NextResponse.json({ ok: true });
}