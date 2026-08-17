import { MarketingNavbar } from "@/components/layout/MarketingNavbar";
import { Footer } from "@/components/layout/Footer";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

export default async function MarketingLayout({ children }) {
  let user = null;
  let profile = null;
  let wallet = null;

  if (supabaseConfigured()) {
    try {
      user = await getSession();
      if (user) {
        const supabase = await createClient();
        const [profileRes, walletRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("wallets").select("coins").eq("user_id", user.id).maybeSingle(),
        ]);
        profile = profileRes.data || null;
        wallet = walletRes.data || null;
      }
    } catch {
      // Auth reads can fail if Supabase is not configured yet
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar user={user} profile={profile} wallet={wallet} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}