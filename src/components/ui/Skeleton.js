import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, variant = "block" }) {
  if (variant === "text") {
    return <div className={cn("skeleton h-4 w-full rounded-field", className)} />;
  }
  if (variant === "circle") {
    return <div className={cn("skeleton size-10 rounded-full", className)} />;
  }
  return <div className={cn("skeleton rounded-box", className)} />;
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("card bg-base-100 border border-base-300 p-5", className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-2/3" />
          <Skeleton variant="text" className="w-1/3" />
        </div>
      </div>
      <Skeleton className="mt-5 h-24 w-full" />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}