const mongoose = require("mongoose");

const STATUS_VALUES = [
  "pending",
  "active",
  "extended",
  "closed",
  "force_closed",
  "no_bids",
];

const EXTENSION_TRIGGER_VALUES = [
  "BID_RECEIVED",
  "ANY_RANK_CHANGE",
  "L1_RANK_CHANGE",
];

const MINIMUM_DECREMENT_TYPE_VALUES = [
  "NONE",
  "PERCENTAGE",
  "FIXED_AMOUNT",
];

const britishAuctionConfigSchema = new mongoose.Schema(
  {
    triggerWindowMinutes: {
      type: Number,
      required: true,
    },
    extensionDurationMinutes: {
      type: Number,
      required: true,
    },
    extensionTrigger: {
      type: String,
      required: true,
      enum: EXTENSION_TRIGGER_VALUES,
    },
    minimumDecrementType: {
      type: String,
      required: true,
      enum: MINIMUM_DECREMENT_TYPE_VALUES,
    },
    minimumDecrementValue: {
      type: Number,
      default: 0,
    },
    maxExtensions: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const rfqSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bidStartTime: {
      type: Date,
      required: true,
    },
    bidCloseTime: {
      type: Date,
      required: true,
    },
    forcedBidCloseTime: {
      type: Date,
      required: true,
    },
    currentBidCloseTime: {
      type: Date,
      required: true,
    },
    pickupDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: STATUS_VALUES,
    },
    britishAuctionConfig: {
      type: britishAuctionConfigSchema,
      required: true,
    },
    extensionCount: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RFQ", rfqSchema);
