"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Plus, Trash2, ToggleLeft, ToggleRight, Save, X, Pencil } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function FeedbackManager() {
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editDraft, setEditDraft] = useState("");
  const [editLabelDraft, setEditLabelDraft] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feedback", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(data.feedbacks || []);
      } else {
        toast(data.error || "Could not load feedback", "error");
      }
    } catch {
      toast("Could not load feedback", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!draft.trim()) {
      toast("Message cannot be empty", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: draft.trim(), is_active: true }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Feedback added", "success");
        setDraft("");
        load();
      } else {
        toast(data.error || "Could not add feedback", "error");
      }
    } catch {
      toast("Could not add feedback", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (fb) => {
    try {
      const res = await fetch(`/api/admin/feedback/${fb.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !fb.is_active }),
      });
      if (res.ok) {
        toast(fb.is_active ? "Feedback hidden" : "Feedback shown", "success");
        load();
      } else {
        toast("Could not update", "error");
      }
    } catch {
      toast("Could not update", "error");
    }
  };

  const remove = async (fb) => {
    if (!window.confirm("Delete this feedback? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/feedback/${fb.id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Feedback deleted", "success");
        load();
      } else {
        toast("Could not delete", "error");
      }
    } catch {
      toast("Could not delete", "error");
    }
  };

  const startEdit = (fb) => {
    setEditing(fb.id);
    setEditDraft(fb.message);
    setEditLabelDraft(fb.user_label || "");
  };

  const saveEdit = async () => {
    if (!editDraft.trim()) {
      toast("Message cannot be empty", "error");
      return;
    }
    try {
      const res = await fetch(`/api/admin/feedback/${editing}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: editDraft.trim(),
          user_label: editLabelDraft.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast("Feedback updated", "success");
        setEditing(null);
        setEditDraft("");
        setEditLabelDraft("");
        load();
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Could not update", "error");
      }
    } catch {
      toast("Could not update", "error");
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditDraft("");
    setEditLabelDraft("");
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
      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="flex items-center gap-2 font-bold text-plum">
          <Plus className="size-5 text-secondary" /> Add new feedback
        </h2>
        <p className="mt-1 text-sm text-muted">Share an update, announcement or thank-you note with all users.</p>
        <div className="mt-4 space-y-3 max-w-2xl">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={2000}
            className="textarea textarea-bordered w-full"
            placeholder="e.g. Great platform! Looking forward to more games…"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted">{draft.length}/2000</p>
            <button
              onClick={create}
              disabled={submitting || !draft.trim()}
              className="btn btn-primary btn-sm"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add feedback
            </button>
          </div>
        </div>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
        <div className="px-5 pt-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-bold text-plum">
            <MessageCircle className="size-5 text-secondary" /> Feedback list
            <span className="badge badge-sm ml-2">{feedbacks.length}</span>
          </h2>
        </div>
        {feedbacks.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No feedback yet. Add one above to share with users.</p>
        ) : (
          <div className="divide-y divide-base-200">
            {feedbacks.map((fb) => (
              <div key={fb.id} className="flex items-start gap-3 px-5 py-4">
                <span
                  className={cn(
                    "mt-0.5 size-2.5 rounded-full shrink-0",
                    fb.is_active ? "bg-success" : "bg-base-300"
                  )}
                  aria-label={fb.is_active ? "Active" : "Hidden"}
                />
                <div className="min-w-0 flex-1">
                  {editing === fb.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editLabelDraft}
                        onChange={(e) => setEditLabelDraft(e.target.value)}
                        maxLength={40}
                        placeholder="Display name (e.g. User 1)"
                        className="input input-bordered input-sm w-full max-w-xs"
                      />
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={2}
                        maxLength={2000}
                        className="textarea textarea-bordered w-full"
                      />
                      <div className="flex items-center gap-2">
                        <button onClick={saveEdit} className="btn btn-primary btn-xs">
                          <Save className="size-3" /> Save
                        </button>
                        <button onClick={cancelEdit} className="btn btn-ghost btn-xs">
                          <X className="size-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-sm badge-secondary text-white">
                          {fb.user_label || "User"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-plum whitespace-pre-wrap break-words">{fb.message}</p>
                      <p className="mt-1 text-xs text-muted">Added {formatDateTime(fb.created_at)}</p>
                    </>
                  )}
                </div>
                {editing !== fb.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(fb)}
                      className="btn btn-ghost btn-xs"
                      title="Edit"
                      aria-label="Edit feedback"
                    >
                      <Pencil className="size-3" />
                    </button>
                    <button
                      onClick={() => toggleActive(fb)}
                      className="btn btn-ghost btn-xs"
                      title={fb.is_active ? "Hide" : "Show"}
                      aria-label={fb.is_active ? "Hide feedback" : "Show feedback"}
                    >
                      {fb.is_active ? (
                        <ToggleRight className="size-4 text-success" />
                      ) : (
                        <ToggleLeft className="size-4 text-muted" />
                      )}
                    </button>
                    <button
                      onClick={() => remove(fb)}
                      className="btn btn-ghost btn-xs text-error"
                      title="Delete"
                      aria-label="Delete feedback"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
