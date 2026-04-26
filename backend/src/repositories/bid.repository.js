const Bid = require("../models/Bid.model");

/**
 * Persists a new bid document.
 *
 * @param {object} data - The bid payload to store.
 * @returns {Promise<object>} The saved bid document.
 */
async function createBid(data) {
  const bid = new Bid(data);
  return bid.save();
}

/**
 * Retrieves the latest bids for an RFQ ordered by rank.
 *
 * @param {string|object} rfqId - The RFQ identifier.
 * @returns {Promise<Array<object>>} The latest bids for the RFQ.
 */
async function findLatestBidsByRFQ(rfqId) {
  return Bid.find({
    rfqId,
    isLatestBySupplier: true,
  })
    .sort({ rank: 1 })
    .lean();
}

/**
 * Retrieves every bid for an RFQ ordered by submission time.
 *
 * @param {string|object} rfqId - The RFQ identifier.
 * @returns {Promise<Array<object>>} All bids for the RFQ.
 */
async function findAllBidsByRFQ(rfqId) {
  return Bid.find({ rfqId }).sort({ submittedAt: 1 }).lean();
}

/**
 * Retrieves the current latest bid for a supplier inside an RFQ.
 *
 * @param {string|object} rfqId - The RFQ identifier.
 * @param {string} supplierName - The supplier name.
 * @returns {Promise<object|null>} The previous latest bid or null.
 */
async function findPreviousBidBySupplier(rfqId, supplierName) {
  return Bid.findOne({
    rfqId,
    supplierName,
    isLatestBySupplier: true,
  }).lean();
}

/**
 * Marks a bid as no longer being the latest for its supplier.
 *
 * @param {string|object} bidId - The bid identifier.
 * @returns {Promise<object|null>} The updated bid or null.
 */
async function markBidAsNotLatest(bidId) {
  return Bid.findByIdAndUpdate(
    bidId,
    { isLatestBySupplier: false },
    { new: true }
  ).lean();
}

/**
 * Persists recalculated ranks for a list of bids.
 *
 * @param {Array<{ _id: string|object, rank: number }>} bids - The ranked bids.
 * @returns {Promise<object|undefined>} The bulk write result or undefined when no bids are provided.
 */
async function bulkUpdateRanks(bids) {
  if (bids.length === 0) {
    return undefined;
  }

  return Bid.bulkWrite(
    bids.map((bid) => ({
      updateOne: {
        filter: { _id: bid._id },
        update: { rank: bid.rank },
      },
    }))
  );
}

/**
 * Counts the number of latest bids currently active for an RFQ.
 *
 * @param {string|object} rfqId - The RFQ identifier.
 * @returns {Promise<number>} The count of latest bids.
 */
async function countLatestBidsByRFQ(rfqId) {
  return Bid.countDocuments({
    rfqId,
    isLatestBySupplier: true,
  });
}

module.exports = {
  createBid,
  findLatestBidsByRFQ,
  findAllBidsByRFQ,
  findPreviousBidBySupplier,
  markBidAsNotLatest,
  bulkUpdateRanks,
  countLatestBidsByRFQ,
};
