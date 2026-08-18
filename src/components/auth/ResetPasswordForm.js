"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";

export function ResetPasswordForm() {
  const [state, setState] = useState("checking"); // checking | recovery | invalid | success
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setState("recovery");
      }
    });
    const timer = setTimeout(() => {
      setState((current) => (current === "checking" ? "invalid" : current));
    }, 3000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const updatePassword = useCallback(async (password) => {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      await supabase.auth.signOut();
      setState("success");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  if (state === "checking") {
    return (
      <div className="py-10 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-secondary" />
        <p className="mt-4 text-sm text-muted">Checking your reset link…</p>
      </div>
    );
  }

  if (state === "invalid") {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
          <ShieldAlert className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-plum">Link invalid or expired</h1>
        <p className="mt-2 text-sm text-muted">
          This reset link is no longer valid. Request a new one to continue.
        </p>
        <Link href="/forgot-password" className="btn btn-primary mt-6 w-full">
          Request a new link
        </Link>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-plum">Password updated 🎉</h1>
        <p className="mt-2 text-sm text-muted">Your new password is active. Log in with it now.</p>
        <Link href="/login" className="btn btn-primary mt-6 w-full">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NewPasswordForm onSubmit={updatePassword} loading={loading} error={error} />
      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-secondary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}