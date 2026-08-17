export default function Loading() {
  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="coin-burst relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-2xl text-plum shadow-glow animate-pulse" aria-hidden>
          🪙
        </span>
        <p className="text-sm font-semibold text-muted">Loading your coins…</p>
      </div>
    </div>
  );
}