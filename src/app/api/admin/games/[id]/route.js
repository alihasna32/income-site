import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const gameUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  rewardCoins: z.number().int().min(0).max(1000).optional(),
  rewardXp: z.number().int().min(0).max(1000).optional(),
  maxPlaysPerDay: z.number().int().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

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

  const parsed = gameUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const updates = {};
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;
  if (parsed.data.rewardCoins !== undefined) updates.reward_coins = parsed.data.rewardCoins;
  if (parsed.data.rewardXp !== undefined) updates.reward_xp = parsed.data.rewardXp;
  if (parsed.data.maxPlaysPerDay !== undefined) updates.max_plays_per_day = parsed.data.maxPlaysPerDay;
  if (parsed.data.sortOrder !== undefined) updates.sort_order = parsed.data.sortOrder;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("games")
    .update(updates)
    .eq("id", id)
    .select("id, title, is_active, reward_coins, reward_xp, max_plays_per_day, sort_order")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not update game" }, { status: 500 });
  }

  return NextResponse.json({ game: data });
}