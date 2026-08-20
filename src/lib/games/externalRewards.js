export const EXTERNAL_GAME_MIN_PLAY_SECONDS = 60;
export const EXTERNAL_GAME_MIN_PLAY_MS = EXTERNAL_GAME_MIN_PLAY_SECONDS * 1000;

export function externalGameEligibility(startedAt, now = Date.now()) {
  const startedAtMs = new Date(startedAt).getTime();

  if (!Number.isFinite(startedAtMs)) {
    return {
      startedAt: null,
      eligibleAt: null,
      canClaim: false,
      secondsRemaining: EXTERNAL_GAME_MIN_PLAY_SECONDS,
    };
  }

  const eligibleAtMs = startedAtMs + EXTERNAL_GAME_MIN_PLAY_MS;
  const remainingMs = Math.max(0, eligibleAtMs - now);

  return {
    startedAt: new Date(startedAtMs).toISOString(),
    eligibleAt: new Date(eligibleAtMs).toISOString(),
    canClaim: remainingMs === 0,
    secondsRemaining: Math.ceil(remainingMs / 1000),
  };
}
