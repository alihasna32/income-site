import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAdmin();
  return NextResponse.json({ isAdmin: Boolean(user) });
}