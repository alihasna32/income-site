import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const phone = String(body.phone || "").replace(/[^0-9]/g, "");
  if (!phone || phone.length < 7 || phone.length > 15) {
    return NextResponse.json({ email: null });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ email: null });
  }

  const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
  if (!authUser?.user?.email) {
    return NextResponse.json({ email: null });
  }

  return NextResponse.json({ email: authUser.user.email });
}
