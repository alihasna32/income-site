"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Cake,
  Coins,
  Gem,
  Loader2,
  Mail,
  Save,
  Settings,
  Sparkles,
  Ticket,
  Trophy,
  UserRound,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CopyButton } from "@/components/shared/CopyButton";
import { useToast } from "@/components/shared/ToastProvider";
import { avatarGradient, initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const AVATARS = [
  "ðŸ¦Š", "ðŸ¼", "ðŸ¦", "ðŸ¸", "ðŸ™", "ðŸ¦„", "ðŸ¯", "ðŸ¨",
  "ðŸ¦‰", "ðŸ¹", "ðŸº", "ðŸ¦œ", "ðŸ¢", "ðŸ³", "ðŸ¦‹", "ðŸ",
];

export default function ProfilePage() {
  const { toast } = useToast();

  const [profile, setProfile] = useState(null);
  const [level, setLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [form, setForm] = useState({ displayName: "", username: "", bio: "", avatarEmoji: "" });

  useEffect(() => {
    fetch("/api/profile/update", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setProfile(data.profile);
        setLevel(data.level);
        setForm({
          displayName: data.profile?.displayName || "",
          username: data.profile?.username || "",
          bio: data.profile?.bio || "",
          avatarEmoji: data.profile?.avatarEmoji || "ðŸ¦Š",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName.trim(),
          username: form.username.trim(),
          bio: form.bio.trim().slice(0, 160),
          avatarEmoji: form.avatarEmoji,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Profile saved!", "success");
        setProfile((prev) => ({ ...prev, ...data.profile }));
      } else {
        toast(data.error || "Could not save", "error");
      }
    } catch {
      toast("Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your profile"
        description="How others see you on CoinQuest."
        actions={
          <Link
            href="/dashboard/settings"
            className="btn btn-outline btn-sm"
            aria-label="Go to settings"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        }
      />

      <div className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-plum via-[#5d4065] to-plum relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_50%,#F2C230_0,transparent_40%),radial-gradient(circle_at_80%_50%,#F2921D_0,transparent_40%)]" />
        </div>
        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-10">
            <button
              onClick={() => setAvatarOpen((v) => !v)}
              className="relative group shrink-0"
              aria-label="Change avatar"
            >
              <span
                className={cn(
                  "flex size-20 items-center justify-center rounded-full text-4xl border-4 border-base-100 shadow-card",
                  form.avatarEmoji ? "" : `bg-gradient-to-br ${avatarGradient(profile?.email || "user")}`
                )}
              >
                {form.avatarEmoji || initials(profile?.displayName || profile?.email || "U")}
              </span>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-plum/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                Change
              </span>
            </button>
            <span className="flex items-center gap-2 badge badge-lg bg-plum text-neutral-content shadow-card">
              <Trophy className="size-4 text-gold" />
              {level?.title || "Beginner"}
            </span>
          </div>

          <div className="mt-4 min-w-0">
            <h2 className="text-2xl font-extrabold text-plum truncate">
              {profile?.displayName || "Player"}
            </h2>
            <p className="text-sm text-muted truncate">
              @{profile?.username || "â€”"}
            </p>
          </div>

          {avatarOpen && (
            <div className="mt-4 rounded-field bg-base-200 p-4">
              <p className="text-xs font-semibold text-muted mb-3">Pick an avatar</p>
              <div className="grid grid-cols-4 gap-2 max-w-md sm:grid-cols-8">
                {AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setForm((f) => ({ ...f, avatarEmoji: emoji }));
                      setAvatarOpen(false);
                    }}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl text-xl transition-all",
                      form.avatarEmoji === emoji
                        ? "bg-secondary text-white shadow-card scale-110"
                        : "bg-base-100 hover:bg-primary/20"
                    )}
                    aria-label={`Avatar ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-xs text-muted">
            <BadgeCheck className="size-4 text-secondary" /> Member since{" "}
            {new Date(profile?.createdAt || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-muted mb-1.5">
              <span className="flex items-center gap-1 font-semibold text-plum">
                <Sparkles className="size-3.5 text-secondary" />
                {new Intl.NumberFormat("en-US").format(profile?.xp || 0)} XP total
              </span>
              {level?.next && <span>{level.toNext} XP to {level.next.title}</span>}
            </div>
            <ProgressBar value={level?.currentProgress || 0} max={100} tone="primary" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="stat bg-base-100 border border-base-300 shadow-card rounded-box">
          <div className="stat-figure text-secondary"><Coins className="size-6" /></div>
          <div className="stat-title">Coins</div>
          <div className="stat-value text-plum text-2xl">
            {new Intl.NumberFormat("en-US").format(profile?.coins || 0)}
          </div>
        </div>
        <div className="stat bg-base-100 border border-base-300 shadow-card rounded-box">
          <div className="stat-figure text-gold-dark"><Cake className="size-6" /></div>
          <div className="stat-title">Games played</div>
          <div className="stat-value text-plum text-2xl">
            {new Intl.NumberFormat("en-US").format(profile?.gamesPlayed || 0)}
          </div>
        </div>
        <div className="stat bg-base-100 border border-base-300 shadow-card rounded-box">
          <div className="stat-figure text-accent"><Gem className="size-6" /></div>
          <div className="stat-title">Best streak</div>
          <div className="stat-value text-plum text-2xl">
            {profile?.longestStreak || 0} <span className="text-sm font-medium text-muted">days</span>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="flex items-center gap-2 font-bold text-plum">
          <Mail className="size-5 text-secondary" /> Private details
        </h2>
        <p className="mt-1 text-sm text-muted">
          Only you can see these. Your email is never shown to other players.
        </p>
        <div className="mt-4 space-y-3 max-w-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-base-200 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Mail className="size-4 text-muted shrink-0" />
              <span className="font-semibold text-plum break-all">{profile.email}</span>
            </div>
            <span className="badge badge-sm bg-success/15 text-success text-xs">Verified · private</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-field bg-base-200 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Ticket className="size-4 text-muted shrink-0" />
              <span className="text-muted">Referral code</span>
              <code className="font-mono font-bold text-plum break-all">{profile.referralCode}</code>
            </div>
            <CopyButton value={profile.referralCode} label="Copy" />
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="flex items-center gap-2 font-bold text-plum">
          <UserRound className="size-5 text-secondary" /> Edit profile
        </h2>

        <div className="mt-5 space-y-4 max-w-lg">
          <div>
            <label className="label-text font-semibold text-plum">Display name</label>
            <input
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              maxLength={40}
              className="input input-bordered w-full mt-1"
              placeholder="Your display name"
            />
          </div>
          <div>
            <label className="label-text font-semibold text-plum">Username</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              maxLength={24}
              className="input input-bordered w-full mt-1 font-mono"
              placeholder="lowercase_letters_numbers_"
            />
            <p className="text-xs text-muted mt-1">Shown on leaderboards. Letters, numbers and _ only.</p>
          </div>
          <div>
            <label className="label-text font-semibold text-plum">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              maxLength={160}
              rows={3}
              className="textarea textarea-bordered w-full mt-1"
              placeholder="Tell the community something about youâ€¦"
            />
            <p className="text-right text-xs text-muted mt-1">{form.bio.length}/160</p>
          </div>
          <button onClick={save} className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save profile
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        Your email is private and never shown to others.{" "}
        <Link href="/dashboard/settings" className="underline hover:text-secondary">
          Account settings
        </Link>
      </p>
    </div>
  );
}