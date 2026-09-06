"use client";

import { AlertTriangle, Clock, ShieldOff } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

const STATUS_CONFIG = {
  pending: {
    title: "Income Mode Pending",
    description:
      "Your Income Mode request is currently under review. You cannot withdraw coins until it is approved.",
    icon: Clock,
    iconTone: "text-warning",
    iconBg: "bg-warning/10",
  },
  suspended: {
    title: "Income Mode Suspended",
    description:
      "Your Income Mode has been temporarily suspended. Withdrawals are currently unavailable.",
    icon: AlertTriangle,
    iconTone: "text-warning",
    iconBg: "bg-warning/10",
  },
  blocked: {
    title: "Income Mode Blocked",
    description:
      "Your Income Mode has been blocked. Withdrawals are currently unavailable. Contact support for assistance.",
    icon: ShieldOff,
    iconTone: "text-error",
    iconBg: "bg-error/10",
  },
};

export function IncomeModeRestrictionModal({ open, onClose, status }) {
  if (!status || status === "active" || status === "disabled") return null;

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.blocked;
  const Icon = config.icon;

  return (
    <Modal open={open} onClose={onClose} title={config.title} size="sm">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div
          className={`flex size-14 items-center justify-center rounded-full ${config.iconBg} ${config.iconTone}`}
        >
          <Icon className="size-7" />
        </div>
        <p className="text-sm text-muted">{config.description}</p>
        {status === "pending" && (
          <p className="text-xs text-muted">
            Check back soon — an admin will review your request.
          </p>
        )}
        {status === "suspended" && (
          <p className="text-xs text-muted">
            If you believe this is a mistake, please contact support.
          </p>
        )}
        {status === "blocked" && (
          <p className="text-xs text-muted">
            For more information, contact our support team.
          </p>
        )}
      </div>
    </Modal>
  );
}
