export function externalGameSrc(embedUrl) {
  const raw = (embedUrl || "").split("?")[0];
  const referrer = typeof window !== "undefined" ? window.location.href : "";
  return `https://embed.gamedistribution.com/?url=${encodeURIComponent(
    raw
  )}&gd_sdk_referrer_url=${encodeURIComponent(referrer)}`;
}
