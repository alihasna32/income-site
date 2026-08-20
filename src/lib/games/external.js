export function externalGameSrc(embedUrl) {
  return (embedUrl || "").trim();
}

export function externalPlayerSrc(embedUrl) {
  const raw = externalGameSrc(embedUrl);
  const referrer = typeof window !== "undefined" ? window.location.href : "";

  if (!raw || !referrer) return raw;

  try {
    const url = new URL(raw);
    if (url.hostname !== "html5.gamedistribution.com") return raw;

    url.searchParams.set("gd_sdk_referrer_url", referrer);
    return url.toString();
  } catch {
    return raw;
  }
}

export async function startExternalGame(slug) {
  try {
    const response = await fetch(`/api/games/${slug}/start`, { method: "POST" });
    const data = await response.json();

    if (response.ok && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("external-game-started", { detail: { slug, ...data } })
      );
    }

    return response.ok ? data : null;
  } catch {
    return null;
  }
}
