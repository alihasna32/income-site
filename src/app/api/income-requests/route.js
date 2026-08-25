import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { incomeRequestSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = incomeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Prevent duplicate pending request (best-effort check server-side)
    const { data: existing } = await supabase
      .from("income_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "A pending request already exists" }, { status: 409 });
    }

    const insertPayload = {
      user_id: user.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      transaction_id: parsed.data.transactionId,
      status: "pending",
    };

    // Attempt insert; handle unique-constraint (duplicate pending request) gracefully.
    const insertRes = await supabase.from("income_requests").insert(insertPayload).select("id,status,created_at").maybeSingle();

    if (insertRes.error) {
      const msg = insertRes.error.message || '';
      const isDuplicate = msg.includes('duplicate key') || msg.includes('unique') || insertRes.error?.code === '23505';
      if (isDuplicate) {
        return NextResponse.json({ error: 'A pending request already exists' }, { status: 409 });
      }
      // Propagate the error to outer catch for logging/500
      throw insertRes.error;
    }

    return NextResponse.json({ ok: true, request: insertRes.data }, { status: 201 });
  } catch (err) {
    console.error("/api/income-requests POST", err?.message || err);
    return NextResponse.json({ error: "Could not submit income request" }, { status: 500 });
  }
}
