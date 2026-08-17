export function slugUsername(displayName) {
  const slug = (displayName || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);
  return slug || "player";
}

export async function findUniqueUsername(admin, displayName) {
  const base = slugUsername(displayName);
  for (let i = 0; i < 25; i++) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const candidate = `${base}${suffix}`;
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}${Date.now() % 1000000}`;
}