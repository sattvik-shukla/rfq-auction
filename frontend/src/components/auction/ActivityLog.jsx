import React from "react";
import { AlertTriangle, Clock, Hammer, Lock, ShieldAlert } from "lucide-react";
import { formatDateTime, formatRelativeTime } from "../../utils/formatters";

function getLogAppearance(eventType) {
  if (eventType === "BID_SUBMITTED") {
    return { Icon: Hammer, classes: "bg-cyan-500/12 text-cyan-700" };
  }

  if (eventType === "AUCTION_EXTENDED") {
    return { Icon: Clock, classes: "bg-amber-500/12 text-amber-600" };
  }

  if (eventType === "AUCTION_FORCE_CLOSED") {
    return { Icon: ShieldAlert, classes: "bg-red-500/12 text-red-600" };
  }

  if (eventType === "NO_ACTIVITY_WARNING") {
    return { Icon: AlertTriangle, classes: "bg-orange-500/12 text-orange-600" };
  }

  return { Icon: Lock, classes: "bg-surface-100 text-surface-700" };
}

export default function ActivityLog({ logs }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="text-base font-semibold text-surface-900">Activity Log</h2>
      <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
        {logs.length ? (
          logs.map((log) => {
            const appearance = getLogAppearance(log.eventType);

            return (
              <div
                key={log._id || `${log.eventType}-${log.timestamp}`}
                className="flex gap-3 rounded-xl border border-surface-200 bg-white/65 p-3 transition-colors hover:border-surface-300"
              >
                <div className={`mt-0.5 flex-shrink-0 rounded-lg p-2 ${appearance.classes}`}>
                  <appearance.Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-surface-500" title={formatDateTime(log.timestamp)}>
                    {formatRelativeTime(log.timestamp)}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-surface-700">
                    {log.description}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-surface-300 px-4 py-8 text-center text-sm text-surface-500">
            No activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
