"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, CheckCheck, Inbox, Loader2, Mail, Search } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const STATUS_ORDER = ["new", "read", "replied", "archived"];

const STATUS_BADGE = {
  new: "bg-accent/15 text-accent",
  read: "bg-base-200 text-muted",
  replied: "bg-success/15 text-success",
  archived: "bg-base-200 text-muted/70",
};

export function ContactMessagesTable({ initialMessages, totalCount, initialNewCount }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState(initialMessages);
  const [newCount, setNewCount] = useState(initialNewCount);
  const [filter, setFilter] = useState("");
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState(null);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) => {
      if (filter && m.status !== filter) return false;
      if (!q) return true;
      return (
        (m.name || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.subject || "").toLowerCase().includes(q) ||
        (m.message || "").toLowerCase().includes(q)
      );
    });
  }, [messages, filter, query]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/messages?limit=100`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
        setNewCount(data.newCount || 0);
      }
    } catch {
      // keep current list
    } finally {
      setLoading(false);
    }
  };

  const update = async (message, status) => {
    if (updating) return;
    setUpdating(message.id);
    try {
      const res = await fetch(`/api/admin/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: notes[message.id] || "" }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, status, admin_note: notes[m.id] || m.admin_note } : m))
        );
        if (status === "new") setNewCount((c) => c + 1);
        else if (message.status === "new") setNewCount((c) => Math.max(0, c - 1));
        toast(`Marked as ${status}`, "success");
      } else {
        const data = await res.json();
        toast(data.error || "Could not update message", "error");
      }
    } catch {
      toast("Could not update message", "error");
    } finally {
      setUpdating(null);
    }
  };

  const statusTabs = [
    { value: "", label: "All", count: totalCount },
    { value: "new", label: "New", count: newCount },
    ...STATUS_ORDER.slice(1).map((s) => ({ value: s, label: s, count: messages.filter((m) => m.status === s).length })),
  ];

  return (
    <div className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-base-200">
        <div className="flex flex-wrap gap-1.5">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                "btn btn-sm",
                filter === tab.value ? "btn-primary" : "btn-ghost"
              )}
            >
              {tab.label}
              <span className="badge badge-sm badge-soft ml-0.5">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input input-sm input-bordered pl-9 w-56 sm:w-64"
            placeholder="Search messages…"
            aria-label="Search messages"
          />
        </div>
      </div>

      <div className="divide-y divide-base-200">
        {loading && (
          <p className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Refreshing…
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <Inbox className="size-10 text-muted/50" />
            <p className="text-sm text-muted">No messages{filter ? ` with status "${filter}"` : ""}.</p>
          </div>
        )}
        {!loading &&
          filtered.map((message) => (
            <div key={message.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-base">
                    {message.profiles?.avatar_emoji || (message.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-plum">
                      {message.name}
                      {message.profiles && (
                        <Link
                          href={`/admin/users`}
                          className="ml-1.5 text-xs font-semibold text-secondary hover:underline"
                        >
                          (member)
                        </Link>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {message.email} · {formatDateTime(message.created_at)}
                    </p>
                  </div>
                </div>
                <span className={cn("badge badge-sm capitalize", STATUS_BADGE[message.status])}>
                  {message.status}
                </span>
              </div>

              <p className="mt-3 text-sm font-semibold text-plum">{message.subject}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-muted leading-relaxed">
                {message.message}
              </p>

              {message.admin_note && (
                <p className="mt-2 rounded-box bg-base-200/70 px-3 py-2 text-xs text-muted">
                  <span className="font-bold">Note:</span> {message.admin_note}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={notes[message.id] || ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [message.id]: e.target.value }))}
                  className="input input-sm input-bordered flex-1 min-w-40 max-w-sm"
                  placeholder="Admin note (optional)"
                  aria-label={`Note for message from ${message.name}`}
                />
                {message.status !== "read" && message.status !== "replied" && (
                  <button
                    onClick={() => update(message, "read")}
                    disabled={updating === message.id}
                    className="btn btn-outline btn-sm"
                  >
                    {updating === message.id ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => update(message, "replied")}
                  disabled={updating === message.id}
                  className="btn btn-outline btn-sm"
                >
                  {updating === message.id ? <Loader2 className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                  Replied
                </button>
                {message.status !== "archived" && (
                  <button
                    onClick={() => update(message, "archived")}
                    disabled={updating === message.id}
                    className="btn btn-ghost btn-sm"
                  >
                    <Archive className="size-3.5" /> Archive
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {!loading && messages.length > 0 && (
        <div className="flex items-center justify-between border-t border-base-200 px-5 py-3">
          <p className="text-xs text-muted">
            Showing {filtered.length} of {messages.length} loaded messages
          </p>
          <button onClick={reload} className="btn btn-ghost btn-xs">
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}