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