const mongoose = require("mongoose");

const EVENT_TYPE_VALUES = [
  "BID_SUBMITTED",
  "AUCTION_EXTENDED",
  "AUCTION_CLOSED",
  "AUCTION_FORCE_CLOSED",
  "NO_ACTIVITY_WARNING",
];

const auctionLogSchema = new mongoose.Schema({
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "RFQ",
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: EVENT_TYPE_VALUES,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("AuctionLog", auctionLogSchema);
