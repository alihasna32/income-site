"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Logo({ light = false, className }) {
  const pathname = usePathname();
  const home = pathname.startsWith("/dashboard")
    ? "/dashboard"
    : pathname.startsWith("/admin")
    ? "/admin"
    : "/";

  return (
    <Link
      href={home}
      className={cn("flex items-center gap-2 font-extrabold tracking-tight", className)}
      aria-label="CoinQuest home"
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-orange shadow-card">
        <Coins className="size-5 text-plum" />
      </span>
      <span className={cn("text-lg", light ? "text-neutral-content" : "text-plum")}>
        Coin<span className="text-gold-dark">Quest</span>
      </span>
    </Link>
  );
}