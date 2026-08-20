import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth/session";

export async function CtaSection() {
  const user = await getSession();
  const primaryHref = user ? "/dashboard" : "/register";
  const primaryLabel = user ? "Open your dashboard" : "Create free account";

  return (
    <section className="py-10 sm:py-12">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-box bg-gradient-to-br from-plum via-plum-light to-plum-dark p-6 sm:p-10 text-center text-neutral-content shadow-soft">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 30% 20%, rgba(242,194,48,0.3) 0%, transparent 40%), radial-gradient(circle at 75% 80%, rgba(242,146,29,0.25) 0%, transparent 45%)",
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready for today's challenge?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-neutral-content/80">
              Join free in seconds, claim your day-1 reward and see what you can
              achieve. Your streak starts now.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={primaryHref} className="btn btn-primary btn-lg shadow-card w-full sm:w-auto">
                {primaryLabel} <ArrowRight className="size-5" />
              </Link>
              <Link
                href="/games"
                className="btn btn-outline btn-lg border-white/30 text-neutral-content hover:bg-white/10 hover:border-white/40 w-full sm:w-auto"
              >
                Browse games
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}