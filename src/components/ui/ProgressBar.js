import { cn } from "@/lib/utils/cn";

export function ProgressBar({ value, max = 100, tone = "primary", className, showValue = false }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const tones = {
    primary: "progress-primary",
    secondary: "progress-secondary",
    accent: "progress-accent",
    success: "progress-success",
    neutral: "progress-neutral",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <progress
        className={cn("progress h-2.5 flex-1", tones[tone])}
        value={pct}
        max="100"
        aria-label={`Progress ${pct}%`}
      />
      {showValue && <span className="text-xs font-semibold text-muted w-10 text-right">{pct}%</span>}
    </div>
  );
}