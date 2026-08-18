"use client";

import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { EmailResetForm } from "@/components/auth/EmailResetForm";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordModal({ open, onClose, triggerRef, successHref }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setSent(false);
      setError("");
      setLoading(false);
    }
  }, [open]);

  const close = () => {
    onClose();
    triggerRef?.current?.focus();
  };

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

  return (
    <Modal open={open} onClose={close} title={sent ? "Check your email" : "Reset password"} size="sm">
      {sent ? (
        <div className="py-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <MailCheck className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-plum">Check your email</h3>
          <p className="mt-1 text-sm text-muted">
            If an account exists for <span className="font-semibold text-plum">{email}</span>, we've sent
            a secure link to reset your password. It expires after a short time.
          </p>
          <button onClick={close} className="btn btn-primary mt-6 w-full">
            Done
          </button>
        </div>
      ) : (
        <EmailResetForm
          email={email}
          onEmailChange={setEmail}
          onSubmit={sendLink}
          loading={loading}
          error={error}
          autoFocus
        />
      )}
    </Modal>
  );
}