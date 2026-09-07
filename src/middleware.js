import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ---------------------------------------------------------------------------
  // OAuth / PKCE callback handling
  // When the OAuth provider (Google) redirects back with a `?code=...` URL,
  // we exchange it for a session here — on the server — so that:
  //   1. The PKCE code verifier (read from cookies set by the browser client
  //      before the redirect) is available for the exchange.
  //   2. The resulting auth session is written into HTTP-only cookies by
  //      createServerClient, ready for every subsequent request.
  // This avoids the "PKCE code verifier not found in storage" error that
  // happens when the callback is handled client-side with a browser client.
  // ---------------------------------------------------------------------------
  const callbackCode = request.nextUrl.searchParams.get("code");
  const callbackError = request.nextUrl.searchParams.get("error_description") ||
    request.nextUrl.searchParams.get("error");

  if (callbackCode || callbackError) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request: { headers: request.headers } });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    if (callbackError) {
      // OAuth provider returned an error — redirect to login with the error shown
      const url = new URL("/login", request.url);
      url.searchParams.set("auth_error", callbackError);
      return NextResponse.redirect(url);
    }

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(callbackCode);

    if (error) {
      console.error("[middleware] OAuth code exchange failed:", error.message);
      const url = new URL("/login", request.url);
      url.searchParams.set("auth_error", error.message);
      return NextResponse.redirect(url);
    }

    // Session is now stored in cookies — redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ---------------------------------------------------------------------------
  // Standard auth guard (existing behaviour)
  // ---------------------------------------------------------------------------
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const marketingGameMatch = path.match(/^\/games\/([^/]+)$/);
  if (marketingGameMatch) {
    if (user) {
      const url = new URL(`/dashboard/games/${marketingGameMatch[1]}`, request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL("/games", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!reset-password|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
