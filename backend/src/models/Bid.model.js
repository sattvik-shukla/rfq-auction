const mongoose = require("mongoose");

const chargesSchema = new mongoose.Schema(
  {
    freight: {
      type: Number,
      required: true,
    },
    origin: {
      type: Number,
      required: true,
    },
    destination: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const bidSchema = new mongoose.Schema({
  rfqId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "RFQ",
    index: true,
  },
  supplierName: {
    type: String,
    required: true,
    trim: true,
  },
  carrierName: {
    type: String,
    required: true,
    trim: true,
  },
  charges: {
    type: chargesSchema,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    index: true,
  },
  transitDays: {
    type: Number,
    required: true,
  },
  quoteValidity: {
    type: Date,
    required: true,
  },
  rank: {
    type: Number,
    required: true,
  },
  isLatestBySupplier: {
    type: Boolean,
    required: true,
    index: true,
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  isValidityWarning: {
    type: Boolean,
    required: true,
  },
});

module.exports = mongoose.model("Bid", bidSchema);
