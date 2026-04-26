const AuctionLog = require("../models/AuctionLog.model");

/**
 * Persists a new auction activity log entry.
 *
 * @param {object} data - The log payload to store.
 * @returns {Promise<object>} The saved log document.
 */
async function createLog(data) {
  const log = new AuctionLog(data);
  return log.save();
}

/**
 * Retrieves all logs for an RFQ ordered by newest first.
 *
 * @param {string|object} rfqId - The RFQ identifier.
 * @returns {Promise<Array<object>>} The auction logs.
 */
async function findLogsByRFQ(rfqId) {
  return AuctionLog.find({ rfqId }).sort({ timestamp: -1 }).lean();
}

module.exports = {
  createLog,
  findLogsByRFQ,
};
