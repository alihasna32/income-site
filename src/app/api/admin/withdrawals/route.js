import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminUser = await requireAdmin();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("withdrawals")
    .select(
      "id, amount, status, method, details, admin_note, created_at, processed_at, user_id, user:profiles!withdrawals_user_id_fkey(display_name, username, avatar_emoji)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "Could not load withdrawals" }, { status: 500 });
  }

  return NextResponse.json({
    withdrawals: (data || []).map((w) => ({
      id: w.id,
      amount: w.amount,
      status: w.status,
      method: w.method,
      details: w.details,
      adminNote: w.admin_note,
      createdAt: w.created_at,
      processedAt: w.processed_at,
      user: w.user
        ? {
            id: w.user_id,
            displayName: w.user.display_name,
            username: w.user.username,
            avatarEmoji: w.user.avatar_emoji,
          }
        : null,
    })),
  });
}