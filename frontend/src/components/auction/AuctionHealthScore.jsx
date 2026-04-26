import React from "react";
import { computeHealthScore } from "../../utils/formatters";

function getColorClasses(color) {
  if (color === "green") {
    return {
      badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600",
      dot: "bg-emerald-500",
    };
  }

  if (color === "yellow") {
    return {
      badge: "border-amber-500/25 bg-amber-500/10 text-amber-600",
      dot: "bg-amber-500",
    };
  }

  if (color === "gray") {
    return {
      badge: "border-surface-300 bg-white/75 text-surface-700",
      dot: "bg-surface-500",
    };
  }

  return {
    badge: "border-red-500/25 bg-red-500/10 text-red-600",
    dot: "bg-red-500",
  };
}

export default function AuctionHealthScore({ bids, extensionCount }) {
  const firstBidAmount = bids.length ? Math.max(...bids.map((bid) => bid.totalAmount)) : 0;
  const health = computeHealthScore(bids, extensionCount, firstBidAmount);
  const colors = getColorClasses(health.color);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${colors.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
      <span>{health.label}</span>
      <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-surface-700">
        {health.score}
      </span>
    </div>
  );
}
