import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { WalletProvider } from "@/hooks/WalletProvider";
import { getSession } from "@/lib/auth/session";
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

  const supabase = createAdminClient();
  let profile = null;
  let unreadCount = 0;

  try {
    const [profileRes, notifRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),
    ]);
    profile = profileRes.data;
    unreadCount = notifRes.count || 0;
  } catch {
    // fall through with defaults
  }

  return (
    <WalletProvider>
      <DashboardShell profile={profile} unreadCount={unreadCount} userId={user.id}>
        {children}
      </DashboardShell>
    </WalletProvider>
  );
}