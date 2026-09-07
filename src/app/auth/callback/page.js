import Link from "next/link";
import { CheckCircle2, ShieldAlert } from "lucide-react";

/**
 * This page is reached as the OAuth redirect URL (/auth/callback).
 *
 * The actual code exchange and cookie-setting is done in middleware.js — it
 * intercepts the ?code=... URL, exchanges it for a session on the server,
 * writes the auth cookies, and redirects to /dashboard before this page
 * ever renders.
 *
 * This component only shows as a fallback if the user lands here without a
 * code or after an error.
 */
export default async function AuthCallbackPage() {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="size-7" />
      </div>
      <h1 className="mt-4 text-xl font-extrabold text-plum">You're in!</h1>
      <p className="mt-2 text-sm text-muted">
        Redirecting you to the dashboard…
      </p>
      <Link href="/dashboard" className="btn btn-primary mt-6 w-full">
        Go to dashboard
      </Link>
    </div>
  );
}
