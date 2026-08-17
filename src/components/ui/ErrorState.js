import { AlertTriangle } from "lucide-react";

export function ErrorState({ title = "Something went wrong", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-box border border-error/20 bg-error/5 px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
        <AlertTriangle className="size-7" />
      </div>
      <div>
        <h3 className="text-base font-bold">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  );
}