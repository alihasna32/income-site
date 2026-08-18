"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { EmailResetForm } from "@/components/auth/EmailResetForm";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendLink = async () => {
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`;
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (sendError) throw new Error(sendError.message);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <MailCheck className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-plum">Check your email</h1>
        <p className="mt-2 text-sm text-muted">
          If an account exists for <span className="font-semibold text-plum">{email}</span>, we've sent
          a secure link to reset your password. Click it to continue.
        </p>
        <p className="mt-3 text-xs text-muted">
          The link expires after a short time. Don't see it? Check your spam folder.
        </p>
        <button onClick={() => setSent(false)} className="btn btn-ghost btn-sm mt-5">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EmailResetForm
        email={email}
        onEmailChange={setEmail}
        onSubmit={sendLink}
        loading={loading}
        error={error}
        autoFocus
      />
      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-secondary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}