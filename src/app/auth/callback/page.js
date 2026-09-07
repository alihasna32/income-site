"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [state, setState] = useState("checking"); // checking | success | invalid
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        // Explicitly exchange the OAuth code for a session — required when the
        // SSR client's auto-detection doesn't fire before getSession() is called.
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          if (data?.session) {
            setState("success");
            setTimeout(() => {
              router.push("/dashboard");
              router.refresh();
            }, 600);
            return;
          }
        }

        // Fallback: try to get an existing session
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (data?.session) {
          setState("success");
          setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
          }, 600);
        } else {
          setState("invalid");
        }
      } catch (err) {
        setError(err?.message || "Sign-in failed");
        setState("invalid");
      }
    })();
  }, [router]);

  if (state === "checking") {
    return (
      <div className="py-10 text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-secondary" />
        <p className="mt-4 text-sm text-muted">Finishing sign-in…</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-plum">You're in!</h1>
        <p className="mt-2 text-sm text-muted">Redirecting you to the dashboard…</p>
      </div>
    );
  }

  return (
    <div className="py-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
        <ShieldAlert className="size-7" />
      </div>
      <h1 className="mt-4 text-xl font-extrabold text-plum">Sign-in failed</h1>
      <p className="mt-2 text-sm text-muted">
        {error || "We couldn't complete Google sign-in. Please try again."}
      </p>
      <Link href="/login" className="btn btn-primary mt-6 w-full">
        Back to log in
      </Link>
    </div>
  );
}
