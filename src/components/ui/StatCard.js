import { cn } from "@/lib/utils/cn";

export function StatCard({ icon: Icon, label, value, sub, tone = "primary", className }) {
  const tones = {
    primary: "bg-primary/12 text-primary-content",
    secondary: "bg-secondary/12 text-secondary-content",
    accent: "bg-accent/10 text-accent-content",
    success: "bg-success/10 text-success-content",
    neutral: "bg-neutral/10 text-neutral-content",
    muted: "bg-muted/15 text-muted",
  };

  return (
    <div
      className={cn(
        "card bg-base-100 border border-base-300 p-4 sm:p-5 shadow-card",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted truncate">{label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight truncate">
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-muted truncate">{sub}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              tones[tone]
            )}
          >
            <Icon className="size-5" />
          </div>
        )}
      </div>
    </div>
  );
}