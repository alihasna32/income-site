import { NextResponse } from "next/server";
import { updatePasswordWithToken } from "@/lib/services/passwordResetService";
import { resetUpdateSchema } from "@/lib/validations";
import { clientIp } from "@/lib/utils/ip";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = resetUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid request" },
      { status: 400 }
    );
  }

  try {
    await updatePasswordWithToken({
      resetToken: parsed.data.resetToken,
      password: parsed.data.password,
      ip: clientIp(request),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status =
      err.code === "RATE_LIMITED" || err.code === "CODE_LOCKED"
        ? 429
        : err.code === "SERVICE_UNAVAILABLE"
          ? 503
          : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}