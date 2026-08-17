import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { submitDailyChallenge } from "@/lib/services/mathDailyService";
import { mathDailySubmitSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = mathDailySubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid answer" },
      { status: 400 }
    );
  }

  try {
    const result = await submitDailyChallenge(user.id, parsed.data.answer);
    return NextResponse.json(result);
  } catch (err) {
    if (err.code === "ALREADY_ATTEMPTED") {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[math/daily/submit]", err.message);
    return NextResponse.json({ error: "Could not submit your answer" }, { status: 500 });
  }
}