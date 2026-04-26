import React from "react";

function getStatusConfig(status) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        classes: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-600",
        dotColor: "bg-emerald-500",
      };
    case "extended":
      return {
        label: "Extended",
        classes: "border border-amber-500/25 bg-amber-500/10 text-amber-600",
        dotColor: "bg-amber-500",
      };
    case "closed":
      return {
        label: "Closed",
        classes: "border border-surface-300 bg-surface-100 text-surface-700",
      };
    case "force_closed":
      return {
        label: "Force Closed",
        classes: "border border-red-500/20 bg-red-500/10 text-red-600",
      };
    case "no_bids":
      return {
        label: "No Bids",
        classes: "border border-orange-500/25 bg-orange-500/10 text-orange-600",
      };
    case "pending":
    default:
      return {
        label: "Pending",
        classes: "border border-cyan-500/25 bg-cyan-500/10 text-cyan-700",
      };
  }
}

export default function AuctionStatusBadge({ status }) {
  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${config.classes}`}
    >
      {config.dotColor ? (
        <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${config.dotColor}`} />
      ) : null}
      {config.label}
    </span>
  );
}
