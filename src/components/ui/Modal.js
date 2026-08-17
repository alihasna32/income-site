"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, size = "md", footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      <div
        className="absolute inset-0 bg-plum-dark/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${sizeClass} bg-base-100 rounded-t-box sm:rounded-box shadow-soft max-h-[92dvh] overflow-y-auto animate-float-up`}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 border-b border-base-300 px-5 py-4 sticky top-0 bg-base-100 z-10 rounded-t-box">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="px-5 py-5">{children}</div>
        {footer && (
          <div className="border-t border-base-300 px-5 py-4 flex flex-wrap justify-end gap-2 sticky bottom-0 bg-base-100 rounded-b-box">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}