const auctionLogRepository = require("../repositories/auctionLog.repository");
const bidRepository = require("../repositories/bid.repository");
const rfqRepository = require("../repositories/rfq.repository");
const { processAuctionExtension } = require("./auction.service");
const {
  computeRanks,
  isMinimumDecrementValid,
} = require("../utils/auctionEngine");

/**
 * Builds the minimum decrement validation message for a bid rejection.
 *
 * @param {string} minimumDecrementType - The configured decrement type.
 * @param {number} minimumDecrementValue - The configured decrement value.
 * @param {number} currentL1Total - The current lowest total amount.
 * @returns {string} The human-readable validation message.
 */
function buildMinimumDecrementMessage(
  minimumDecrementType,
  minimumDecrementValue,
  currentL1Total
) {
  if (minimumDecrementType === "PERCENTAGE") {
    return `Bid must be at least ${minimumDecrementValue}% lower than current lowest bid of ₹${currentL1Total.toLocaleString(
      "en-IN"
    )}`;
  }

  return `Bid must be at least ₹${minimumDecrementValue.toLocaleString(
    "en-IN"
  )} lower than current lowest bid of ₹${currentL1Total.toLocaleString("en-IN")}`;
}

/**
 * Submits a bid, recalculates ranks, logs the activity, and triggers auction extensions when applicable.
 *
 * @param {string} rfqId - The RFQ identifier.
 * @param {object} bidData - The bid submission payload.
 * @param {object} io - The Socket.io server instance.
 * @returns {Promise<{ bid: object, extensionResult: object }>} The saved bid and extension outcome.
 */
async function submitBid(rfqId, bidData, io) {
  let rfq = await rfqRepository.findRFQById(rfqId);

  if (!rfq) {
    throw {
      message: "RFQ not found",
      code: "RFQ_NOT_FOUND",
    };
  }

  if (
    rfq.status === "pending" &&
    new Date() >= new Date(rfq.bidStartTime) &&
    new Date() < new Date(rfq.currentBidCloseTime) &&
    new Date() < new Date(rfq.forcedBidCloseTime)
  ) {
    rfq = await rfqRepository.updateRFQ(rfqId, {
      status: "active",
    });
  }

  if (rfq.status !== "active" && rfq.status !== "extended") {
    throw {
      message: "Auction is not active",
      code: "AUCTION_CLOSED",
    };
  }

  if (new Date() >= new Date(rfq.currentBidCloseTime)) {
    throw {
      message: "Auction bidding time has passed",
      code: "BID_TIME_PASSED",
    };
  }

  const currentLatestBids = await bidRepository.findLatestBidsByRFQ(rfqId);
  const totalAmount =
    bidData.charges.freight + bidData.charges.origin + bidData.charges.destination;

  if (
    rfq.britishAuctionConfig.minimumDecrementType !== "NONE" &&
    currentLatestBids.length > 0
  ) {
    const currentL1Total = currentLatestBids[0].totalAmount;
    const minimumDecrementType = rfq.britishAuctionConfig.minimumDecrementType;
    const minimumDecrementValue = rfq.britishAuctionConfig.minimumDecrementValue;
    const valid = isMinimumDecrementValid(
      totalAmount,
      currentL1Total,
      minimumDecrementType,
      minimumDecrementValue
    );

    if (!valid) {
      throw {
        message: buildMinimumDecrementMessage(
          minimumDecrementType,
          minimumDecrementValue,
          currentL1Total
        ),
        code: "BELOW_MIN_DECREMENT",
      };
    }
  }

  const previousL1SupplierName = currentLatestBids[0]?.supplierName || null;
  const previousBid = await bidRepository.findPreviousBidBySupplier(
    rfqId,
    bidData.supplierName
  );

  if (previousBid) {
    await bidRepository.markBidAsNotLatest(previousBid._id);
  }

  const sevenDaysBeforePickup = new Date(
    new Date(rfq.pickupDate).getTime() - 7 * 24 * 60 * 60 * 1000
  );
  const isValidityWarning = new Date(bidData.quoteValidity) < sevenDaysBeforePickup;
  const submittedAt = new Date();
  const savedBid = await bidRepository.createBid({
    rfqId,
    supplierName: bidData.supplierName,
    carrierName: bidData.carrierName,
    charges: bidData.charges,
    totalAmount,
    transitDays: bidData.transitDays,
    quoteValidity: new Date(bidData.quoteValidity),
    rank: 999,
    isLatestBySupplier: true,
    submittedAt,
    isValidityWarning,
  });

  const allLatestBids = await bidRepository.findLatestBidsByRFQ(rfqId);
  const rankedBids = computeRanks(allLatestBids);

  await bidRepository.bulkUpdateRanks(rankedBids);

  const savedBidObject = savedBid.toObject();
  const rankedSavedBid = rankedBids.find(
    (bid) => bid._id.toString() === savedBidObject._id.toString()
  );

  if (rankedSavedBid) {
    savedBidObject.rank = rankedSavedBid.rank;
  }

  await auctionLogRepository.createLog({
    rfqId,
    eventType: "BID_SUBMITTED",
    description: `${bidData.supplierName} submitted a bid of ₹${totalAmount.toLocaleString(
      "en-IN"
    )}`,
    metadata: {
      bidId: savedBidObject._id,
      totalAmount,
      supplierName: bidData.supplierName,
    },
    timestamp: submittedAt,
  });

  const extensionResult = await processAuctionExtension(
    rfq,
    savedBidObject,
    previousL1SupplierName,
    currentLatestBids,
    rankedBids,
    io
  );
  const roomSize = io.sockets.adapter.rooms.get(rfqId.toString())?.size || 0;

  io.to(rfqId.toString()).emit("bid:new", {
    rfqId: rfqId.toString(),
    bids: rankedBids,
    latestBid: savedBidObject,
    activeBidderCount: roomSize,
  });

  return {
    bid: savedBidObject,
    extensionResult,
  };
}

module.exports = {
  submitBid,
};
