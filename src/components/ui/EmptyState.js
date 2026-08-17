import { cn } from "@/lib/utils/cn";

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-box border border-dashed border-base-300 bg-base-100 px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon className="size-7" />
        </div>
      )}
      <div>
        <h3 className="text-base font-bold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}