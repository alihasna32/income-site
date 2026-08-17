"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Coins,
  Gamepad2,
  History,
  LayoutDashboard,
  Menu as MenuIcon,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/shared/Logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, match: "/admin" },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  { href: "/admin/rewards", label: "Rewards & Ledger", icon: Coins },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Banknote },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminNavLink({ item, onClick }) {
  const pathname = usePathname();
  const active =
    item.match === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-gold text-plum font-bold shadow-card"
          : "text-neutral-content/75 hover:bg-white/10 hover:text-neutral-content"
      )}
    >
      <item.icon className="size-4.5 shrink-0" />
      {item.label}
    </Link>
  );
}

export function AdminShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-base-200/50">
      <div className="drawer lg:drawer-open">
        <input
          id="admin-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={drawerOpen}
          onChange={(e) => setDrawerOpen(e.target.checked)}
          aria-label="Toggle admin navigation"
        />

        <div className="drawer-side z-40 lg:z-auto">
          <label
            htmlFor="admin-drawer"
            className="drawer-overlay"
            aria-label="Close navigation"
          />
          <aside className="w-72 bg-plum min-h-full">
            <div className="lg:hidden absolute right-3 top-4">
              <button
                className="btn btn-ghost btn-sm btn-circle text-neutral-content"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex h-full flex-col">
              <div className="px-5 py-6">
                <Logo light />
                <span className="badge badge-sm mt-3 bg-gold text-plum font-bold">Admin</span>
              </div>
              <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-1" aria-label="Admin navigation">
                {NAV_ITEMS.map((item) => (
                  <AdminNavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />
                ))}
              </nav>
              <div className="border-t border-white/10 p-4">
                <Link href="/dashboard" className="btn btn-ghost btn-sm w-full text-neutral-content hover:bg-white/10">
                  <ArrowLeft className="size-4" /> Back to dashboard
                </Link>
              </div>
            </div>
          </aside>
        </div>

        <div className="drawer-content flex min-h-dvh flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 bg-plum px-4 text-neutral-content shadow-card sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="btn btn-ghost btn-sm btn-square lg:hidden text-neutral-content"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open admin navigation"
              >
                <MenuIcon className="size-5" />
              </button>
              <span className="lg:hidden">
                <Logo light />
              </span>
            </div>
            <Link href="/dashboard" className="btn btn-ghost btn-sm text-neutral-content hover:bg-white/10">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-16">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}