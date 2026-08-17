import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import {
  approveWithdrawal,
  rejectWithdrawal,
} from "@/lib/services/withdrawalService";
import { withdrawalAdminSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = withdrawalAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const result =
      parsed.data.action === "approve"
        ? await approveWithdrawal(id, adminUser.id)
        : await rejectWithdrawal(id, adminUser.id, parsed.data.note);
    return NextResponse.json(result);
  } catch (err) {
    if (["NOT_FOUND", "NOT_PENDING", "INSUFFICIENT_BALANCE"].includes(err.code)) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[admin/withdrawals]", err.message);
    return NextResponse.json({ error: "Could not process withdrawal" }, { status: 500 });
  }
}