import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getReferralDashboard } from "@/lib/services/referralService";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dashboard = await getReferralDashboard(user.id);
    return NextResponse.json(dashboard);
  } catch (err) {
    console.error("[referral]", err.message);
    return NextResponse.json({ error: "Could not load referral data" }, { status: 500 });
  }
}