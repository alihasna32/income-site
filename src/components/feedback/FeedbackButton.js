"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useFeedbackRotation } from "@/hooks/useFeedbackRotation";
import { cn } from "@/lib/utils/cn";

export function FeedbackButton() {
  const { feedbacks, current, loading } = useFeedbackRotation();
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState(new Set());

  // Hydrate seen feedback IDs from the server on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/feedback/seen")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setSeenIds(new Set(data.seenIds || []));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on Escape when the panel is open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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
        const data = await res.json().catch(() => null);
        if (data?.ok) {
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
      if (next) markAllSeen();
      return next;
    });
  };

  return (
    <>
      {/* Floating button — fixed lower-right, responsive sizing & positioning */}
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "fixed z-50 flex items-center justify-center rounded-full",
          "bg-secondary text-white shadow-card",
          "transition-transform duration-200 ease-out hover:scale-105 active:scale-95",
          "size-14 right-4 bottom-24 lg:size-14 lg:right-6 lg:bottom-6"
        )}
        aria-label="Open feedback"
        aria-expanded={open}
      >
        <MessageCircle className="size-6" />
        {hasUnseen && (
          <span
            className="absolute -right-0.5 -top-0.5 size-3 rounded-full bg-error ring-2 ring-base-100"
            aria-label="Unread feedback"
          />
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-feedback-fade"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="Feedback"
            className={cn(
              "fixed z-50 overflow-hidden rounded-box bg-base-100 border border-base-300 shadow-card",
              "animate-feedback-pop",
              "inset-x-0 bottom-0 sm:inset-auto sm:right-6 sm:bottom-24",
              "sm:w-[24rem] sm:max-w-[calc(100vw-3rem)]"
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-200">
              <h3 className="flex items-center gap-2 font-bold text-plum">
                <MessageCircle className="size-4 text-secondary" /> Feedback
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-xs btn-circle"
                aria-label="Close feedback"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 max-h-[70vh] sm:max-h-[26rem] overflow-y-auto">
              {loading ? (
                <p className="text-sm text-muted py-6 text-center">Loading feedback…</p>
              ) : feedbacks.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="size-10 mx-auto text-muted" />
                  <p className="mt-3 text-sm font-semibold text-plum">No feedback yet</p>
                  <p className="mt-1 text-xs text-muted">Check back later — admin updates will appear here.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {feedbacks.map((fb) => {
                    const isCurrent = current && current.id === fb.id;
                    return (
                      <li
                        key={fb.id}
                        className={cn(
                          "rounded-field border px-3 py-3 transition-colors",
                          isCurrent
                            ? "border-secondary/40 bg-secondary/5"
                            : "border-base-200 bg-base-200/40"
                        )}
                      >
                        <p className="text-sm text-plum leading-relaxed whitespace-pre-wrap break-words">
                          {fb.message}
                        </p>
                        <p className="mt-2 text-xs text-muted">
                          <span className="font-semibold text-plum">{fb.author || "Admin"}</span>{" "}
                          {fb.displayMinutes} min ago
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
