import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/utils/site-url";

export const dynamic = "force-dynamic";

/**
 * Initiates Google OAuth from the server so the PKCE code verifier is stored
 * in HTTP-only cookies (via createServerClient / @supabase/ssr) rather than in
 * localStorage.  The middleware can then find the verifier when Google redirects
 * back to /auth/callback?code=..., allowing the session to be exchanged without
 * the "PKCE code verifier not found" error.
 */
export async function GET(request) {
  const siteUrl = getSiteUrl();
  const redirectTo = `${siteUrl}/auth/callback`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    const url = new URL("/login", siteUrl);
    url.searchParams.set("auth_error", error?.message || "Google sign-in failed");
    return NextResponse.redirect(url);
  }

  // Auth-js stores the PKCE verifier in cookies via @supabase/ssr storage
  // before redirecting.  When the browser follows data.url (→ Google → callback),
  // the middleware can find the verifier cookie on the same domain.
  return NextResponse.redirect(data.url);
}
