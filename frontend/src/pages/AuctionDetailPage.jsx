import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Settings, CalendarDays, Repeat } from "lucide-react";
import ActivityLog from "../components/auction/ActivityLog";
import AuctionHealthScore from "../components/auction/AuctionHealthScore";
import AuctionStatusBadge from "../components/auction/AuctionStatusBadge";
import BidTable from "../components/auction/BidTable";
import CountdownTimer from "../components/auction/CountdownTimer";
import ExtensionToast from "../components/auction/ExtensionToast";
import L1PriceSparkline from "../components/auction/L1PriceSparkline";
import LiveBidderCount from "../components/auction/LiveBidderCount";
import SubmitBidForm from "../components/forms/SubmitBidForm";
import PageWrapper from "../components/layout/PageWrapper";
import useSocket from "../hooks/useSocket";
import useAuctionStore from "../store/useAuctionStore";
import { formatDateTime } from "../utils/formatters";

function getNewestBidId(bids) {
  if (!bids.length) {
    return null;
  }

  return [...bids].sort(
    (left, right) =>
      new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime()
  )[0]._id;
}

export default function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentRFQ = useAuctionStore((state) => state.currentRFQ);
  const bids = useAuctionStore((state) => state.bids);
  const logs = useAuctionStore((state) => state.logs);
  const l1PriceHistory = useAuctionStore((state) => state.l1PriceHistory);
  const toasts = useAuctionStore((state) => state.toasts);
  const activeBidderCount = useAuctionStore((state) => state.activeBidderCount);
  const isLoading = useAuctionStore((state) => state.isLoading);
  const removeToast = useAuctionStore((state) => state.removeToast);
  const fetchRFQById = useAuctionStore((state) => state.fetchRFQById);
  const { isConnected } = useSocket(id);

  useEffect(() => {
    if (id) {
      fetchRFQById(id).catch(() => {});
    }
  }, [fetchRFQById, id]);

  if (isLoading || !currentRFQ) {
    return (
      <PageWrapper>
        <div className="glass-card rounded-2xl px-6 py-16 text-center text-surface-600">
          Loading auction details...
        </div>
      </PageWrapper>
    );
  }

  const newBidId = getNewestBidId(bids);

  return (
    <PageWrapper>
      <div className="animate-fade-in space-y-6">
        <button
          type="button"
          onClick={() => navigate("/auctions")}
          className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-all hover:bg-white/80 hover:text-surface-900"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Auctions
        </button>

        <section className="grid gap-6 rounded-2xl glass-card p-5 sm:p-6 xl:grid-cols-[1.7fr,1fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl">
                {currentRFQ.name}
              </h1>
              <AuctionStatusBadge status={currentRFQ.status} />
              <LiveBidderCount count={activeBidderCount} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-surface-600">
              <span className="font-mono text-xs">{currentRFQ.referenceId}</span>
              <span className="text-surface-400">|</span>
              <span className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                  }`}
                />
                {isConnected ? "Live" : "Connecting..."}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-surface-500">
              L1 Price Journey
            </div>
            <L1PriceSparkline l1PriceHistory={l1PriceHistory} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="glass-card rounded-xl p-4">
            <AuctionHealthScore bids={bids} extensionCount={currentRFQ.extensionCount} />
          </div>
          <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
            <div className="flex items-center gap-1.5">
              <Repeat size={12} className="text-amber-600" />
              <span className="text-xs font-medium uppercase tracking-wider text-amber-700/80">
                Extensions
              </span>
            </div>
            <div className="mt-1.5 text-lg font-bold text-amber-600">
              {`${currentRFQ.extensionCount}x`}
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={12} className="text-surface-500" />
              <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                Pickup Date
              </span>
            </div>
            <div className="mt-1.5 text-sm font-medium text-surface-900">
              {formatDateTime(currentRFQ.pickupDate)}
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-1.5">
              <Settings size={12} className="text-surface-500" />
              <span className="text-xs font-medium uppercase tracking-wider text-surface-500">
                Bid Config
              </span>
            </div>
            <div className="mt-1.5 text-sm text-surface-700">
              {`${currentRFQ.britishAuctionConfig.triggerWindowMinutes}m trigger | ${currentRFQ.britishAuctionConfig.extensionDurationMinutes}m ext | ${currentRFQ.britishAuctionConfig.extensionTrigger.replace(/_/g, " ").toLowerCase()}`}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.65fr,1fr]">
          <div className="space-y-6">
            <BidTable bids={bids} pickupDate={currentRFQ.pickupDate} newBidId={newBidId} />
            {currentRFQ.status === "active" || currentRFQ.status === "extended" ? (
              <SubmitBidForm rfqId={currentRFQ._id} bids={bids} status={currentRFQ.status} />
            ) : null}
          </div>

          <div className="space-y-6">
            <CountdownTimer
              currentBidCloseTime={currentRFQ.currentBidCloseTime}
              forcedBidCloseTime={currentRFQ.forcedBidCloseTime}
              status={currentRFQ.status}
              extensionCount={currentRFQ.extensionCount}
            />

            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-accent-dark" />
                <h2 className="text-base font-semibold text-surface-900">
                  Auction Configuration
                </h2>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-surface-600">Trigger Window</span>
                  <span className="font-medium text-surface-900">
                    {`${currentRFQ.britishAuctionConfig.triggerWindowMinutes} min`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-surface-600">Extension Duration</span>
                  <span className="font-medium text-surface-900">
                    {`${currentRFQ.britishAuctionConfig.extensionDurationMinutes} min`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-surface-600">Extension Trigger</span>
                  <span className="font-medium text-surface-900">
                    {currentRFQ.britishAuctionConfig.extensionTrigger.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-surface-600">Min Decrement</span>
                  <span className="font-medium text-surface-900">
                    {currentRFQ.britishAuctionConfig.minimumDecrementType === "NONE"
                      ? "None"
                      : `${currentRFQ.britishAuctionConfig.minimumDecrementValue} ${
                          currentRFQ.britishAuctionConfig.minimumDecrementType === "PERCENTAGE"
                            ? "%"
                            : "INR"
                        }`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-surface-600">Max Extensions</span>
                  <span className="font-medium text-surface-900">
                    {currentRFQ.britishAuctionConfig.maxExtensions === 0
                      ? "Unlimited"
                      : currentRFQ.britishAuctionConfig.maxExtensions}
                  </span>
                </div>
              </div>
            </div>

            <ActivityLog logs={logs} />
          </div>
        </section>
      </div>

      <ExtensionToast toasts={toasts} removeToast={removeToast} />
    </PageWrapper>
  );
}
