export function externalGameSrc(embedUrl) {
  return (embedUrl || "").split("?")[0];
}

export function externalPlayerSrc(embedUrl) {
  const raw = externalGameSrc(embedUrl);
  const referrer = typeof window !== "undefined" ? window.location.href : "";
  return `https://embed.gamedistribution.com/?url=${encodeURIComponent(
    raw
  )}&gd_sdk_referrer_url=${encodeURIComponent(referrer)}`;
}