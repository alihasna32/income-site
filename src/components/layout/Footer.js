import Link from "next/link";
import {
  Globe,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";

const FOOTER_LINKS = {
  Platform: [
    { href: "/games", label: "Games" },
    { href: "/challenges", label: "Challenges" },
    { href: "/rewards", label: "Rewards" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/how-it-works", label: "How It Works" },
  ],
  Company: [
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ],
  Account: [
    { href: "/login", label: "Log in" },
    { href: "/register", label: "Create account" },
    { href: "/dashboard", label: "Dashboard" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-plum-dark text-neutral-content/80">
      <div className="container-page py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 max-w-sm">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed text-neutral-content/70">
              Play mini-games, complete challenges, scratch cards and build
              streaks to earn virtual coins and XP. Free to play, always fun,
              no real money required.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-neutral-content/60">
              <ShieldCheck className="size-4 text-gold" />
              Rewards are virtual coins for fun — not a money-making scheme.
            </div>
            <div className="mt-5 flex gap-2">
              <a
                href="/about"
                className="btn btn-circle btn-sm bg-white/10 border-0 hover:bg-white/20 text-neutral-content"
                aria-label="Blog"
              >
                <Globe className="size-4" />
              </a>
              <a
                href="/contact"
                className="btn btn-circle btn-sm bg-white/10 border-0 hover:bg-white/20 text-neutral-content"
                aria-label="Community"
              >
                <MessageCircle className="size-4" />
              </a>
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <nav key={heading} aria-label={`${heading} links`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-content">
                {heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-content/70 hover:text-gold transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-neutral-content/50">
          <p>
            © {new Date().getFullYear()} CoinQuest. Virtual rewards only — have
            fun, no purchase necessary.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" /> hello@coinquest.example
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> Played worldwide
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}