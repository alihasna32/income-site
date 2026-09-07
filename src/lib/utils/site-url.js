/**
 * Single source of truth for the public application URL.
 * Used for auth redirects, password reset links, OAuth callbacks, etc.
 */
export function getSiteUrl() {
  // In production, NEXT_PUBLIC_SITE_URL must be set to the production domain
  // e.g., https://coinquest.example.com
  // In development, it defaults to localhost
  return process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
}

export function getAuthRedirectUrl(path = "/auth/callback") {
  return `${getSiteUrl()}${path}`;
}

export function getResetPasswordUrl() {
  return `${getSiteUrl()}/reset-password`;
}