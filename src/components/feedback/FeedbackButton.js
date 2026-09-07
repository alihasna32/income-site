"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useFeedbackRotation } from "@/hooks/useFeedbackRotation";
import { cn } from "@/lib/utils/cn";

function formatRelative(dateString) {
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
}

export function FeedbackButton() {
  const { feedbacks, current, loading } = useFeedbackRotation();
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState(new Set());
  const [, forceUpdate] = useState(0);

  // Re-render the relative time every minute to keep it fresh
  useEffect(() => {
    const id = setInterval(() => forceUpdate((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch seen feedback IDs from server on mount
  useEffect(() => {
    fetch("/api/feedback/seen")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setSeenIds(new Set(data.seenIds || []));
        }
      })
      .catch(() => {});
  }, []);

  const hasUnseen = feedbacks.some((fb) => !seenIds.has(fb.id));

  const markAllSeen = useCallback(async () => {
    if (feedbacks.length === 0) return;
    try {
      const res = await fetch("/api/feedback/seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackIds: feedbacks.map((fb) => fb.id) }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setSeenIds(new Set(feedbacks.map((fb) => fb.id)));
        }
      }
    } catch {
      // silently fail
    }
  }, [feedbacks]);

  const handleOpen = () => {
    setOpen((v) => {
      const next = !v;
      if (next) {
        markAllSeen();
      }
      return next;
    });
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-50 lg:bottom-6 lg:right-6 flex size-14 items-center justify-center rounded-full bg-secondary text-white shadow-card hover:scale-105 transition-transform"
        aria-label="Open feedback"
      >
        <MessageCircle className="size-6" />
        {hasUnseen && (
          <span className="absolute -right-0.5 -top-0.5 flex size-3 items-center justify-center rounded-full bg-error" />
        )}
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
                <MessageCircle className="size-4 text-secondary" /> Feedback
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
                    <div className="mt-3 flex items-center gap-1.5">
                      {feedbacks.map((_, idx) => (
                        <span
                          key={idx}
                          className={cn(
                            "size-1.5 rounded-full transition-colors",
                            idx === feedbacks.indexOf(current)
                              ? "bg-secondary"
                              : "bg-base-300"
                          )}
                        />
                      ))}
                    </div>
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