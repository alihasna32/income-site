"use client";

import { useMemo, useState } from "react";
import { Copy, Eye, Loader2, Mail, Phone, Search, ShieldCheck, ShieldOff, Sparkles, User as UserIcon } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { Modal } from "@/components/ui/Modal";
import { CopyButton } from "@/components/shared/CopyButton";
import { RestrictionManager } from "@/components/admin/RestrictionManager";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function UsersTable({ initialUsers, totalCount }) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewingData, setViewingData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [restrictionFor, setRestrictionFor] = useState(null);
  const [incomeModeUpdating, setIncomeModeUpdating] = useState(false);
  const [confirmIncomeMode, setConfirmIncomeMode] = useState(null); // { user, action }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.display_name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, query]);

  const viewProfile = async (user) => {
    setViewing(user);
    setViewingData(null);
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setViewingData(data.profile);
      } else {
        toast(data.error || "Could not load profile", "error");
        setViewing(null);
      }
    } catch {
      toast("Could not load profile", "error");
      setViewing(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const toggleRole = async (user) => {
    if (updating) return;
    setUpdating(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: user.role === "admin" ? "user" : "admin" }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: data.profile.role } : u)));
        toast(`Role updated to ${data.profile.role}`, "success");
      } else {
        toast(data.error || "Could not update role", "error");
      }
    } catch {
      toast("Could not update role", "error");
    } finally {
      setUpdating(null);
    }
  };

  const applyIncomeModeChange = async () => {
    if (!confirmIncomeMode) return;
    const { user, action } = confirmIncomeMode;
    setIncomeModeUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/income-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        toast(
          action === "enable"
            ? "Income Mode enabled for user"
            : "Income Mode disabled for user",
          "success"
        );
        setViewingData((prev) =>
          prev ? { ...prev, incomeModeStatus: data.profile.income_mode_status } : prev
        );
        // refresh profile so any related fields stay in sync
        if (viewing) viewProfile(viewing);
      } else {
        toast(data?.error || "Could not update Income Mode", "error");
      }
    } catch {
      toast("Could not update Income Mode", "error");
    } finally {
      setIncomeModeUpdating(false);
      setConfirmIncomeMode(null);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-base-200">
        <h2 className="font-bold text-plum">
          All users <span className="badge badge-sm badge-soft ml-1">{totalCount}</span>
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input input-sm input-bordered pl-9 w-64"
            placeholder="Search name, username or id…"
            aria-label="Search users"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-sm sm:table-md">
          <thead>
            <tr className="text-muted text-xs uppercase tracking-wider">
              <th>User</th>
              <th className="hidden md:table-cell">Joined</th>
              <th className="hidden lg:table-cell">Referral code</th>
              <th>Role</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className="cursor-pointer hover:bg-base-200/60"
                onClick={() => viewProfile(user)}
              >
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-base">
                      {user.avatar_emoji || "😀"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-plum truncate">
                        {user.display_name || "Player"}
                      </p>
                      <p className="text-xs text-muted truncate">@{user.username || "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell text-muted whitespace-nowrap">
                  {formatDateTime(user.created_at)}
                </td>
                <td className="hidden lg:table-cell">
                  <code className="text-xs text-muted">{user.referral_code || "—"}</code>
                </td>
                <td>
                  <span
                    className={cn(
                      "badge badge-sm",
                      user.role === "admin"
                        ? "bg-plum text-neutral-content"
                        : "bg-base-200 text-muted"
                    )}
                  >
                    {user.role === "admin" ? (
                      <ShieldCheck className="size-3 mr-1" />
                    ) : (
                      <UserIcon className="size-3 mr-1" />
                    )}
                    {user.role}
                  </span>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewProfile(user);
                      }}
                      className="btn btn-xs btn-outline"
                      title="View profile"
                    >
                      <Eye className="size-3" /> Profile
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRestrictionFor(user);
                      }}
                      className="btn btn-xs btn-outline btn-warning"
                      title="Manage restriction"
                    >
                      <ShieldOff className="size-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRole(user);
                      }}
                      disabled={updating === user.id}
                      className={cn(
                        "btn btn-xs",
                        user.role === "admin" ? "btn-outline btn-error" : "btn-outline"
                      )}
                    >
                      {updating === user.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : user.role === "admin" ? (
                        "Demote"
                      ) : (
                        "Make admin"
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-muted">No users match your search.</p>
      )}

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title={loadingProfile ? "Loading profile…" : `${viewingData?.displayName || "User"}'s profile`}
        size="md"
        footer={
          viewingData ? (
            <div className="flex justify-between items-center w-full gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setViewing(null);
                    setRestrictionFor(viewingData);
                  }}
                  className="btn btn-warning btn-sm"
                >
                  <ShieldOff className="size-4" /> Manage restriction
                </button>
                {viewingData.incomeModeStatus !== "active" ? (
                  <button
                    onClick={() => setConfirmIncomeMode({ user: viewingData, action: "enable" })}
                    className="btn btn-success btn-sm"
                    disabled={incomeModeUpdating}
                  >
                    <Sparkles className="size-4" /> Enable Income
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmIncomeMode({ user: viewingData, action: "disable" })}
                    className="btn btn-error btn-sm"
                    disabled={incomeModeUpdating}
                  >
                    <ShieldOff className="size-4" /> Disable Income
                  </button>
                )}
              </div>
              <button onClick={() => setViewing(null)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          ) : null
        }
      >
        {loadingProfile || !viewingData ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-8 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-orange text-2xl">
                {viewingData.avatarEmoji || "😀"}
              </span>
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-plum truncate">
                  {viewingData.displayName || "Player"}
                </p>
                <p className="text-sm text-muted truncate">@{viewingData.username || "—"}</p>
              </div>
              <div className="ml-auto flex flex-col items-end gap-1 shrink-0">
                <span
                  className={cn(
                    "badge badge-sm",
                    viewingData.role === "admin"
                      ? "bg-plum text-neutral-content"
                      : "bg-base-200 text-muted"
                  )}
                >
                  {viewingData.role === "admin" ? (
                    <ShieldCheck className="size-3 mr-1" />
                  ) : (
                    <UserIcon className="size-3 mr-1" />
                  )}
                  {viewingData.role}
                </span>
                {viewingData.incomeModeStatus && viewingData.incomeModeStatus !== "disabled" && (
                  <span
                    className={cn(
                      "badge badge-sm",
                      viewingData.incomeModeStatus === "active"
                        ? "bg-success/15 text-success"
                        : viewingData.incomeModeStatus === "pending"
                        ? "bg-warning/15 text-warning"
                        : "bg-error/15 text-error"
                    )}
                  >
                    Income: {viewingData.incomeModeStatus}
                  </span>
                )}
              </div>
            </div>

            {viewingData.activeRestriction && (
              <div className="rounded-field bg-error/10 border border-error/30 px-4 py-3 text-sm">
                <p className="flex items-center gap-2 font-bold text-error">
                  <ShieldOff className="size-4" />
                  {viewingData.activeRestriction.type === "blocked" ? "Blocked" : "Suspended"}
                </p>
                {viewingData.activeRestriction.reason && (
                  <p className="mt-1 text-plum">Reason: {viewingData.activeRestriction.reason}</p>
                )}
                {viewingData.activeRestriction.endTime && (
                  <p className="mt-1 text-xs text-muted">
                    Ends: {formatDateTime(viewingData.activeRestriction.endTime)}
                  </p>
                )}
              </div>
            )}

            {viewingData.bio && (
              <p className="rounded-field bg-base-200 px-4 py-3 text-sm italic text-plum text-center font-semibold">
                “{viewingData.bio.slice(0, 20)}”
              </p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-field bg-base-200 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wide">
                  <Mail className="size-3.5" /> Email
                </p>
                <p className="mt-1 text-sm font-semibold text-plum break-all">
                  {viewingData.email || "—"}
                </p>
              </div>
              <div className="rounded-field bg-base-200 px-4 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wide">
                  <Phone className="size-3.5" /> Phone number
                </p>
                <p className="mt-1 text-sm font-semibold text-plum break-all">
                  {viewingData.phone || "Not set"}
                </p>
              </div>
              <div className="rounded-field bg-base-200 px-4 py-3 sm:col-span-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wide">
                  <Copy className="size-3.5" /> User ID
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <code className="text-sm font-bold text-plum break-all">{viewingData.id}</code>
                  <CopyButton value={viewingData.id} label="Copy" />
                </div>
              </div>
              <div className="rounded-field bg-base-200 px-4 py-3">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Coins</p>
                <p className="mt-1 text-xl font-extrabold text-plum">
                  {new Intl.NumberFormat("en-US").format(viewingData.coins)}
                </p>
                <p className="text-xs text-muted">
                  {new Intl.NumberFormat("en-US").format(viewingData.totalEarned)} earned ·{" "}
                  {new Intl.NumberFormat("en-US").format(viewingData.totalRedeemed)} redeemed
                </p>
              </div>
              <div className="rounded-field bg-base-200 px-4 py-3">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">Activity</p>
                <p className="mt-1 text-sm font-semibold text-plum">
                  {viewingData.gamesPlayed} games · {viewingData.xp} XP
                </p>
                <p className="text-xs text-muted">
                  Streak: {viewingData.streak} days (best {viewingData.longestStreak})
                </p>
              </div>
              <div className="rounded-field bg-base-200 px-4 py-3 sm:col-span-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wide">
                  Referral code
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <code className="text-sm font-bold text-plum break-all">
                    {viewingData.referralCode || "—"}
                  </code>
                  {viewingData.referralCode && (
                    <CopyButton value={viewingData.referralCode} label="Copy" />
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Joined {viewingData.createdAt ? formatDateTime(viewingData.createdAt) : "—"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <RestrictionManager
        open={Boolean(restrictionFor)}
        onClose={() => setRestrictionFor(null)}
        userId={restrictionFor?.id}
        profile={restrictionFor}
        onUpdated={() => {
          setRestrictionFor(null);
          if (viewing) viewProfile(viewing);
        }}
      />

      {/* Confirm Income Mode enable/disable */}
      <Modal
        open={Boolean(confirmIncomeMode)}
        onClose={() => !incomeModeUpdating && setConfirmIncomeMode(null)}
        title={confirmIncomeMode?.action === "enable" ? "Enable Income Mode?" : "Disable Income Mode?"}
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmIncomeMode(null)}
              className="btn btn-ghost btn-sm"
              disabled={incomeModeUpdating}
            >
              Cancel
            </button>
            <button
              onClick={applyIncomeModeChange}
              className={cn("btn btn-sm", confirmIncomeMode?.action === "enable" ? "btn-success" : "btn-error")}
              disabled={incomeModeUpdating}
            >
              {incomeModeUpdating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : confirmIncomeMode?.action === "enable" ? (
                <>
                  <Sparkles className="size-4" /> Enable
                </>
              ) : (
                <>
                  <ShieldOff className="size-4" /> Disable
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full",
                confirmIncomeMode?.action === "enable" ? "bg-success/10 text-success" : "bg-error/10 text-error"
              )}
            >
              {confirmIncomeMode?.action === "enable" ? (
                <Sparkles className="size-6" />
              ) : (
                <ShieldOff className="size-6" />
              )}
            </div>
            <div>
              <p className="font-semibold text-plum">{confirmIncomeMode?.user?.displayName || "User"}</p>
              <p className="text-xs text-muted">@{confirmIncomeMode?.user?.username || "—"}</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            {confirmIncomeMode?.action === "enable"
              ? "This will allow this user to convert coins into Taka immediately without a payment request."
              : "This will prevent this user from converting coins into Taka until Income Mode is enabled again."}
          </p>
        </div>
      </Modal>
    </div>
  );
}