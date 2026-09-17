// Module-level store tracking which external game is currently in its
// one-minute countdown. Shared across all ExternalGameCard instances so that
// only one game can be "played" at a time, and so the active countdown
// survives SPA route changes (it is only cleared when the countdown ends or
// the reward is claimed).
const listeners = new Set();
let activeSlug = null;

export function getActiveCountdownSlug() {
  return activeSlug;
}

export function setActiveCountdown(slug) {
  if (activeSlug === slug) return;
  activeSlug = slug;
  notify();
}

export function clearActiveCountdown(slug) {
  if (activeSlug !== slug) return;
  activeSlug = null;
  notify();
}

export function subscribeCountdown(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  for (const fn of listeners) fn(activeSlug);
}