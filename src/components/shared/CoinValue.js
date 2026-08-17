import { Coins } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function CoinValue({ value, className, iconClass }) {
  return (
    <span className={cn("coin min-w-0", className)}>
      <Coins className={cn("size-4 text-gold-dark shrink-0", iconClass)} aria-hidden="true" />
      <span className="truncate">{new Intl.NumberFormat("en-US").format(value || 0)}</span>
    </span>
  );
}