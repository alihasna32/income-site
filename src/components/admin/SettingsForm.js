"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";

export function SettingsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setSettings(data.settings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (path, value) => {
    setSettings((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let cursor = next;
      for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]];
      cursor[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        toast("Settings saved", "success");
      } else {
        toast(data.error || "Could not save", "error");
      }
    } catch {
      toast("Could not save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!settings) {
    return <p className="py-16 text-center text-sm text-muted">Could not load settings.</p>;
  }

  return (
    <div className="space-y-6">
      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="font-bold text-plum">Platform</h2>
        <div className="mt-4 max-w-lg">
          <label className="label-text font-semibold text-plum">Site name</label>
          <input
            value={settings.platform.siteName}
            onChange={(e) => set("platform.siteName", e.target.value)}
            maxLength={40}
            className="input input-bordered w-full mt-1"
          />
        </div>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="font-bold text-plum">Referrals</h2>
        <div className="mt-4 grid gap-4 max-w-lg">
          <div>
            <label className="label-text font-semibold text-plum">Referrer bonus coins (per successful referral)</label>
            <input
              type="number"
              min={0}
              value={settings.referrals.bonusCoins}
              onChange={(e) => set("referrals.bonusCoins", Number(e.target.value))}
              className="input input-bordered w-full mt-1"
            />
          </div>
          <div>
            <label className="label-text font-semibold text-plum">Invited friend welcome bonus coins</label>
            <input
              type="number"
              min={0}
              value={settings.referrals.inviteBonusCoins}
              onChange={(e) => set("referrals.inviteBonusCoins", Number(e.target.value))}
              className="input input-bordered w-full mt-1"
            />
          </div>
        </div>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="font-bold text-plum">Withdrawals</h2>
        <div className="mt-4 max-w-lg">
          <label className="label-text font-semibold text-plum">Minimum withdrawal amount (coins)</label>
          <input
            type="number"
            min={1}
            value={settings.withdrawals.minAmount}
            onChange={(e) => set("withdrawals.minAmount", Number(e.target.value))}
            className="input input-bordered w-full mt-1"
          />
          <p className="text-xs text-muted mt-1">
            Requests below this amount are rejected automatically. Applies to all users.
          </p>
        </div>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="font-bold text-plum">Daily math challenge</h2>
        <div className="mt-4 max-w-lg">
          <label className="label-text font-semibold text-plum">Reward coins per correct daily answer</label>
          <input
            type="number"
            min={0}
            value={settings.mathDaily.rewardCoins}
            onChange={(e) => set("mathDaily.rewardCoins", Number(e.target.value))}
            className="input input-bordered w-full mt-1"
          />
        </div>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="font-bold text-plum">Daily streaks</h2>
        <div className="mt-4 max-w-lg">
          <label className="label-text font-semibold text-plum">Grace days (missed days allowed before streak resets)</label>
          <input
            type="number"
            min={0}
            max={7}
            value={settings.streaks.graceDays}
            onChange={(e) => set("streaks.graceDays", Number(e.target.value))}
            className="input input-bordered w-full mt-1"
          />
        </div>
      </section>

      <section className="card bg-base-100 border border-base-300 shadow-card p-6">
        <h2 className="font-bold text-plum">Math challenge</h2>
        <div className="mt-4 max-w-lg">
          <label className="label-text font-semibold text-plum">Daily scoring attempts</label>
          <input
            type="number"
            min={1}
            max={50}
            value={settings.math.dailyAttempts}
            onChange={(e) => set("math.dailyAttempts", Number(e.target.value))}
            className="input input-bordered w-full mt-1"
          />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Object.entries(settings.math.perQuestion || {}).map(([difficulty, values]) => (
            <div key={difficulty} className="rounded-field bg-base-200 p-4">
              <p className="text-sm font-bold text-plum capitalize">{difficulty}</p>
              <div className="mt-3 flex items-center gap-3">
                <label className="label-text text-xs text-muted flex-1">
                  Coins per answer
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={values.coins}
                    onChange={(e) => set(`math.perQuestion.${difficulty}.coins`, Number(e.target.value))}
                    className="input input-sm input-bordered w-full mt-1"
                  />
                </label>
                <label className="label-text text-xs text-muted flex-1">
                  XP per answer
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={values.xp}
                    onChange={(e) => set(`math.perQuestion.${difficulty}.xp`, Number(e.target.value))}
                    className="input input-sm input-bordered w-full mt-1"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <button onClick={save} className="btn btn-primary" disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save all settings
      </button>
    </div>
  );
}