"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/shared/ToastProvider";
import { normalizePhone } from "@/components/auth/RegisterForm";
import { claimGuestPrize } from "@/lib/utils/guestSpin";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const identifier = String(form.get("identifier") || "").trim();
    const password = form.get("password");
    const supabase = createClient();

    let email = identifier;
    if (!identifier.includes("@")) {
      const phone = normalizePhone(identifier);
      try {
        const res = await fetch("/api/auth/resolve-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        email = data.email || "";
      } catch {
        email = "";
      }
      if (!email) {
        setLoading(false);
        setError("No account found for that email or phone. Try again.");
        return;
      }
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      if (authError.message.includes("not confirmed")) {
        setError("Please verify your email first — check your inbox for the confirmation link.");
      } else if (authError.message.includes("Invalid login")) {
        setError("Incorrect email/phone or password. Try again.");
      } else {
        setError(authError.message);
      }
      return;
    }

    const won = await claimGuestPrize();
    if (won) {
      toast(`Welcome back! Your free-spin +${won} coins were added.`, "success");
    } else {
      toast("Welcome back!", "success");
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-plum">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Log in to pick up your streak.</p>
      </div>

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
        </div>
      )}

      <label className="form-control">
        <span className="label-text mb-1.5 text-sm font-semibold">Email or phone number</span>
        <input
          name="identifier"
          type="text"
          required
          autoComplete="email"
          className="input input-bordered w-full"
          placeholder="you@example.com or 01712345678"
        />
      </label>

      <label className="form-control">
        <span className="label-text mb-1.5 text-sm font-semibold">Password</span>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="input input-bordered w-full pr-11"
            placeholder="Your password"
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

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm font-medium text-secondary hover:underline">
          Forgot password?
        </Link>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={async () => {
            const supabase = createClient();
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${origin}/auth/callback`,
              },
            });
            if (error) {
              toast("Google login failed", "error");
              return;
            }
            // signInWithOAuth will redirect, so this won't be reached if successful
          }}
          className="btn btn-ghost w-full"
        >
          <GoogleIcon className="size-5" /> Sign in with Google
        </button>
      </div>

      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        Log in
      </button>

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-secondary hover:underline">
          Create a free account
        </Link>
      </p>
    </form>
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