"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { EmailResetForm } from "@/components/auth/EmailResetForm";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { usePasswordReset } from "@/hooks/usePasswordReset";

export function ResetPasswordModal({ open, onClose, triggerRef, successHref = "/dashboard/settings" }) {
  const router = useRouter();
  const {
    step,
    email,
    setEmail,
    cooldownUntil,
    error,
    loading,
    resending,
    reset,
    requestCode,
    resendCode,
    verifyCode,
    updatePassword,
    setStep,
  } = usePasswordReset();

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const close = () => {
    if ((step === "otp" || step === "password") && !window.confirm("Leave password reset? Your code will stop working.")) {
      return;
    }
    onClose();
    triggerRef?.current?.focus();
  };

  const finish = () => {
    onClose();
    router.push(successHref);
  };

  const title =
    step === "email" ? "Reset password" : step === "success" ? "Password updated" : "Verify your identity";

  return (
    <Modal open={open} onClose={close} title={title} size="sm">
      {step === "email" && (
        <EmailResetForm
          email={email}
          onEmailChange={setEmail}
          onSubmit={requestCode}
          loading={loading}
          error={error}
          autoFocus
        />
      )}

      {step === "otp" && (
        <OtpVerificationForm
          email={email}
          cooldownUntil={cooldownUntil}
          onVerify={verifyCode}
          onResend={resendCode}
          onBack={() => setStep("email")}
          loading={loading}
          resending={resending}
          error={error}
        />
      )}

      {step === "password" && (
        <NewPasswordForm onSubmit={updatePassword} loading={loading} error={error} />
      )}

      {step === "success" && (
        <div className="py-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-plum">Password reset successful 🎉</h3>
          <p className="mt-1 text-sm text-muted">
            Your new password is active. Use it next time you log in.
          </p>
          <button onClick={finish} className="btn btn-primary mt-6 w-full">
            <LockKeyhole className="size-4" />
            Back to settings
          </button>
        </div>
      )}
    </Modal>
  );
}