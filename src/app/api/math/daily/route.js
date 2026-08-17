import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDailyChallengeStatus } from "@/lib/services/mathDailyService";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getDailyChallengeStatus(user.id);
    return NextResponse.json(status);
  } catch (err) {
    console.error("[math/daily]", err.message);
    return NextResponse.json({ error: "Could not load today's challenge" }, { status: 500 });
  }
}