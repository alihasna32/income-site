"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallback = "/dashboard", label = "Back", className = "" }) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={`btn btn-ghost btn-sm -ml-2 gap-1.5 text-muted hover:text-plum ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}