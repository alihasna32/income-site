import Link from "next/link";
import { ArrowRight, Coins, LogIn, Sparkles, Zap } from "lucide-react";
import { getSession } from "@/lib/auth/session";

const SEGMENTS = [10, 20, 0, 30, 50, 0, 75, 100];

export async function SpinToWinSection() {
  const user = await getSession();
  const playHref = user ? "/dashboard/spin" : "/register";

  return (
    <section className="overflow-hidden bg-gradient-to-b from-plum to-plum-dark text-neutral-content py-16 sm:py-20">
      <div className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 flex justify-center lg:order-1">
            <div className="relative">
              <div
                className="relative size-72 sm:size-96 rounded-full border-[10px] border-plum-dark shadow-glow overflow-hidden"
                style={{
                  background:
                    "conic-gradient(from -22.5deg, #F2C230 0 45deg, #46334F 45deg 90deg, #F2C230 90deg 135deg, #46334F 135deg 180deg, #F2C230 180deg 225deg, #46334F 225deg 270deg, #F2C230 270deg 315deg, #46334F 315deg 360deg)",
                }}
                aria-hidden="true"
              >
                {SEGMENTS.map((value, i) => (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{ transform: `rotate(${i * 45}deg)` }}
                  >
                    <span
                      className="absolute left-1/2 top-7 sm:top-9 -translate-x-1/2 text-lg sm:text-2xl font-extrabold drop-shadow"
                      style={{ color: value === 0 ? "#8A7A99" : "#46334F" }}
                    >
                      {value === 0 ? "0" : `+${value}`}
                    </span>
                  </div>
                ))}
                <div className="absolute left-1/2 top-1/2 flex size-14 sm:size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-plum shadow-card">
                  <Coins className="size-7" />
                </div>
              </div>
              <div
                className="absolute left-1/2 -top-2 z-10 -translate-x-1/2 border-x-[14px] border-x-transparent border-t-[26px] border-t-gold drop-shadow-lg"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gold">
              Spin to win
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Three spins a day. Coins every time.
            </h2>
            <p className="mt-4 text-neutral-content/80 leading-relaxed max-w-lg">
              Spin the wheel up to 3 times every day and win between 10 and 100
              coins per spin — or walk away with nothing. Pure luck, instant
              credit.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-box bg-white/10 px-4 py-3">
                <Zap className="size-5 text-gold" />
                <div>
                  <p className="text-sm font-bold">3 spins daily</p>
                  <p className="text-xs text-neutral-content/70">fresh every day</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-box bg-white/10 px-4 py-3">
                <Sparkles className="size-5 text-gold" />
                <div>
                  <p className="text-sm font-bold">10–100 coins</p>
                  <p className="text-xs text-neutral-content/70">per winning spin</p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={playHref} className="btn btn-primary btn-lg shadow-card">
                {user ? "Spin your wheel" : "Join free & spin"} <ArrowRight className="size-4" />
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="btn btn-outline border-white/30 text-neutral-content hover:bg-white/10 hover:border-white/40"
                >
                  <LogIn className="size-4" /> Log in
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}