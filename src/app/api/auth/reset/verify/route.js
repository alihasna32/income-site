import { NextResponse } from "next/server";
import { verifyResetCode } from "@/lib/services/passwordResetService";
import { resetVerifySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = resetVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid request" },
      { status: 400 }
    );
  }

  try {
    const { resetToken, expiresInSeconds } = await verifyResetCode({
      email: parsed.data.email,
      code: parsed.data.code,
    });
    return NextResponse.json({ resetToken, expiresInSeconds });
  } catch (err) {
    const status =
      err.code === "RATE_LIMITED" || err.code === "COOLDOWN" || err.code === "CODE_LOCKED"
        ? 429
        : err.code === "SERVICE_UNAVAILABLE"
          ? 503
          : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}