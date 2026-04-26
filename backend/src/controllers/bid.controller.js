const bidRepository = require("../repositories/bid.repository");
const bidService = require("../services/bid.service");

/**
 * Builds the bid controller with access to the Socket.io instance.
 *
 * @param {object} io - The Socket.io server instance.
 * @returns {{ submitBid: Function, getBidsByRFQ: Function }} The bid controller handlers.
 */
function createBidController(io) {
  return {
    /**
     * Submits a new bid for the current RFQ.
     *
     * @param {object} req - The Express request object.
     * @param {object} res - The Express response object.
     * @param {Function} next - The Express next callback.
     * @returns {Promise<void>} Sends the API response.
     */
    submitBid: async (req, res, next) => {
      try {
        const result = await bidService.submitBid(req.params.id, req.body, io);

        res.status(201).json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Returns the latest bids for the current RFQ ordered by rank.
     *
     * @param {object} req - The Express request object.
     * @param {object} res - The Express response object.
     * @param {Function} next - The Express next callback.
     * @returns {Promise<void>} Sends the API response.
     */
    getBidsByRFQ: async (req, res, next) => {
      try {
        const bids = await bidRepository.findLatestBidsByRFQ(req.params.id);

        res.status(200).json({
          success: true,
          data: bids,
        });
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = createBidController;
