const auctionLogRepository = require("../repositories/auctionLog.repository");
const bidRepository = require("../repositories/bid.repository");
const rfqRepository = require("../repositories/rfq.repository");
const {
  buildExtensionReason,
  computeNewCloseTime,
  didSupplierRanksChange,
  isInTriggerWindow,
  shouldExtend,
} = require("../utils/auctionEngine");

/**
 * Builds the scheduler log description for a closing event.
 *
 * @param {string} status - The status being applied.
 * @returns {string} A readable closing description.
 */
function buildClosureDescription(status) {
  if (status === "no_bids") {
    return "Auction closed with no bids received";
  }

  if (status === "force_closed") {
    return "Auction reached the forced close deadline";
  }

  return "Auction closed after the bidding window ended";
}

/**
 * Evaluates whether the latest bid should extend the auction and performs side effects when it does.
 *
 * @param {object} rfq - The RFQ being evaluated.
 * @param {object} newBid - The newly submitted bid.
 * @param {string|null} previousL1SupplierName - The prior L1 supplier name.
 * @param {Array<object>} previousLatestBids - The latest bids before the new bid was saved.
 * @param {Array<object>} allCurrentBids - The latest bids after rank recomputation.
 * @param {object} io - The Socket.io server instance.
 * @returns {Promise<{ extended: boolean, previousCloseTime?: Date, newCloseTime?: Date, reason?: string }>} The extension outcome.
 */
async function processAuctionExtension(
  rfq,
  newBid,
  previousL1SupplierName,
  previousLatestBids,
  allCurrentBids,
  io
) {
  if (
    rfq.britishAuctionConfig.maxExtensions > 0 &&
    rfq.extensionCount >= rfq.britishAuctionConfig.maxExtensions
  ) {
    return {
      extended: false,
      reason: "MAX_EXTENSIONS_REACHED",
    };
  }

  if (
    !isInTriggerWindow(
      new Date(newBid.submittedAt),
      new Date(rfq.currentBidCloseTime),
      rfq.britishAuctionConfig.triggerWindowMinutes
    )
  ) {
    return { extended: false };
  }

  const sortedCurrentBids = [...allCurrentBids].sort((left, right) => {
    if (left.totalAmount !== right.totalAmount) {
      return left.totalAmount - right.totalAmount;
    }

    return new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime();
  });
  const newL1SupplierName = sortedCurrentBids[0]?.supplierName || null;
  const eventData = {
    wasBidReceived: true,
    didAnyRankChange: didSupplierRanksChange(previousLatestBids, sortedCurrentBids),
    didL1Change:
      previousL1SupplierName !== null &&
      newL1SupplierName !== previousL1SupplierName,
  };

  if (!shouldExtend(rfq.britishAuctionConfig.extensionTrigger, eventData)) {
    return { extended: false };
  }

  const previousCloseTime = new Date(rfq.currentBidCloseTime);
  const newCloseTime = computeNewCloseTime(
    previousCloseTime,
    rfq.britishAuctionConfig.extensionDurationMinutes,
    new Date(rfq.forcedBidCloseTime)
  );

  if (newCloseTime.getTime() === previousCloseTime.getTime()) {
    return { extended: false };
  }

  await rfqRepository.updateRFQ(rfq._id, {
    currentBidCloseTime: newCloseTime,
    extensionCount: rfq.extensionCount + 1,
    status: "extended",
  });

  const reason = buildExtensionReason(
    rfq.britishAuctionConfig.extensionTrigger,
    newBid.supplierName
  );

  await auctionLogRepository.createLog({
    rfqId: rfq._id,
    eventType: "AUCTION_EXTENDED",
    description: reason,
    metadata: {
      previousCloseTime,
      newCloseTime,
      extensionCount: rfq.extensionCount + 1,
    },
    timestamp: new Date(),
  });

  io.to(rfq._id.toString()).emit("auction:extended", {
    rfqId: rfq._id.toString(),
    previousCloseTime: previousCloseTime.toISOString(),
    newCloseTime: newCloseTime.toISOString(),
    extensionDurationMinutes: rfq.britishAuctionConfig.extensionDurationMinutes,
    extensionCount: rfq.extensionCount + 1,
    reason,
  });

  return {
    extended: true,
    previousCloseTime,
    newCloseTime,
    reason,
  };
}

/**
 * Starts the periodic scheduler that closes auctions whose effective close time has passed.
 *
 * @param {object} io - The Socket.io server instance.
 * @returns {NodeJS.Timeout} The interval handle.
 */
function runAuctionScheduler(io) {
  return setInterval(async () => {
    try {
      const pendingRFQs = await rfqRepository.findPendingRFQsReadyToStart();

      for (const rfq of pendingRFQs) {
        await rfqRepository.updateRFQ(rfq._id, {
          status: "active",
        });
      }

      const rfqs = await rfqRepository.findActiveOrExtendedRFQsPastClose();

      for (const rfq of rfqs) {
        const count = await bidRepository.countLatestBidsByRFQ(rfq._id);

        let newStatus = "closed";
        let eventType = "AUCTION_CLOSED";
        let socketEvent = "auction:closed";

        if (count === 0) {
          newStatus = "no_bids";
          eventType = "AUCTION_CLOSED";
          socketEvent = "auction:closed";
        } else if (
          new Date(rfq.currentBidCloseTime).getTime() >=
          new Date(rfq.forcedBidCloseTime).getTime()
        ) {
          newStatus = "force_closed";
          eventType = "AUCTION_FORCE_CLOSED";
          socketEvent = "auction:force_closed";
        }

        await rfqRepository.updateRFQ(rfq._id, {
          status: newStatus,
        });

        await auctionLogRepository.createLog({
          rfqId: rfq._id,
          eventType,
          description: buildClosureDescription(newStatus),
          metadata: {
            status: newStatus,
            totalBids: count,
          },
          timestamp: new Date(),
        });

        io.to(rfq._id.toString()).emit(socketEvent, {
          rfqId: rfq._id.toString(),
          status: socketEvent === "auction:force_closed" ? "force_closed" : "closed",
        });
      }
    } catch (error) {
      console.error("Auction scheduler tick failed", error);
    }
  }, 10000);
}

module.exports = {
  processAuctionExtension,
  runAuctionScheduler,
};
