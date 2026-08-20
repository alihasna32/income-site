import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Coins,
  Gamepad2,
  Gift,
  Play,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  Zap,
} from "lucide-react";
import { FreeSpinWheel } from "@/components/marketing/FreeSpinWheel";
import { getSession } from "@/lib/auth/session";

export async function HeroSection() {
  const user = await getSession();
  const playHref = user ? "/dashboard/games" : "/games";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-plum-dark via-plum to-plum-light text-neutral-content">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(242,194,48,0.25) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(242,146,29,0.22) 0%, transparent 45%)",
        }}
        aria-hidden="true"
      />
      <div className="container-page relative py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-float-up">
            <div className="flex flex-wrap gap-2">
              <span className="badge badge-outline border-gold/50 text-gold gap-1.5">
                <Sparkles className="size-3.5" /> New games weekly
              </span>
              <span className="badge badge-outline border-white/25 text-neutral-content/80 gap-1.5">
                <Gift className="size-3.5" /> Daily rewards
              </span>
              <span className="badge badge-outline border-white/25 text-neutral-content/80 gap-1.5">
                <ShieldCheck className="size-3.5" /> Free to play
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Play. Challenge{" "}
              <span className="text-gold">Yourself.</span>
              <br />
              Earn <span className="text-orange">Rewards.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base sm:text-lg text-neutral-content/80 leading-relaxed">
              CoinQuest is a fun rewards platform. Play mini-games, solve math
              challenges, scratch cards, complete daily missions and build
              streaks to earn coins and XP. Also the coins will be converted as real money. Come back every day —
              there's always something new to do.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href={playHref} className="btn btn-primary btn-lg shadow-card">
                <Play className="size-5" /> Start Playing Free
              </Link>
              <Link href="/how-it-works" className="btn btn-outline btn-lg border-white/30 text-neutral-content hover:bg-white/10 hover:border-white/40">
                How it works <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                { icon: Gamepad2, value: "10+", label: "Mini games" },
                { icon: Trophy, value: "12+", label: "Achievements" },
                { icon: Coins, value: "Daily", label: "Coin rewards" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-box border border-white/10 bg-white/5 p-3 text-center"
                >
                  <item.icon className="mx-auto size-5 text-gold" />
                  <p className="mt-1.5 text-lg font-extrabold">{item.value}</p>
                  <p className="text-xs text-neutral-content/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-float-up" style={{ animationDelay: "120ms" }}>
            <div className="relative mx-auto max-w-sm rounded-box bg-white/5 border border-white/10 p-5 shadow-soft backdrop-blur-sm">
              <div className="mb-4 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-gold">
                  Spin to win
                </p>
                <p className="mt-1 text-sm text-neutral-content/80">
                  Three spins a day · win 10–100 coins
                </p>
              </div>
              <FreeSpinWheel isLoggedIn={Boolean(user)} />
            </div>

            <div className="absolute -left-4 top-8 hidden sm:block animate-coin-burst" style={{ animationIterationCount: "infinite", animationDuration: "3s" }}>
              <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum shadow-glow">
                <Zap className="size-6" />
              </span>
            </div>
            <div className="absolute -right-3 top-1/3 hidden sm:block animate-coin-burst" style={{ animationIterationCount: "infinite", animationDuration: "3.6s", animationDelay: "0.6s" }}>
              <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-orange to-flame text-white shadow-card">
                <Ticket className="size-5" />
              </span>
            </div>
            <div className="absolute -bottom-4 left-10 hidden sm:flex items-center gap-2 rounded-full bg-base-100 px-4 py-2 text-sm font-bold text-plum shadow-soft">
              <CalendarCheck className="size-4 text-secondary" />
              Streak: 5 days — 50 coins!
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}