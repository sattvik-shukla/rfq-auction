const rfqService = require("../services/rfq.service");

/**
 * Creates a new RFQ and returns the saved document.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - The Express next callback.
 * @returns {Promise<void>} Sends the API response.
 */
async function createRFQ(req, res, next) {
  try {
    const result = await rfqService.createRFQ(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lists all RFQs with their bid summaries.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - The Express next callback.
 * @returns {Promise<void>} Sends the API response.
 */
async function listRFQs(req, res, next) {
  try {
    const result = await rfqService.listRFQs();

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieves a single RFQ with bids, logs, and L1 history.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - The Express next callback.
 * @returns {Promise<void>} Sends the API response.
 */
async function getRFQById(req, res, next) {
  try {
    const result = await rfqService.getRFQById(req.params.id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRFQ,
  listRFQs,
  getRFQById,
};
