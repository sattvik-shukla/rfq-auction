import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import AuctionHealthScore from "./AuctionHealthScore";
import AuctionStatusBadge from "./AuctionStatusBadge";
import useCountdown from "../../hooks/useCountdown";
import {
  formatCountdown,
  formatCurrency,
  formatDateTime,
} from "../../utils/formatters";

function buildApproximateBids(rfq) {
  if (!rfq.lowestBid || !rfq.totalBids) {
    return [];
  }

  return Array.from({ length: rfq.totalBids }, (_, index) => ({
    supplierName: `Supplier ${index + 1}`,
    totalAmount: rfq.lowestBid + index * 1000,
  }));
}

function getUrgencyClasses(urgencyLevel) {
  if (urgencyLevel === "safe") {
    return "text-emerald-600";
  }

  if (urgencyLevel === "warning") {
    return "text-amber-600";
  }

  return "text-red-600";
}

export default function AuctionCard({ rfq }) {
  const navigate = useNavigate();
  const countdown = useCountdown(rfq.currentBidCloseTime);
  const approximatedBids = buildApproximateBids(rfq);
  const isHighlighted = rfq.status === "active";

  return (
    <button
      type="button"
      onClick={() => navigate(`/auctions/${rfq._id}`)}
      className={`group w-full rounded-[1.75rem] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent/35 hover:shadow-glow ${
        isHighlighted ? "glass-card border-accent/30 shadow-glow" : "glass-card"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-surface-900">{rfq.name}</h3>
          <p className="mt-1 font-mono text-xs text-surface-500">{rfq.referenceId}</p>
        </div>
        <AuctionStatusBadge status={rfq.status} />
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-surface-500">
            Current Lowest Bid
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-500">
            {rfq.lowestBid ? (
              formatCurrency(rfq.lowestBid)
            ) : (
              <span className="text-lg font-normal text-surface-500">No bids yet</span>
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-surface-500" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-surface-500">
              Time Left
            </span>
          </div>
          <div
            className={`mt-1.5 font-mono text-lg font-bold ${getUrgencyClasses(
              countdown.urgencyLevel
            )}`}
          >
            {countdown.isExpired
              ? "00:00:00"
              : formatCountdown(countdown.hours, countdown.minutes, countdown.seconds)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {rfq.extensionCount > 0 ? (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/12 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
              {`Extended ${rfq.extensionCount}x`}
            </span>
          ) : null}
          <span className="text-xs text-surface-600">
            {`Current close: ${formatDateTime(rfq.currentBidCloseTime)}`}
          </span>
          <span className="text-xs text-surface-600">
            {`Force close: ${formatDateTime(rfq.forcedBidCloseTime)}`}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <AuctionHealthScore bids={approximatedBids} extensionCount={rfq.extensionCount} />
          <ArrowRight
            size={16}
            className="text-surface-500 transition-transform group-hover:translate-x-1 group-hover:text-accent-dark"
          />
        </div>
      </div>
    </button>
  );
}
