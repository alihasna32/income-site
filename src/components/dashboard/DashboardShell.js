"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Calculator,
  Flag,
  Gamepad2,
  Gift,
  Home,
  Menu as MenuIcon,
  Settings,
  ShieldCheck,
  Ticket,
  Trophy,
  User as UserIcon,
  Users,
  Wallet,
  History,
  Share2,
  Bell,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CoinValue } from "@/components/shared/CoinValue";
import { useWallet } from "@/hooks/WalletProvider";
import { Logo } from "@/components/shared/Logo";


const NAV_GROUPS = [
  {
    label: "Play",
    items: [
      { href: "/dashboard", label: "Overview", icon: Home, match: "/dashboard" },
      { href: "/dashboard/games", label: "Games", icon: Gamepad2 },
      { href: "/dashboard/challenges", label: "Challenges", icon: Flag },
      { href: "/dashboard/scratch", label: "Scratch Cards", icon: Ticket },
      { href: "/dashboard/math-challenge", label: "Math Challenge", icon: Calculator },
      { href: "/dashboard/missions", label: "Missions", icon: Gift },
    ],
  },
  {
    label: "Rewards",
    items: [
      { href: "/dashboard/rewards", label: "Rewards", icon: Trophy },
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
      { href: "/dashboard/transactions", label: "Transactions", icon: History },
      { href: "/dashboard/referral", label: "Referral", icon: Share2 },
    ],
  },
  {
    label: "You",
    items: [
      { href: "/dashboard/achievements", label: "Achievements", icon: Award },
      { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavLink({ item, onClick }) {
  const pathname = usePathname();
  const active =
    item.match === "/dashboard"
      ? pathname === "/dashboard"
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

function SidebarContent({ profile, onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <Logo light />
      </div>

      <div className="mx-4 mb-4 rounded-box bg-white/5 border border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-lg">
            {profile?.avatar_emoji || "😀"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-neutral-content">
              {profile?.displayName || "Player"}
            </p>
            <p className="truncate text-xs text-neutral-content/60">
              @{profile?.username || "—"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-6 space-y-6" aria-label="Dashboard navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-content/40">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} onClick={onNavigate} />
              ))}
            </div>
          </div>
        ))}
        {profile?.role === "admin" && (
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-gold/70">
              Admin
            </p>
            <div className="space-y-1">
              <NavLink
                item={{ href: "/admin", label: "Admin Panel", icon: ShieldCheck }}
                onClick={onNavigate}
              />
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <p className="text-[10px] text-neutral-content/40 leading-relaxed">
          Virtual coins only — have fun, play fair.
        </p>
      </div>
    </div>
  );
}

export function DashboardShell({ children, profile, unreadCount }) {
  const pathname = usePathname();
  const { wallet } = useWallet();
  const [drawerOpen, setDrawerOpen] = useState();
  
  return (
    <div className="min-h-dvh bg-base-200/50">
      <div className="drawer lg:drawer-open">
        <input
          id="dashboard-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={drawerOpen}
          onChange={(e) => setDrawerOpen(e.target.checked)}
          aria-label="Toggle navigation drawer"
        />

        <div className="drawer-side z-40 lg:z-auto">
          <label
            htmlFor="dashboard-drawer"
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
            <SidebarContent
              profile={profile}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>

        <div className="drawer-content flex min-h-dvh flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 bg-plum px-3 text-neutral-content shadow-card sm:px-6">
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost btn-sm btn-square lg:hidden text-neutral-content"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
              >
                <MenuIcon className="size-5" />
              </button>
              <span className="lg:hidden">
                <Logo light />
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <Link
                href="/dashboard/wallet"
                className="flex min-w-0 max-w-[9.5rem] items-center gap-1.5 rounded-field bg-white/10 px-3 py-1.5 text-sm font-bold text-gold hover:bg-white/15"
              >
                <CoinValue value={wallet?.coins} className="text-gold" />
              </Link>
              <Link
                href="/dashboard/notifications"
                className="relative btn btn-ghost btn-sm btn-circle text-neutral-content hover:bg-white/10"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-lg shadow-card"
                aria-label="Your profile"
              >
                {profile?.avatar_emoji || "😀"}
              </Link>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>

      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t border-base-300 bg-base-100/95 backdrop-blur lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="grid grid-cols-5">
          {[
            { href: "/dashboard", label: "Home", icon: Home, match: "/dashboard" },
            { href: "/dashboard/games", label: "Games", icon: Gamepad2 },
            { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
            { href: "/dashboard/leaderboard", label: "Ranks", icon: Trophy },
            { href: "/dashboard/missions", label: "Missions", icon: Gift },
          ].map((item) => {
            const active =
              item.match === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold",
                  active ? "text-secondary" : "text-muted"
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}