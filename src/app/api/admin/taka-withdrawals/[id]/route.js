import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseReady } from "@/lib/supabase/env";
import { z } from "zod";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "complete"]),
  note: z.string().trim().max(500).optional().default(""),
});

/** PATCH — approve / reject / complete a Taka withdrawal request */
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

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  if (!supabaseReady()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const admin = createAdminClient();

  try {
    const { data: withdrawal, error: wErr } = await admin
      .from("taka_withdrawals")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (wErr || !withdrawal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (parsed.data.action === "approve") {
      if (withdrawal.status !== "pending") {
        return NextResponse.json(
          { error: "Withdrawal is not pending" },
          { status: 400 }
        );
      }
      // Taka was already deducted on submit. Just mark as approved.
      await admin
        .from("taka_withdrawals")
        .update({
          status: "approved",
          admin_note: parsed.data.note.slice(0, 500),
          processed_by: adminUser.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", id);

      await admin.from("notifications").insert({
        user_id: withdrawal.user_id,
        type: "system",
        title: "Taka withdrawal approved",
        message: `Your withdrawal of ৳${withdrawal.amount} has been approved and is being processed.`,
      });

      return NextResponse.json({ ok: true, status: "approved" });
    }

    if (parsed.data.action === "reject") {
      if (withdrawal.status !== "pending") {
        return NextResponse.json(
          { error: "Withdrawal is not pending" },
          { status: 400 }
        );
      }
      // Refund the taka that was deducted on submit
      const { error: refundError } = await admin.rpc("refund_taka_withdrawal", {
        p_user_id: withdrawal.user_id,
        p_amount: withdrawal.amount,
        p_idempotency_key: `taka_withdrawal_refund:${withdrawal.id}`,
        p_reason: parsed.data.note || "rejected",
      });

      if (refundError) {
        console.error("[taka-withdrawals reject] refund error", refundError);
        return NextResponse.json(
          { error: "Could not refund Taka balance" },
          { status: 500 }
        );
      }

      await admin
        .from("taka_withdrawals")
        .update({
          status: "rejected",
          admin_note: parsed.data.note.slice(0, 500),
          processed_by: adminUser.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", id);

      await admin.from("notifications").insert({
        user_id: withdrawal.user_id,
        type: "system",
        title: "Taka withdrawal rejected",
        message: parsed.data.note
          ? `Your Taka withdrawal of ৳${withdrawal.amount} was rejected: ${parsed.data.note}`
          : `Your Taka withdrawal of ৳${withdrawal.amount} was rejected.`,
      });

      return NextResponse.json({ ok: true, status: "rejected" });
    }

    if (parsed.data.action === "complete") {
      // Atomic: flips status + increments total_taka_withdrawn in one call.
      // The RPC itself enforces that status is 'approved' before it proceeds,
      // so no separate guard is needed here.
      const { error: completeError } = await admin.rpc("complete_taka_withdrawal", {
        p_withdrawal_id: id,
      });

      if (completeError) {
        console.error("[taka-withdrawals] complete error", completeError);
        return NextResponse.json(
          { error: completeError.message || "Could not complete withdrawal" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, status: "completed" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("/api/admin/taka-withdrawals PATCH", err?.message || err);
    return NextResponse.json({ error: "Could not process" }, { status: 500 });
  }
}
