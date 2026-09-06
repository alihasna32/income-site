"use client";

import { ShieldOff, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function formatEndTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function RestrictedShell({ restriction }) {
  const isBlocked = restriction?.type === "blocked";
  const endTime = restriction?.end_time ? formatEndTime(restriction.end_time) : null;

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-base-100 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-error/10 text-error">
          <ShieldOff className="size-10" />
        </div>

        {isBlocked ? (
          <>
            <h1 className="text-2xl font-extrabold text-plum">Account blocked</h1>
            <p className="text-sm text-muted leading-relaxed">
              Your account has been blocked. You can no longer access the dashboard.
              {restriction?.reason && (
                <span className="block mt-2 font-medium text-plum">
                  Reason: {restriction.reason}
                </span>
              )}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-plum">Account suspended</h1>
            <p className="text-sm text-muted leading-relaxed">
              Your account has been temporarily suspended.
              {restriction?.reason && (
                <span className="block mt-2 font-medium text-plum">
                  Reason: {restriction.reason}
                </span>
              )}
              {endTime && (
                <span className="flex items-center justify-center gap-2 mt-3 text-sm font-semibold text-plum">
                  <Clock className="size-4" />
                  Suspension ends: {endTime}
                </span>
              )}
            </p>
          </>
        )}

        <div className="space-y-3">
          <button
            onClick={signOut}
            className="btn btn-outline w-full"
          >
            Sign out
          </button>
          <p className="text-xs text-muted">
            If you believe this was a mistake, contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
