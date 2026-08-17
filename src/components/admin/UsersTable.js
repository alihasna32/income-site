"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, ShieldCheck, User as UserIcon } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function UsersTable({ initialUsers, totalCount }) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.display_name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, query]);

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
              <tr key={user.id}>
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
                  <button
                    onClick={() => toggleRole(user)}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-muted">No users match your search.</p>
      )}
    </div>
  );
}