"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Coins, LogOut, LockKeyhole, Mail, Shield, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/components/shared/ToastProvider";
import { useWallet } from "@/hooks/WalletProvider";
import { ResetPasswordModal } from "@/components/auth/ResetPasswordModal";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { wallet } = useWallet();

  const [signingOut, setSigningOut] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const resetTriggerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setIsAdmin(Boolean(data.isAdmin));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAdminChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setSigningOut(false);
      toast("Could not sign out", "error");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Account preferences and privacy." />

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="flex items-center gap-2 font-bold text-plum">
          <Bell className="size-5 text-secondary" /> Notifications
        </h2>
        <p className="mt-1 text-sm text-muted">
          Currently: you get notifications when you earn coins, unlock achievements,
          or are about to lose your streak. Notification preferences are coming soon.
        </p>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="flex items-center gap-2 font-bold text-plum">
          <Shield className="size-5 text-secondary" /> Security
        </h2>
        <div className="mt-4 space-y-4 max-w-lg">
          <div className="flex items-center justify-between gap-3 rounded-field bg-base-200 p-4">
            <div>
              <p className="text-sm font-semibold text-plum">Password</p>
              <p className="text-xs text-muted">
                Reset it with a one-time code sent to your email.
              </p>
            </div>
            <button
              onClick={() => setResetOpen(true)}
              ref={resetTriggerRef}
              className="btn btn-outline btn-sm shrink-0"
            >
              <LockKeyhole className="size-4" />
              Reset password
            </button>
          </div>
          <div className="rounded-field bg-base-200 p-4 text-sm text-muted">
            <p className="flex items-center gap-2 font-semibold text-plum">
              <Mail className="size-4 text-secondary" /> Email
            </p>
            <p className="mt-1">Your email address is never shown publicly.</p>
          </div>
        </div>

        <ResetPasswordModal
          open={resetOpen}
          onClose={() => setResetOpen(false)}
          triggerRef={resetTriggerRef}
          successHref="/dashboard/settings"
        />
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="flex items-center gap-2 font-bold text-plum">
          <Coins className="size-5 text-gold-dark" /> Wallet
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="badge badge-lg bg-primary/15 text-plum">
            {new Intl.NumberFormat("en-US").format(wallet?.coins || 0)} coins available
          </span>
          <span className="badge badge-lg bg-secondary/10 text-plum">
            <Sparkles className="size-3.5 mr-1" /> {new Intl.NumberFormat("en-US").format(wallet?.total_earned || 0)} earned total
          </span>
        </div>
        <p className="mt-3 text-xs text-muted">
          Coins are virtual and have no cash value. See the{" "}
          <Link href="/how-it-works" className="underline hover:text-secondary">fair play guide</Link>.
        </p>
      </section>

      {adminChecked && isAdmin && (
        <section className="card bg-base-100 border border-base-300 shadow-card p-6">
          <h2 className="flex items-center gap-2 font-bold text-plum">
            <ShieldCheck className="size-5 text-secondary" /> Admin
          </h2>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-field bg-base-200 p-4 max-w-lg">
            <div>
              <p className="text-sm font-semibold text-plum">Admin panel</p>
              <p className="text-xs text-muted">
                Switch to the admin dashboard to manage players, rewards and settings.
              </p>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-secondary shrink-0"
              aria-label="Go to admin panel"
              onChange={(e) => {
                if (e.target.checked) router.push("/admin");
              }}
            />
          </div>
        </section>
      )}

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="flex items-center gap-2 font-bold text-error">
          <LogOut className="size-5" /> Danger zone
        </h2>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-field bg-base-200 p-4">
          <div>
            <p className="text-sm font-semibold text-plum">Sign out</p>
            <p className="text-xs text-muted">You can log back in anytime.</p>
          </div>
          <button onClick={signOut} className="btn btn-error btn-sm shrink-0" disabled={signingOut}>
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </section>
    </div>
  );
}