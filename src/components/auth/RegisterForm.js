"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Gift, Loader2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/ToastProvider";
import { cn } from "@/lib/utils/cn";

const EMOJIS = ["😀", "😎", "🤓", "🦊", "🐼", "🦁", "🚀", "🌟", "🎮", "🏆"];

export function normalizePhone(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function RegisterFormInner() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") || "";
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarEmoji, setAvatarEmoji] = useState(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const displayName = form.get("displayName").trim();
    const email = form.get("email").trim();
    const phone = normalizePhone(form.get("phone"));
    const password = form.get("password");

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          avatar_emoji: avatarEmoji,
          ref_code: refCode,
          phone: phone || "",
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setLoading(false);

    if (authError) {
      if (authError.message.includes("already registered")) {
        setError("That email is already registered. Try logging in instead.");
      } else {
        setError(authError.message);
      }
      return;
    }

    if (data.session) {
      toast(`Welcome to CoinQuest, ${displayName}! Your day-1 reward awaits.`, "success");
      window.location.href = "/dashboard";
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <Gift className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-plum">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted">
          We sent a confirmation link to your email. Click it to activate your
          account — then come back and claim your day-1 reward!
        </p>
        <Link href="/login" className="btn btn-primary mt-6 w-full">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-plum">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Free forever. No purchases, ever.</p>
      </div>

      {refCode && (
        <div className="alert alert-info text-sm py-2.5">
          <span>
            🎉 You're joining through a friend's invite — you're both in for a
            welcome bonus!
          </span>
        </div>
      )}

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
        </div>
      )}

      <label className="form-control">
        <span className="label-text mb-1.5 text-sm font-semibold">Display name</span>
        <input
          name="displayName"
          required
          minLength={2}
          maxLength={40}
          className="input input-bordered w-full"
          placeholder="How should we call you?"
          autoComplete="nickname"
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1.5 text-sm font-semibold">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input input-bordered w-full"
          placeholder="you@example.com"
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1.5 text-sm font-semibold">
          Phone number <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          minLength={7}
          maxLength={15}
          autoComplete="tel"
          className="input input-bordered w-full"
          placeholder="e.g. 01712345678"
        />
        <p className="text-xs text-muted mt-1">
          Add a number to log in with either your email or phone.
        </p>
      </label>

      <label className="form-control">
        <span className="label-text mb-1.5 text-sm font-semibold">Password</span>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            className="input input-bordered w-full pr-11"
            placeholder="8+ characters"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </label>

      <fieldset>
        <legend className="label-text mb-1.5 text-sm font-semibold">Pick an avatar</legend>
        <div className="grid grid-cols-10 gap-1.5">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setAvatarEmoji(emoji)}
              aria-label={`Choose avatar ${emoji}`}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border text-lg transition-all",
                avatarEmoji === emoji
                  ? "border-secondary bg-secondary/15 scale-110"
                  : "border-base-300 bg-base-200 hover:border-muted"
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Create account
      </button>

      <p className="text-center text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-secondary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={null}>
      <RegisterFormInner />
    </Suspense>
  );
}