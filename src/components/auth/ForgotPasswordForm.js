"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { EmailResetForm } from "@/components/auth/EmailResetForm";
import { OtpVerificationForm } from "@/components/auth/OtpVerificationForm";
import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { usePasswordReset } from "@/hooks/usePasswordReset";

export function ForgotPasswordForm() {
  const router = useRouter();
  const {
    step,
    email,
    setEmail,
    cooldownUntil,
    error,
    loading,
    resending,
    requestCode,
    resendCode,
    verifyCode,
    updatePassword,
    setStep,
  } = usePasswordReset();

  if (step === "success") {
    return (
      <div className="text-center py-6">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-plum">Password reset successful 🎉</h1>
        <p className="mt-2 text-sm text-muted">
          Your new password is active. Log in with it now.
        </p>
        <button onClick={() => router.push("/login")} className="btn btn-primary mt-6 w-full">
          Back to log in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-secondary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}