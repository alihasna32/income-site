import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { profileUpdateSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getDbLevels, levelProgress } from "@/services/levelsService";
import { findUniqueUsername } from "@/lib/utils/username";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [profileRes, walletRes, streakRes, sessionsRes, levels] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin.from("wallets").select("coins, total_earned, total_redeemed").eq("user_id", user.id).maybeSingle(),
    admin.from("streaks").select("current_streak, longest_streak").eq("user_id", user.id).maybeSingle(),
    admin.from("game_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    getDbLevels(),
  ]);

  const profile = profileRes.data;
  const progress = levelProgress(profile?.xp || 0, levels);

  return NextResponse.json({
    profile: {
      id: user.id,
      displayName: profile?.display_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      avatarEmoji: profile?.avatar_emoji || "",
      email: user.email || "",
      phone: profile?.phone || "",
      referralCode: profile?.referral_code || "",
      createdAt: profile?.created_at || new Date().toISOString(),
      xp: profile?.xp || 0,
      coins: walletRes.data?.coins || 0,
      gamesPlayed: sessionsRes.count || 0,
      longestStreak: streakRes.data?.longest_streak || 0,
    },
    level: {
      title: progress.level.title,
      level: progress.level.level,
      next: progress.next ? { title: progress.next.title, xpRequired: progress.next.xp_required } : null,
      toNext: progress.next ? Math.max(0, progress.next.xp_required - (profile?.xp || 0)) : 0,
      currentProgress: progress.progress,
    },
  });
}

export async function PATCH(request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await checkRateLimit({
    key: `profile:${user.id}`,
    max: 10,
    windowSeconds: 60,
  });
  if (!allowed) {
    return NextResponse.json({ error: "Too many updates — slow down!" }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  let username = parsed.data.username;
  if (!username || username.startsWith("user_")) {
    username = await findUniqueUsername(admin, parsed.data.displayName);
  }

  const phone = parsed.data.phone || null;
  if (phone) {
    const { data: phoneOwner } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (phoneOwner && phoneOwner.id !== user.id) {
      return NextResponse.json(
        { error: "That phone number is already in use" },
        { status: 409 }
      );
    }
  }

  const { data, error } = await admin
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      username,
      bio: parsed.data.bio,
      avatar_emoji: parsed.data.avatarEmoji,
      phone,
    })
    .eq("id", user.id)
    .select("display_name, username, bio, avatar_emoji, phone")
    .single();

  if (error) {
    if (error.message.includes("username")) {
      return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
    }
    if (error.message.includes("phone")) {
      return NextResponse.json({ error: "That phone number is already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }

  await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      display_name: parsed.data.displayName,
      avatar_emoji: parsed.data.avatarEmoji,
      phone: phone || "",
    },
  });

  return NextResponse.json({ profile: data });
}