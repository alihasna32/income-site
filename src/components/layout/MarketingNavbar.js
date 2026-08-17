"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  ChevronDown,
  Coins,
  Flame,
  Gamepad2,
  LogOut,
  Menu,
  Sparkles,
  Trophy,
  User as UserIcon,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/shared/Logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/challenges", label: "Challenges" },
  { href: "/rewards", label: "Rewards" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/how-it-works", label: "How It Works" },
];

export function MarketingNavbar({ user, profile, wallet }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const linkClass = (href) =>
    cn(
      "btn btn-ghost btn-sm px-3 text-neutral-content/80 hover:text-neutral-content hover:bg-white/10",
      pathname === href && "text-neutral-content bg-white/10"
    );

  return (
    <header className="sticky top-0 z-50 bg-plum text-neutral-content shadow-card">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo light />

        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {wallet && (
                <Link
                  href="/dashboard/wallet"
                  className="hidden sm:flex items-center gap-1.5 rounded-field bg-white/10 px-3 py-1.5 text-sm font-bold text-gold hover:bg-white/15"
                >
                  <Coins className="size-4" aria-hidden="true" />
                  {new Intl.NumberFormat("en-US").format(wallet.coins)}
                </Link>
              )}
              <div className="dropdown dropdown-end">
                <button
                  tabIndex={0}
                  className="flex items-center gap-2 rounded-field bg-white/10 px-2.5 py-1.5 hover:bg-white/15"
                  aria-label="Open account menu"
                  aria-expanded={userOpen}
                  onClick={() => setUserOpen((v) => !v)}
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-sm font-bold text-plum">
                    {(profile?.display_name || user.email || "U").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden md:block max-w-28 truncate text-sm font-semibold">
                    {profile?.display_name || "My Account"}
                  </span>
                  <ChevronDown className="size-3.5 opacity-70" />
                </button>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu z-50 mt-2 w-56 rounded-box bg-base-100 p-2 text-plum shadow-soft border border-base-300"
                >
                  <li>
                    <Link href="/dashboard" onClick={() => setUserOpen(false)}>
                      <Sparkles className="size-4 text-gold-dark" /> Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/wallet" onClick={() => setUserOpen(false)}>
                      <Wallet className="size-4 text-gold-dark" /> Wallet
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/achievements" onClick={() => setUserOpen(false)}>
                      <Award className="size-4 text-gold-dark" /> Achievements
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard/profile" onClick={() => setUserOpen(false)}>
                      <UserIcon className="size-4 text-gold-dark" /> Profile
                    </Link>
                  </li>
                  <div className="divider my-1" />
                  <li>
                    <button onClick={logout} className="text-error">
                      <LogOut className="size-4" /> Log out
                    </button>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm text-neutral-content/90 hover:bg-white/10">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm shadow-card">
                Join Free
              </Link>
            </>
          )}

          <button
            className="btn btn-ghost btn-sm lg:hidden text-neutral-content"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="lg:hidden border-t border-white/10 bg-plum-dark px-4 py-3"
          aria-label="Mobile navigation"
        >
          <div className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "btn btn-ghost btn-sm justify-start text-neutral-content/85",
                  pathname === link.href && "bg-white/10 text-neutral-content"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="btn btn-primary btn-sm w-full mt-2"
            >
              <Gamepad2 className="size-4" /> Go to Dashboard
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}