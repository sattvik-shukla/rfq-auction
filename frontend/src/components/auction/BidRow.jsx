import React from "react";
import { AlertTriangle, Crown } from "lucide-react";
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
} from "../../utils/formatters";

function getRankBadge(rank) {
  if (rank === 1) {
    return {
      label: "L1",
      classes: "border-amber-500/35 bg-amber-500/14 text-amber-700",
    };
  }

  if (rank === 2) {
    return {
      label: "L2",
      classes: "border-cyan-500/25 bg-cyan-500/10 text-cyan-700",
    };
  }

  if (rank === 3) {
    return {
      label: "L3",
      classes: "border-orange-500/25 bg-orange-500/10 text-orange-700",
    };
  }

  return {
    label: `#${rank}`,
    classes: "border-surface-300 bg-white/70 text-surface-700",
  };
}

export default function BidRow({ bid, isNew }) {
  const badge = getRankBadge(bid.rank);

  return (
    <tr
      className={`${bid.rank === 1 ? "bg-emerald-500/6" : "bg-transparent"} ${
        isNew ? "animate-slide-in" : ""
      } border-b border-surface-200 text-sm text-surface-700 transition-colors hover:bg-white/55`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.classes}`}>
            {badge.label}
          </span>
          {bid.rank === 1 ? (
            <Crown size={14} className="text-amber-500" title="Lowest bidder" />
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 font-medium text-surface-900">{bid.supplierName}</td>
      <td className="px-4 py-3 text-surface-700">{bid.carrierName}</td>
      <td className="px-4 py-3">{formatCurrency(bid.charges.freight)}</td>
      <td className="px-4 py-3">{formatCurrency(bid.charges.origin)}</td>
      <td className="px-4 py-3">{formatCurrency(bid.charges.destination)}</td>
      <td className="px-4 py-3 font-semibold text-emerald-600">
        {formatCurrency(bid.totalAmount)}
      </td>
      <td className="px-4 py-3">{`${bid.transitDays} day(s)`}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span>{formatDateTime(bid.quoteValidity)}</span>
          {bid.isValidityWarning ? (
            <AlertTriangle
              size={14}
              className="text-amber-500"
              title="Quote validity < 7 days from pickup"
            />
          ) : null}
        </div>
      </td>
      <td className="px-4 py-3 text-surface-500" title={formatDateTime(bid.submittedAt)}>
        {formatRelativeTime(bid.submittedAt)}
      </td>
    </tr>
  );
}
