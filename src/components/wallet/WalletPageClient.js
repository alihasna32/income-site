"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IncomeModeRestrictionModal } from "@/components/wallet/IncomeModeRestrictionModal";

export function WalletPageClient({ children }) {
  const [incomeStatus, setIncomeStatus] = useState("disabled");
  const [restrictionModalOpen, setRestrictionModalOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      try {
        const userRes = await supabase.auth.getUser();
        const userId = userRes?.data?.user?.id;
        if (!userId) return;
        const { data } = await supabase
          .from("profiles")
          .select("income_mode_status")
          .eq("id", userId)
          .maybeSingle();
        if (data?.income_mode_status) {
          setIncomeStatus(data.income_mode_status);
        }
      } catch {
        // ignore — DB may not have the column yet
      }
    })();
  }, []);

  // Show restriction modal if user has a restricted income mode status.
  const restrictedStatuses = ["pending", "suspended", "blocked"];
  const isRestricted = restrictedStatuses.includes(incomeStatus);

  return (
    <>
      {children}
      {isRestricted && (
        <IncomeModeRestrictionModal
          open={restrictionModalOpen}
          onClose={() => setRestrictionModalOpen(false)}
          status={incomeStatus}
        />
      )}
      {/* Trigger restriction notice banner inside the wallet if restricted */}
      {isRestricted && (
        <WalletRestrictionBanner
          status={incomeStatus}
          onDismiss={() => setRestrictionModalOpen(true)}
        />
      )}
    </>
  );
}

function WalletRestrictionBanner({ status, onDismiss }) {
  const config = {
    pending: {
      bg: "bg-warning/10",
      border: "border-warning/30",
      text: "text-warning",
      label: "Income Mode pending",
      sub: "Your request is under review. Withdrawals are disabled until approved.",
    },
    suspended: {
      bg: "bg-warning/10",
      border: "border-warning/30",
      text: "text-warning",
      label: "Income Mode suspended",
      sub: "Your Income Mode has been suspended. Contact support for assistance.",
    },
    blocked: {
      bg: "bg-error/10",
      border: "border-error/30",
      text: "text-error",
      label: "Income Mode blocked",
      sub: "Your Income Mode has been blocked. Contact support for assistance.",
    },
  }[status] || {
    bg: "bg-base-200",
    border: "border-base-300",
    text: "text-muted",
    label: "Income Mode restricted",
    sub: "Withdrawals are unavailable.",
  };

  return (
    <div
      className={`mt-4 rounded-field border px-4 py-3 text-sm ${config.bg} ${config.border}`}
    >
      <p className={`font-bold ${config.text}`}>{config.label}</p>
      <p className="mt-0.5 text-xs text-muted">{config.sub}</p>
    </div>
  );
}
