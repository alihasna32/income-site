"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ChevronRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function BellDropdown({ initialUnread = 0, userId }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!userId) return undefined;
    const supabase = createClient();
    const channel = supabase
      .channel("notifications-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new;
          if (!notification || notification.user_id !== userId) return;
          setUnread((count) => count + 1);
          setItems((prev) =>
            prev ? [notification, ...prev].slice(0, 10) : prev
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const openPanel = useCallback(async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ olderThan: true }),
      });
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setItems(data.notifications || []);
        setUnread(data.unreadCount || 0);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((prev) => (prev || []).map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={openPanel}
        className="relative btn btn-ghost btn-sm btn-circle text-neutral-content hover:bg-white/10"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-box bg-base-100 text-plum shadow-soft border border-base-300">
          <div className="flex items-center justify-between border-b border-base-200 px-4 py-3">
            <p className="text-sm font-bold">Notifications</p>
            <button
              onClick={markAllRead}
              disabled={unread === 0}
              className="btn btn-ghost btn-xs text-secondary disabled:opacity-40"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-base-200">
            {loading && (
              <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </p>
            )}
            {!loading && (!items || items.length === 0) && (
              <p className="px-4 py-8 text-center text-sm text-muted">
                All quiet — notifications appear when you earn coins or hit milestones.
              </p>
            )}
            {!loading &&
              items?.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3",
                    !notification.is_read && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 size-2 shrink-0 rounded-full",
                      notification.is_read ? "bg-base-300" : "bg-secondary"
                    )}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{notification.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-muted/70">{timeAgo(notification.created_at)}</p>
                  </div>
                </div>
              ))}
          </div>

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1 border-t border-base-200 px-4 py-2.5 text-sm font-bold text-secondary hover:bg-base-200/60"
          >
            View all notifications <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
