"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Gift, Loader2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/ToastProvider";
import { claimGuestPrize } from "@/lib/utils/guestSpin";
import { cn } from "@/lib/utils/cn";
import { registerSchema } from "@/lib/validations";

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
  const [referralCode, setReferralCode] = useState(refCode);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const displayName = String(form.get("displayName") || "").trim();
    const phone = normalizePhone(form.get("phone"));
    const referral = String(form.get("referralCode") || "").trim();

    // Client-side validation: check all required fields are non-empty first
    if (!displayName) {
      setError("Please enter your display name.");
      setLoading(false);
      return;
    }
    if (!email) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    // Client-side Gmail domain validation
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      setError("Only @gmail.com addresses are allowed.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          avatar_emoji: avatarEmoji,
          ref_code: referral,
          phone,
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
      const won = await claimGuestPrize();
      if (won) {
        toast(`Welcome to CoinQuest, ${displayName}! Your free-spin +${won} coins are in your wallet.`, "success");
      } else {
        toast(`Welcome to CoinQuest, ${displayName}! Your day-1 reward awaits.`, "success");
      }
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
        <span className="label-text mb-1.5 text-sm font-semibold">Email <span className="text-xs text-muted">(Gmail only)</span></span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input input-bordered w-full"
          placeholder="yourname@gmail.com"
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1.5 text-sm font-semibold">
          Phone number 
        </span>
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          required
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

      <label className="form-control">
        <span className="label-text mb-1.5 text-sm font-semibold">
          Referral code <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          name="referralCode"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.trim())}
          maxLength={8}
          autoComplete="off"
          className="input input-bordered w-full"
          placeholder="Friend's code — e.g. a1b2c3d4"
        />
        <p className="text-xs text-muted mt-1">
          Use a friend's code and you both earn a bonus — you get 60 coins, they get 30.
        </p>
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

      <div className="divider text-xs text-muted">or</div>

      <button
        type="button"
        onClick={() => {
          setError("");
          setLoading(true);
          window.location.href = "/api/auth/google-signin";
        }}
        className="btn btn-ghost w-full"
        disabled={loading}
      >
        <GoogleIcon className="size-5" /> Continue with Google
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

function GoogleIcon({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}