const bidRepository = require("../repositories/bid.repository");
const auctionLogRepository = require("../repositories/auctionLog.repository");
const rfqRepository = require("../repositories/rfq.repository");
const { computeAuctionStatus } = require("../utils/auctionEngine");

/**
 * Promotes a stale pending RFQ to active once its start time has passed.
 *
 * @param {object} rfq - The RFQ record to inspect.
 * @returns {Promise<object>} The original or updated RFQ.
 */
async function synchronizePendingStatus(rfq) {
  const now = new Date();

  if (
    rfq.status === "pending" &&
    now >= new Date(rfq.bidStartTime) &&
    now < new Date(rfq.currentBidCloseTime) &&
    now < new Date(rfq.forcedBidCloseTime)
  ) {
    return rfqRepository.updateRFQ(rfq._id, {
      status: "active",
    });
  }

  return rfq;
}

/**
 * Builds the L1 price journey for an RFQ by replaying bids in submission order.
 *
 * @param {Array<{ supplierName: string, totalAmount: number, submittedAt: Date }>} allBids - All bids for the RFQ.
 * @returns {Array<{ price: number, timestamp: Date }>} The L1 price history.
 */
function buildL1PriceHistory(allBids) {
  const latestBySupplier = new Map();
  const l1PriceHistory = [];
  let currentL1 = null;

  for (const bid of allBids) {
    latestBySupplier.set(bid.supplierName, bid);

    const currentBids = Array.from(latestBySupplier.values());
    const newL1 = Math.min(...currentBids.map((currentBid) => currentBid.totalAmount));

    if (currentL1 === null || newL1 !== currentL1) {
      l1PriceHistory.push({
        price: newL1,
        timestamp: bid.submittedAt,
      });
      currentL1 = newL1;
    }
  }

  return l1PriceHistory;
}

/**
 * Creates a new RFQ after validating the configured auction timings.
 *
 * @param {object} data - The RFQ creation payload.
 * @returns {Promise<object>} The saved RFQ document.
 */
async function createRFQ(data) {
  const forcedBidCloseTime = new Date(data.forcedBidCloseTime);
  const bidCloseTime = new Date(data.bidCloseTime);
  const bidStartTime = new Date(data.bidStartTime);
  const pickupDate = new Date(data.pickupDate);
  const config = data.britishAuctionConfig;

  if (forcedBidCloseTime <= bidCloseTime) {
    throw {
      message: "forcedBidCloseTime must be later than bidCloseTime",
      code: "INVALID_DATES",
    };
  }

  if (bidCloseTime <= bidStartTime) {
    throw {
      message: "bidCloseTime must be later than bidStartTime",
      code: "INVALID_DATES",
    };
  }

  if (config.triggerWindowMinutes <= 0) {
    throw {
      message: "triggerWindowMinutes must be greater than 0",
      code: "INVALID_CONFIG",
    };
  }

  if (config.extensionDurationMinutes <= 0) {
    throw {
      message: "extensionDurationMinutes must be greater than 0",
      code: "INVALID_CONFIG",
    };
  }

  const referenceId = `RFQ-${new Date().getFullYear()}-${String(
    Math.floor(1000 + Math.random() * 9000)
  )}`;
  const now = new Date();
  const currentBidCloseTime = bidCloseTime;
  const status = computeAuctionStatus(
    bidStartTime,
    currentBidCloseTime,
    forcedBidCloseTime,
    now
  );

  return rfqRepository.createRFQ({
    name: data.name,
    referenceId,
    bidStartTime,
    bidCloseTime,
    forcedBidCloseTime,
    currentBidCloseTime,
    pickupDate,
    status,
    britishAuctionConfig: {
      triggerWindowMinutes: config.triggerWindowMinutes,
      extensionDurationMinutes: config.extensionDurationMinutes,
      extensionTrigger: config.extensionTrigger,
      minimumDecrementType: config.minimumDecrementType,
      minimumDecrementValue: config.minimumDecrementValue ?? 0,
      maxExtensions: config.maxExtensions ?? 0,
    },
    extensionCount: 0,
  });
}

/**
 * Lists RFQs and enriches each record with bid summary information.
 *
 * @returns {Promise<Array<object>>} The RFQ summaries.
 */
async function listRFQs() {
  const rfqs = await rfqRepository.findAllRFQs();

  return Promise.all(
    rfqs.map(async (rfq) => {
      const syncedRFQ = await synchronizePendingStatus(rfq);
      const effectiveRFQ = syncedRFQ || rfq;
      const latestBids = await bidRepository.findLatestBidsByRFQ(rfq._id);
      const lowestBid =
        latestBids.length > 0
          ? Math.min(...latestBids.map((bid) => bid.totalAmount))
          : null;

      return {
        ...effectiveRFQ,
        lowestBid,
        totalBids: latestBids.length,
      };
    })
  );
}

/**
 * Retrieves a detailed RFQ view including bids, logs, and L1 history.
 *
 * @param {string} id - The RFQ identifier.
 * @returns {Promise<{ rfq: object, bids: Array<object>, logs: Array<object>, l1PriceHistory: Array<object> }>} The RFQ detail payload.
 */
async function getRFQById(id) {
  const rfq = await rfqRepository.findRFQById(id);

  if (!rfq) {
    throw {
      message: "RFQ not found",
      code: "RFQ_NOT_FOUND",
    };
  }

  const syncedRFQ = await synchronizePendingStatus(rfq);
  const effectiveRFQ = syncedRFQ || rfq;

  const [bids, logs, allBids] = await Promise.all([
    bidRepository.findLatestBidsByRFQ(id),
    auctionLogRepository.findLogsByRFQ(id),
    bidRepository.findAllBidsByRFQ(id),
  ]);

  const l1PriceHistory = buildL1PriceHistory(allBids);

  return {
    rfq: effectiveRFQ,
    bids,
    logs,
    l1PriceHistory,
  };
}

module.exports = {
  createRFQ,
  listRFQs,
  getRFQById,
};
