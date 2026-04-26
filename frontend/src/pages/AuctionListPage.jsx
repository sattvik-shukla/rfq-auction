import React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import AuctionCard from "../components/auction/AuctionCard";
import PageWrapper from "../components/layout/PageWrapper";
import useAuctionStore from "../store/useAuctionStore";

const filterTabs = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Extended", value: "extended" },
  { label: "Closed", value: "closed" },
];

const statusPriority = {
  active: 0,
  extended: 1,
  pending: 2,
  closed: 3,
  force_closed: 4,
  no_bids: 5,
};

function filterRFQs(rfqs, activeFilter) {
  const sortedRFQs = [...rfqs].sort((left, right) => {
    const leftPriority = statusPriority[left.status] ?? 99;
    const rightPriority = statusPriority[right.status] ?? 99;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return (
      new Date(left.currentBidCloseTime).getTime() -
      new Date(right.currentBidCloseTime).getTime()
    );
  });

  if (activeFilter === "all") {
    return sortedRFQs;
  }

  if (activeFilter === "closed") {
    return sortedRFQs.filter((rfq) =>
      ["closed", "force_closed", "no_bids"].includes(rfq.status)
    );
  }

  return sortedRFQs.filter((rfq) => rfq.status === activeFilter);
}

export default function AuctionListPage() {
  const navigate = useNavigate();
  const rfqs = useAuctionStore((state) => state.rfqs);
  const isLoading = useAuctionStore((state) => state.isLoading);
  const fetchRFQs = useAuctionStore((state) => state.fetchRFQs);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchRFQs().catch(() => {});
  }, [fetchRFQs]);

  const filteredRFQs = filterRFQs(rfqs, activeFilter);

  return (
    <PageWrapper>
      <div className="animate-fade-in flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">Live Auctions</h1>
            <p className="mt-1 max-w-2xl text-sm text-surface-600">
              Track procurement events in a cleaner warm-toned dashboard with active cards shown
              first.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/create")}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark hover:shadow-glow"
          >
            <Plus size={16} />
            Create Auction
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveFilter(tab.value)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
                activeFilter === tab.value
                  ? "bg-white/85 text-accent-dark shadow-sm ring-1 ring-accent/15"
                  : "text-surface-600 hover:bg-white/65 hover:text-surface-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="glass-card rounded-2xl px-6 py-16 text-center text-surface-600">
            Loading auctions...
          </div>
        ) : filteredRFQs.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRFQs.map((rfq) => (
              <AuctionCard key={rfq._id} rfq={rfq} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-surface-300 bg-white/55 px-6 py-20 text-center text-surface-500">
            No auctions found
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
