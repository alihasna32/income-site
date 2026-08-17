export const LEVEL_TITLES = {
  1: "Beginner",
  2: "Explorer",
  3: "Challenger",
  4: "Pro",
  5: "Champion",
  6: "Master",
  7: "Grandmaster",
  8: "Legend",
  9: "Mythic",
  10: "Living Legend",
};

export const LEVELS = [
  { level: 1, title: "Beginner", xp_required: 0 },
  { level: 2, title: "Explorer", xp_required: 100 },
  { level: 3, title: "Challenger", xp_required: 250 },
  { level: 4, title: "Pro", xp_required: 500 },
  { level: 5, title: "Champion", xp_required: 900 },
  { level: 6, title: "Master", xp_required: 1500 },
  { level: 7, title: "Grandmaster", xp_required: 2300 },
  { level: 8, title: "Legend", xp_required: 3300 },
  { level: 9, title: "Mythic", xp_required: 4600 },
  { level: 10, title: "Living Legend", xp_required: 6000 },
];

export function levelForXp(xp) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.xp_required) current = level;
  }
  return current;
}

export function levelProgress(xp) {
  const current = levelForXp(xp);
  const next = LEVELS.find((l) => l.level === current.level + 1) || null;
  if (!next) {
    return { level: current, next: null, progress: 100 };
  }
  const span = next.xp_required - current.xp_required;
  const progress = Math.min(
    100,
    Math.round(((xp - current.xp_required) / span) * 100)
  );
  return { level: current, next, progress };
}