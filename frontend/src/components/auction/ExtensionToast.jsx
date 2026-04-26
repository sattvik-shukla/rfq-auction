import React, { useEffect } from "react";
import { Clock } from "lucide-react";
import { formatDateTime } from "../../utils/formatters";

export default function ExtensionToast({ toasts, removeToast }) {
  useEffect(() => {
    const timeoutIds = toasts.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id);
      }, 6000)
    );

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [removeToast, toasts]);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[320px] flex-col gap-2 sm:w-[360px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-slide-in rounded-2xl border border-amber-500/25 bg-white/92 p-4 text-surface-900 shadow-lg shadow-surface-300/30 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 rounded-lg bg-amber-500/12 p-2 text-amber-600">
              <Clock size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-amber-600">Auction Extended</div>
              <p className="mt-1 text-sm text-surface-700">{toast.message}</p>
              <p className="mt-1.5 text-xs text-surface-500">{formatDateTime(toast.detail)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
