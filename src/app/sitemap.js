const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const STATIC_ROUTES = [
  "",
  "/games",
  "/challenges",
  "/rewards",
  "/leaderboard",
  "/how-it-works",
  "/about",
  "/faq",
  "/contact",
  "/login",
  "/register",
];

export default async function sitemap() {
  const routes = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  return routes;
}