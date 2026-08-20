"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ reset }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-base-100 px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-error/10 text-error">
        <AlertTriangle className="size-8" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-plum">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        An unexpected error interrupted the fun. Try again — your coins and
        progress are safe.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <button onClick={reset} className="btn btn-primary">
          <RefreshCw className="size-4" /> Try again
        </button>
        <Link href="/" className="btn btn-outline">
          Go home
        </Link>
      </div>
    </div>
  );
}