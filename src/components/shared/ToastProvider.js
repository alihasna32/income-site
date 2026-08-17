"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, Info, XCircle, X } from "lucide-react";

const ToastContext = createContext({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const STYLES = {
  success: { icon: CheckCircle2, classes: "alert-success" },
  error: { icon: XCircle, classes: "alert-error" },
  info: { icon: Info, classes: "alert-info" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "info", duration = 3500) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast toast-end toast-bottom z-[100] gap-2 px-3 sm:px-4">
        {toasts.map((t) => {
          const style = STYLES[t.type] || STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={t.id}
              role="alert"
              className={`alert ${style.classes} animate-pop-in shadow-soft max-w-xs`}
            >
              <Icon className="size-5 shrink-0" />
              <span className="text-sm font-medium break-words">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="btn btn-ghost btn-xs btn-circle shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}