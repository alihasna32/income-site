"use client";

import { useState } from "react";
import { Loader2, Pencil, Save, X } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { cn } from "@/lib/utils/cn";

export function GamesTable({ initialGames }) {
  const { toast } = useToast();
  const [games, setGames] = useState(initialGames);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ rewardCoins: 0, rewardXp: 0, maxPlaysPerDay: 5 });
  const [busy, setBusy] = useState(null);

  const toggleActive = async (game) => {
    setBusy(game.id);
    try {
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !game.is_active }),
      });
      const data = await res.json();
      if (res.ok) {
        setGames((prev) => prev.map((g) => (g.id === game.id ? { ...g, is_active: data.game.is_active } : g)));
        toast(`${game.title} ${data.game.is_active ? "activated" : "paused"}`, "success");
      } else {
        toast(data.error || "Could not update", "error");
      }
    } catch {
      toast("Could not update", "error");
    } finally {
      setBusy(null);
    }
  };

  const startEdit = (game) => {
    setEditingId(game.id);
    setForm({
      rewardCoins: game.reward_coins,
      rewardXp: game.reward_xp,
      maxPlaysPerDay: game.max_plays_per_day,
    });
  };

  const saveEdit = async (game) => {
    setBusy(game.id);
    try {
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setGames((prev) =>
          prev.map((g) =>
            g.id === game.id
              ? {
                  ...g,
                  reward_coins: data.game.reward_coins,
                  reward_xp: data.game.reward_xp,
                  max_plays_per_day: data.game.max_plays_per_day,
                }
              : g
          )
        );
        setEditingId(null);
        toast("Game updated", "success");
      } else {
        toast(data.error || "Could not save", "error");
      }
    } catch {
      toast("Could not save", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card bg-base-100 border border-base-300 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-sm sm:table-md">
          <thead>
            <tr className="text-muted text-xs uppercase tracking-wider">
              <th>Game</th>
              <th className="hidden sm:table-cell">Difficulty</th>
              <th className="text-right">Coins</th>
              <th className="text-right">XP</th>
              <th className="text-right">Plays/day</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => {
              const editing = editingId === game.id;
              return (
                <tr key={game.id}>
                  <td>
                    <p className="font-semibold text-plum">{game.title}</p>
                    <code className="text-xs text-muted">{game.slug}</code>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className="badge badge-sm bg-base-200 text-muted capitalize">{game.difficulty}</span>
                  </td>
                  <td className="text-right">
                    {editing ? (
                      <input
                        type="number"
                        value={form.rewardCoins}
                        onChange={(e) => setForm((f) => ({ ...f, rewardCoins: Number(e.target.value) }))}
                        className="input input-xs input-bordered w-20 text-right"
                        aria-label="Reward coins"
                      />
                    ) : (
                      <span className="font-bold text-plum">{game.reward_coins}</span>
                    )}
                  </td>
                  <td className="text-right">
                    {editing ? (
                      <input
                        type="number"
                        value={form.rewardXp}
                        onChange={(e) => setForm((f) => ({ ...f, rewardXp: Number(e.target.value) }))}
                        className="input input-xs input-bordered w-20 text-right"
                        aria-label="Reward XP"
                      />
                    ) : (
                      <span className="text-muted">{game.reward_xp}</span>
                    )}
                  </td>
                  <td className="text-right">
                    {editing ? (
                      <input
                        type="number"
                        value={form.maxPlaysPerDay}
                        onChange={(e) => setForm((f) => ({ ...f, maxPlaysPerDay: Number(e.target.value) }))}
                        className="input input-xs input-bordered w-20 text-right"
                        aria-label="Max plays per day"
                      />
                    ) : (
                      <span className="text-muted">{game.max_plays_per_day}</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={cn(
                        "badge badge-sm",
                        game.is_active ? "badge-success" : "bg-base-200 text-muted"
                      )}
                    >
                      {game.is_active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      {editing ? (
                        <>
                          <button
                            onClick={() => saveEdit(game)}
                            disabled={busy === game.id}
                            className="btn btn-xs btn-primary"
                          >
                            {busy === game.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Save className="size-3" />
                            )}
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="btn btn-xs btn-ghost">
                            <X className="size-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(game)}
                            className="btn btn-xs btn-ghost"
                            aria-label={`Edit ${game.title}`}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => toggleActive(game)}
                            disabled={busy === game.id}
                            className={cn(
                              "btn btn-xs",
                              game.is_active ? "btn-outline btn-error" : "btn-outline btn-success"
                            )}
                          >
                            {busy === game.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : game.is_active ? (
                              "Pause"
                            ) : (
                              "Activate"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}