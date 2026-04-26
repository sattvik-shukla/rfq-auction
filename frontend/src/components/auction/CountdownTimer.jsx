import React from "react";
import { Timer } from "lucide-react";
import useCountdown from "../../hooks/useCountdown";
import { formatCountdown, formatDateTime } from "../../utils/formatters";

function getUrgencyClasses(urgencyLevel) {
  if (urgencyLevel === "safe") {
    return "text-emerald-600";
  }

  if (urgencyLevel === "warning") {
    return "text-amber-600";
  }

  return "animate-pulse text-red-600";
}

export default function CountdownTimer({
  currentBidCloseTime,
  forcedBidCloseTime,
  status,
  extensionCount,
}) {
  const countdown = useCountdown(currentBidCloseTime);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-accent-dark" />
          <h2 className="text-base font-semibold text-surface-900">Auction Timer</h2>
        </div>
        {status === "extended" ? (
          <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
            {`Extended ${extensionCount}x`}
          </span>
        ) : null}
      </div>
      {status === "closed" || status === "force_closed" || status === "no_bids" ? (
        <div className="mt-6 text-center text-2xl font-bold text-red-600 sm:text-3xl">
          Auction Closed
        </div>
      ) : (
        <div
          className={`mt-6 text-center font-mono text-4xl font-bold tracking-wider sm:text-5xl ${getUrgencyClasses(
            countdown.urgencyLevel
          )}`}
        >
          {formatCountdown(countdown.hours, countdown.minutes, countdown.seconds)}
        </div>
      )}
      <p className="mt-4 text-center text-xs text-surface-500">
        {`Force close: ${formatDateTime(forcedBidCloseTime)}`}
      </p>
    </div>
  );
}
