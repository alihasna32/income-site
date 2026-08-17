import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/env";
import { AuthShell } from "@/components/auth/AuthShell";
import { SetupRequired } from "@/components/shared/SetupRequired";

export default async function AuthLayout({ children }) {
  if (!supabaseConfigured()) {
    return <SetupRequired />;
  }

  try {
    const user = await getSession();
    if (user) redirect("/dashboard");
  } catch {
    // no session yet — show the auth UI
  }

  return <AuthShell>{children}</AuthShell>;
}