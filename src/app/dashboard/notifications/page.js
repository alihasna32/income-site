"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ListChecks, Loader2, PartyPopper } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { GameIcon } from "@/components/games/GameIcon";
import { timeAgo } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const TYPE_FILTERS = [
  { value: "", label: "All" },
  { value: "reward", label: "Rewards" },
  { value: "mission", label: "To do" },
  { value: "achievement", label: "Achievements" },
  { value: "referral", label: "Referrals" },
  { value: "streak", label: "Streaks" },
  { value: "system", label: "System" },
];

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");

  const load = useCallback(async (pageToLoad = 1, typeToLoad = type) => {
    try {
      const res = await fetch(
        `/api/notifications?page=${pageToLoad}&limit=${PAGE_SIZE}${
          typeToLoad ? `&type=${typeToLoad}` : ""
        }`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (res.ok) {
        setItems((prev) =>
          pageToLoad === 1 ? data.notifications || [] : [...(prev || []), ...(data.notifications || [])]
        );
        setTotal(data.total || 0);
        setUnreadCount(data.unreadCount || 0);
        return data.notifications?.length || 0;
      }
    } catch {
      setItems((prev) => (pageToLoad === 1 ? [] : prev));
      return 0;
    }
    return 0;
  }, [type]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load(1);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const markAllRead = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((prev) => (prev || []).map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const changeType = (value) => {
    setType(value);
    setPage(1);
    setLoading(true);
  };

  const loadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    await load(next);
    setPage(next);
    setLoadingMore(false);
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
        <PageHeader
          title="Notifications"
          description={
            unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
              : "Rewards, streaks, achievements and news."
          }
        />
        {items.length > 0 && (
          <button onClick={markAllRead} className="btn btn-ghost btn-sm shrink-0">
            <CheckCheck className="size-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter notifications">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            role="tab"
            aria-selected={type === filter.value}
            onClick={() => changeType(filter.value)}
            className={cn(
              "btn btn-sm",
              type === filter.value ? "btn-primary" : "btn-outline"
            )}
          >
            {filter.value === "mission" && <ListChecks className="size-4" />}
            {filter.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={type ? "Nothing in this category" : "All quiet"}
          description={
            type
              ? "No notifications of this type yet — keep playing and they'll show up here."
              : "Notifications appear when you earn coins, unlock achievements or get close to breaking your streak."
          }
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
                    : notification.type === "mission"
                    ? "bg-secondary/10 text-secondary"
                    : "bg-base-200 text-muted"
                )}
              >
                {notification.type === "achievement" ? (
                  <PartyPopper className="size-5" />
                ) : notification.type === "mission" ? (
                  <ListChecks className="size-5" />
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

      {items.length > 0 && items.length < total && (
        <div className="flex justify-center">
          <button onClick={loadMore} disabled={loadingMore} className="btn btn-outline btn-sm">
            {loadingMore ? <Loader2 className="size-4 animate-spin" /> : null}
            Load more ({total - items.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}