import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RestrictedShell } from "@/components/dashboard/RestrictedShell";
import { WalletProvider } from "@/hooks/WalletProvider";
import { RewardProvider } from "@/hooks/RewardProvider";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { getSession } from "@/lib/auth/session";
import { getActiveRestriction } from "@/lib/auth/restrictions";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/shared/SetupRequired";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }) {
  if (!supabaseConfigured()) {
    return <SetupRequired />;
  }

  const user = await getSession();
  if (!user) redirect("/login");

  // Server-side restriction check: blocked / suspended users cannot access dashboard.
  const restriction = await getActiveRestriction(user.id);
  if (restriction) {
    return <RestrictedShell restriction={restriction} />;
  }

  const supabase = createAdminClient();
  let profile = null;
  let unreadCount = 0;
  let initialWallet = { coins: 0, total_earned: 0, total_redeemed: 0, taka_balance: 0, total_taka_withdrawn: 0 };

  try {
    const [profileRes, notifRes, walletRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),
      supabase
        .from("wallets")
        .select("coins, total_earned, total_redeemed, taka_balance, total_taka_withdrawn")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    profile = profileRes.data;
    unreadCount = notifRes.count || 0;
    if (walletRes.data) {
      initialWallet = walletRes.data;
    } else if (walletRes.error && /column .* does not exist/i.test(walletRes.error.message || "")) {
      // Taka columns not migrated yet — fall back to legacy columns
      const fallback = await supabase
        .from("wallets")
        .select("coins, total_earned, total_redeemed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (fallback.data) initialWallet = fallback.data;
    }
  } catch {
    // fall through with defaults
  }

  return (
    <RewardProvider>
      <WalletProvider initialWallet={initialWallet}>
        <DashboardShell profile={profile} unreadCount={unreadCount} userId={user.id}>
          {children}
        </DashboardShell>
        <FeedbackButton />
      </WalletProvider>
    </RewardProvider>
  );
}