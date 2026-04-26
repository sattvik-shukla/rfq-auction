const express = require("express");
const bidController = require("../controllers/bid.controller");
const { validateSubmitBid } = require("../middleware/validate");

/**
 * Builds the bid router with access to the Socket.io instance.
 *
 * @param {object} io - The Socket.io server instance.
 * @returns {object} The configured Express router.
 */
function createBidRouter(io) {
  const router = express.Router({ mergeParams: true });
  const controller = bidController(io);

  router.post("/", validateSubmitBid, controller.submitBid);
  router.get("/", controller.getBidsByRFQ);

  return router;
}

module.exports = createBidRouter;
