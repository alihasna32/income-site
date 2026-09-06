"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useFeedbackRotation } from "@/hooks/useFeedbackRotation";
import { cn } from "@/lib/utils/cn";

const formatRelative = (dateString) => {
  if (!dateString) return "";
  const then = new Date(dateString).getTime();
  const now = Date.now();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `${m} minute${m !== 1 ? "s" : ""} ago`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `${h} hour${h !== 1 ? "s" : ""} ago`;
  }
  const d = Math.floor(diff / 86400);
  return `${d} day${d !== 1 ? "s" : ""} ago`;
};

export function FeedbackButton() {
  const { current, loading, feedbacks } = useFeedbackRotation();
  const [open, setOpen] = useState(false);
  const [, forceUpdate] = useState(0);

  // Re-render the relative time every minute to keep it fresh
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-50 lg:bottom-6 lg:right-6 flex size-14 items-center justify-center rounded-full bg-secondary text-white shadow-card hover:scale-105 transition-transform"
        aria-label="Open feedback"
      >
        <MessageCircle className="size-6" />
      </button>

      {/* Panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed bottom-40 right-4 z-50 lg:bottom-24 lg:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-sm rounded-box bg-base-100 border border-base-300 shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
              <h3 className="flex items-center gap-2 font-bold text-plum">
                <MessageCircle className="size-4 text-secondary" /> Community feedback
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-xs btn-circle"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 min-h-[8rem]">
              {loading ? (
                <p className="text-sm text-muted">Loading feedback…</p>
              ) : !current ? (
                <div className="text-center py-6">
                  <MessageCircle className="size-10 mx-auto text-muted" />
                  <p className="mt-3 text-sm font-semibold text-plum">No feedback yet</p>
                  <p className="mt-1 text-xs text-muted">Check back later — admin updates will appear here.</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-plum leading-relaxed">{current.message}</p>
                  <p className="mt-3 text-xs text-muted">
                    Added {formatRelative(current.created_at)}
                  </p>
                  {feedbacks.length > 1 && (
                    <p className="mt-2 text-xs text-muted">
                      Showing {feedbacks.indexOf(current) + 1} of {feedbacks.length} · rotates every 5 min
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
