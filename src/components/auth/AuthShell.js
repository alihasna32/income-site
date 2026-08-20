import Link from "next/link";
import { Flame, Gamepad2, Gift, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export function AuthShell({ children }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden lg:flex w-[44%] max-w-xl flex-col justify-between bg-gradient-to-b from-plum-dark via-plum to-plum-light p-10 text-neutral-content">
        <Logo light />
        <div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
            Play. Challenge yourself.
            <br />
            <span className="text-gold">Earn rewards.</span>
          </h1>
          <p className="mt-4 text-sm text-neutral-content/80 leading-relaxed">
            Join CoinQuest free — claim your day-1 reward, play mini-games and
            build a streak you'll be proud of.
          </p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 rounded-box bg-white/5 border border-white/10 p-3">
              <Gift className="size-5 text-gold shrink-0" />
              <p className="text-sm">Daily rewards that grow with your streak</p>
            </div>
            <div className="flex items-center gap-3 rounded-box bg-white/5 border border-white/10 p-3">
              <Gamepad2 className="size-5 text-gold shrink-0" />
              <p className="text-sm">10+ lightweight games, zero downloads</p>
            </div>
            <div className="flex items-center gap-3 rounded-box bg-white/5 border border-white/10 p-3">
              <ShieldCheck className="size-5 text-gold shrink-0" />
              <p className="text-sm">Server-validated rewards — always fair</p>
            </div>
          </div>
        </div>
        <p className="flex items-center gap-2 text-xs text-neutral-content/60">
          <Flame className="size-4 text-orange" />
          Fun with income.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-base-100 p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>
          <div className="card bg-base-100 border border-base-300 shadow-soft p-6 sm:p-8">
            {children}
          </div>
          <p className="mt-6 text-center text-xs text-muted">
            By continuing you agree to our{" "}
            <Link href="/about" className="underline hover:text-secondary">terms of fun</Link> — rewards are virtual and for entertainment only.
          </p>
        </div>
      </main>
    </div>
  );
}