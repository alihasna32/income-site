import { NextResponse } from "next/server";
import { resendResetCode } from "@/lib/services/passwordResetService";
import { resetRequestSchema } from "@/lib/validations";
import { clientIp } from "@/lib/utils/ip";

export const dynamic = "force-dynamic";

const GENERIC_MESSAGE =
  "If an account exists for that email, a reset code is on its way.";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = resetRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid request" },
      { status: 400 }
    );
  }

  try {
    await resendResetCode({ email: parsed.data.email, ip: clientIp(request) });
    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    const status =
      err.code === "RATE_LIMITED" || err.code === "COOLDOWN"
        ? 429
        : err.code === "SERVICE_UNAVAILABLE"
          ? 503
          : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}