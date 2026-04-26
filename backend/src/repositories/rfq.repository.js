const RFQ = require("../models/RFQ.model");

/**
 * Persists a new RFQ document.
 *
 * @param {object} data - The RFQ payload to store.
 * @returns {Promise<object>} The saved RFQ document.
 */
async function createRFQ(data) {
  const rfq = new RFQ(data);
  return rfq.save();
}

/**
 * Retrieves all RFQs ordered by newest first.
 *
 * @returns {Promise<Array<object>>} The RFQ documents.
 */
async function findAllRFQs() {
  return RFQ.find().sort({ createdAt: -1 }).lean();
}

/**
 * Retrieves a single RFQ by identifier.
 *
 * @param {string|object} id - The RFQ identifier.
 * @returns {Promise<object|null>} The RFQ document or null.
 */
async function findRFQById(id) {
  return RFQ.findById(id).lean();
}

/**
 * Updates an RFQ and returns the modified document.
 *
 * @param {string|object} id - The RFQ identifier.
 * @param {object} updateData - The fields to update.
 * @returns {Promise<object|null>} The updated RFQ document or null.
 */
async function updateRFQ(id, updateData) {
  return RFQ.findByIdAndUpdate(id, updateData, { new: true }).lean();
}

/**
 * Finds active or extended RFQs whose close time has elapsed.
 *
 * @returns {Promise<Array<object>>} The expired active or extended RFQs.
 */
async function findActiveOrExtendedRFQsPastClose() {
  return RFQ.find({
    status: {
      $in: ["active", "extended"],
    },
    currentBidCloseTime: {
      $lte: new Date(),
    },
  }).lean();
}

/**
 * Finds pending RFQs whose start time has passed and that should now be active.
 *
 * @returns {Promise<Array<object>>} The pending RFQs ready to activate.
 */
async function findPendingRFQsReadyToStart() {
  return RFQ.find({
    status: "pending",
    bidStartTime: {
      $lte: new Date(),
    },
    currentBidCloseTime: {
      $gt: new Date(),
    },
    forcedBidCloseTime: {
      $gt: new Date(),
    },
  }).lean();
}

module.exports = {
  createRFQ,
  findAllRFQs,
  findRFQById,
  updateRFQ,
  findActiveOrExtendedRFQsPastClose,
  findPendingRFQsReadyToStart,
};
