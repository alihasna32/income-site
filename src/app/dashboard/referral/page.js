"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, Gift, Loader2, Share2, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { CopyButton } from "@/components/shared/CopyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/shared/ToastProvider";
import { formatDate } from "@/lib/utils/format";
import { avatarGradient, initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function ReferralPage() {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on CoinQuest!",
          text: "Play games, complete challenges and earn virtual rewards — free and fun!",
          url: data.referralUrl,
        });
        return;
      } catch {
        // user cancelled share sheet — fall through to copy
      }
    }
    toast("Link copied — share it with friends!", "success");
    await navigator.clipboard.writeText(data.referralUrl);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Refer friends"
        description="Share your link. When a friend joins, you both get a welcome bonus."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-secondary" />
        </div>
      ) : !data || !data.code ? (
        <EmptyState
          icon={Share2}
          title="Referral not available yet"
          description="Your unique referral code is created with your profile."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={Users}
              label="Total referrals"
              value={data.totalReferrals}
              sub={`${data.creditedReferrals} credited · ${data.pendingReferrals || 0} pending`}
              tone="primary"
            />
            <StatCard
              icon={Coins}
              label="Earned from referrals"
              value={<span className="flex items-center gap-1"><Coins className="size-5 text-gold-dark" />{new Intl.NumberFormat("en-US").format(data.totalEarned)}</span>}
              sub="virtual coins"
              tone="secondary"
            />
            <StatCard
              icon={Gift}
              label="Per successful join"
              value={`${data.perJoinCoins} coins`}
              sub="plus 10 XP for you"
              tone="success"
            />
          </div>

          <div className="card bg-base-100 border border-base-300 shadow-card p-6">
            <h2 className="font-bold text-plum">Your invite link</h2>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-field bg-base-200 px-4 py-3">
                <code className="flex-1 truncate text-sm text-plum">{data.referralUrl}</code>
                <CopyButton value={data.referralUrl} label="Copy" />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={share} className="btn btn-primary flex-1">
                  <Share2 className="size-4" /> Share with friends
                </button>
                <div className="flex items-center gap-2 rounded-field bg-base-200 px-4 py-2">
                  <code className="font-mono text-sm font-bold text-plum">{data.code}</code>
                  <CopyButton value={data.code} label="Copy code" />
                </div>
              </div>
            </div>
            <div className="mt-5 rounded-box bg-base-200 p-4 text-sm text-muted">
              <p className="flex items-center gap-2 font-semibold text-plum">
                <Users className="size-4 text-secondary" /> Fair play rules
              </p>
              <ul className="mt-2 space-y-1.5">
                <li>• Your friend will got 60 coins and you will got 30 coins as reward.</li>
                <li>• Self-referrals are blocked automatically.</li>
                <li>• Each email can only be counted once.</li>
                <li>• Suspicious signups are flagged and rejected.</li>
              </ul>
            </div>
          </div>

          {data.history.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-plum">Referral history</h2>
              <div className="mt-4 card bg-base-100 border border-base-300 shadow-card divide-y divide-base-200">
                {data.history.map((row, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full text-lg",
                        row.referredUser?.avatarEmoji
                          ? ""
                          : `bg-gradient-to-br ${avatarGradient(row.referredUser?.displayName || "ref")}`
                      )}
                    >
                      {row.referredUser?.avatarEmoji ||
                        initials(row.referredUser?.displayName || row.referredUser?.username || "R")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-plum">
                        {row.referredUser?.displayName ||
                          row.referredUser?.username ||
                          "Invited friend"}
                        {row.referredUser && (
                          <span className="ml-2 text-xs font-normal text-muted">
                            @{row.referredUser.username}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted">
                        Joined {formatDate(row.referredUser?.registeredAt || row.date)}
                      </p>
                    </div>
                    <span className="badge badge-sm bg-base-200 text-muted">
                      {formatDate(row.date)}
                    </span>
                    <span className="badge badge-sm bg-success/15 text-success capitalize">
                      {row.rewardStatus === "credited" ? "Rewarded" : row.rewardStatus}
                    </span>
                    <span className="font-bold text-plum">+{row.coins}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">
                <Link href="/dashboard/transactions" className="underline hover:text-secondary">
                  View referral bonuses in your transaction history
                </Link>
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}