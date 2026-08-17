import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/env";
import { SetupRequired } from "@/components/shared/SetupRequired";

export const metadata = {
  robots: { index: false, follow: false },
  title: { default: "Admin", template: "%s · CoinQuest Admin" },
};

export default async function AdminLayout({ children }) {
  if (!supabaseConfigured()) {
    return <SetupRequired />;
  }

  const admin = await requireAdmin();
  if (!admin) redirect("/login");

  return <AdminShell>{children}</AdminShell>;
}