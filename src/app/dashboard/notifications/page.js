"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2, PartyPopper } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameIcon } from "@/components/games/GameIcon";
import { timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function NotificationsPage() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setItems(data.notifications || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((prev) => (prev || []).map((n) => ({ ...n, is_read: true })));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <PageHeader title="Notifications" description="Rewards, streaks, achievements and news." />
        {items.length > 0 && (
          <button onClick={markAllRead} className="btn btn-ghost btn-sm shrink-0">
            <CheckCheck className="size-4" /> Mark all read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All quiet"
          description="Notifications appear when you earn coins, unlock achievements or get close to breaking your streak."
          action={
            <Link href="/dashboard/games" className="btn btn-primary btn-sm">
              Go play
            </Link>
          }
        />
      ) : (
        <div className="card bg-base-100 border border-base-300 shadow-card divide-y divide-base-200">
          {items.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-3 px-4 sm:px-5 py-4",
                !notification.is_read && "bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  notification.type === "achievement"
                    ? "bg-gold/15 text-gold-dark"
                    : notification.type === "streak"
                    ? "bg-accent/10 text-accent"
                    : "bg-secondary/10 text-secondary"
                )}
              >
                {notification.type === "achievement" ? (
                  <PartyPopper className="size-5" />
                ) : (
                  <GameIcon name={notification.icon || "Coins"} className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-plum">{notification.title}</p>
                <p className="mt-0.5 text-sm text-muted">{notification.message}</p>
                <p className="mt-1 text-xs text-muted/80">{timeAgo(notification.created_at)}</p>
              </div>
              {!notification.is_read && (
                <span className="mt-1 size-2.5 shrink-0 rounded-full bg-secondary" aria-label="Unread" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}