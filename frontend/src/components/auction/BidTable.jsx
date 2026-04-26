import React from "react";
import { Table2 } from "lucide-react";
import BidRow from "./BidRow";

export default function BidTable({ bids, pickupDate, newBidId }) {
  return (
    <div className="overflow-hidden rounded-2xl glass-card">
      <div className="flex items-center gap-2 border-b border-surface-200 px-5 py-4">
        <Table2 size={18} className="text-accent-dark" />
        <div>
          <h2 className="text-base font-semibold text-surface-900">Latest Bids</h2>
          <p className="text-xs text-surface-600">
            {bids.length
              ? `Pickup: ${new Date(pickupDate).toLocaleString("en-IN")}`
              : "No bids submitted yet"}
          </p>
        </div>
      </div>
      {bids.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-white/75 text-left text-xs uppercase tracking-[0.2em] text-surface-500">
              <tr>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Carrier</th>
                <th className="px-4 py-3 font-medium">Freight</th>
                <th className="px-4 py-3 font-medium">Origin</th>
                <th className="px-4 py-3 font-medium">Dest</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Transit</th>
                <th className="px-4 py-3 font-medium">Validity</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <BidRow key={bid._id} bid={bid} isNew={bid._id === newBidId} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-surface-500">
          No bids available for this auction yet.
        </div>
      )}
    </div>
  );
}
