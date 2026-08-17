import Link from "next/link";
import { Compass, Gamepad2, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-base-100 px-4 text-center">
      <span className="text-7xl" aria-hidden>🪙</span>
      <h1 className="mt-6 text-4xl font-extrabold text-plum">404 — Coins not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        This page has been scratched off. Head back to the game floor and keep
        collecting.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">
          <Home className="size-4" /> Back home
        </Link>
        <Link href="/games" className="btn btn-outline">
          <Gamepad2 className="size-4" /> Browse games
        </Link>
        <Link href="/faq" className="btn btn-ghost">
          <Compass className="size-4" /> Help
        </Link>
      </div>
    </div>
  );
}