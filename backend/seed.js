require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("./src/config/db");
const AuctionLog = require("./src/models/AuctionLog.model");
const Bid = require("./src/models/Bid.model");
const RFQ = require("./src/models/RFQ.model");
const { computeRanks } = require("./src/utils/auctionEngine");

/**
 * Computes whether quote validity should raise the pickup-date warning.
 *
 * @param {Date} pickupDate - The RFQ pickup date.
 * @param {Date} quoteValidity - The bid quote validity date.
 * @returns {boolean} True when the validity date is less than seven days before pickup.
 */
function computeValidityWarning(pickupDate, quoteValidity) {
  const sevenDaysBeforePickup = new Date(
    pickupDate.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  return quoteValidity < sevenDaysBeforePickup;
}

/**
 * Builds a bid payload with computed totals and warning metadata.
 *
 * @param {object} params - The bid seed parameters.
 * @param {object} params.rfq - The RFQ document.
 * @param {string} params.supplierName - The supplier name.
 * @param {string} params.carrierName - The carrier name.
 * @param {{ freight: number, origin: number, destination: number }} params.charges - Bid charges.
 * @param {number} params.transitDays - Transit days.
 * @param {Date} params.quoteValidity - Quote validity date.
 * @param {Date} params.submittedAt - Submission timestamp.
 * @param {boolean} params.isLatestBySupplier - Whether this bid is the latest for the supplier.
 * @param {number} params.rank - The rank value to assign.
 * @returns {object} The complete bid seed document.
 */
function createBidSeed({
  rfq,
  supplierName,
  carrierName,
  charges,
  transitDays,
  quoteValidity,
  submittedAt,
  isLatestBySupplier,
  rank,
}) {
  return {
    rfqId: rfq._id,
    supplierName,
    carrierName,
    charges,
    totalAmount: charges.freight + charges.origin + charges.destination,
    transitDays,
    quoteValidity,
    rank,
    isLatestBySupplier,
    submittedAt,
    isValidityWarning: computeValidityWarning(rfq.pickupDate, quoteValidity),
  };
}

/**
 * Creates seeded activity log entries for a bid.
 *
 * @param {object} params - The log parameters.
 * @param {object} params.rfq - The RFQ document.
 * @param {object} params.bid - The bid document.
 * @returns {object} The seed log document.
 */
function createBidLogSeed({ rfq, bid }) {
  return {
    rfqId: rfq._id,
    eventType: "BID_SUBMITTED",
    description: `${bid.supplierName} submitted a bid of ₹${bid.totalAmount.toLocaleString(
      "en-IN"
    )}`,
    metadata: {
      supplierName: bid.supplierName,
      totalAmount: bid.totalAmount,
    },
    timestamp: bid.submittedAt,
  };
}

/**
 * Seeds the database with demo RFQs, bids, and activity logs.
 *
 * @returns {Promise<void>} Resolves when seed data has been inserted.
 */
async function seed() {
  const now = new Date();

  const rfq1 = {
    name: "Mumbai to Delhi Freight Route Q2",
    referenceId: "RFQ-2026-1001",
    bidStartTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    bidCloseTime: new Date(now.getTime() + 30 * 60 * 1000),
    forcedBidCloseTime: new Date(now.getTime() + 60 * 60 * 1000),
    currentBidCloseTime: new Date(now.getTime() + 30 * 60 * 1000),
    pickupDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    status: "active",
    britishAuctionConfig: {
      triggerWindowMinutes: 10,
      extensionDurationMinutes: 5,
      extensionTrigger: "L1_RANK_CHANGE",
      minimumDecrementType: "PERCENTAGE",
      minimumDecrementValue: 2,
      maxExtensions: 5,
    },
    extensionCount: 0,
  };

  const rfq2 = {
    name: "Chennai to Bangalore Cold Chain",
    referenceId: "RFQ-2026-1002",
    bidStartTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
    bidCloseTime: new Date(now.getTime() + 17 * 60 * 1000),
    forcedBidCloseTime: new Date(now.getTime() + 35 * 60 * 1000),
    currentBidCloseTime: new Date(now.getTime() + 20 * 60 * 1000),
    pickupDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    status: "extended",
    britishAuctionConfig: {
      triggerWindowMinutes: 5,
      extensionDurationMinutes: 3,
      extensionTrigger: "BID_RECEIVED",
      minimumDecrementType: "NONE",
      minimumDecrementValue: 0,
      maxExtensions: 0,
    },
    extensionCount: 1,
  };

  const rfq3 = {
    name: "Delhi to Jaipur Express Cargo",
    referenceId: "RFQ-2026-1003",
    bidStartTime: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    bidCloseTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),
    forcedBidCloseTime: new Date(now.getTime() + 7 * 60 * 60 * 1000),
    currentBidCloseTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),
    pickupDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    status: "pending",
    britishAuctionConfig: {
      triggerWindowMinutes: 8,
      extensionDurationMinutes: 4,
      extensionTrigger: "ANY_RANK_CHANGE",
      minimumDecrementType: "FIXED_AMOUNT",
      minimumDecrementValue: 1000,
      maxExtensions: 3,
    },
    extensionCount: 0,
  };

  await RFQ.deleteMany({});
  await Bid.deleteMany({});
  await AuctionLog.deleteMany({});

  const [savedRFQ1, savedRFQ2, savedRFQ3] = await RFQ.create([rfq1, rfq2, rfq3]);

  const rfq1BidsBase = [
    createBidSeed({
      rfq: savedRFQ1,
      supplierName: "Supplier A",
      carrierName: "Blue Dart Freight",
      charges: { freight: 48000, origin: 3500, destination: 3500 },
      transitDays: 3,
      quoteValidity: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 55 * 60 * 1000),
      isLatestBySupplier: true,
      rank: 999,
    }),
    createBidSeed({
      rfq: savedRFQ1,
      supplierName: "Supplier B",
      carrierName: "FedEx Freight",
      charges: { freight: 45000, origin: 3500, destination: 3500 },
      transitDays: 4,
      quoteValidity: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 40 * 60 * 1000),
      isLatestBySupplier: true,
      rank: 999,
    }),
    createBidSeed({
      rfq: savedRFQ1,
      supplierName: "Supplier C",
      carrierName: "Delhivery Cargo",
      charges: { freight: 51000, origin: 3500, destination: 3500 },
      transitDays: 3,
      quoteValidity: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 28 * 60 * 1000),
      isLatestBySupplier: true,
      rank: 999,
    }),
  ];
  const rfq1Ranked = computeRanks(rfq1BidsBase).map((bid) => ({ ...bid }));

  const rfq2OldBid = createBidSeed({
    rfq: savedRFQ2,
    supplierName: "Supplier A",
    carrierName: "Snowline Movers",
    charges: { freight: 24000, origin: 3000, destination: 3000 },
    transitDays: 2,
    quoteValidity: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
    submittedAt: new Date(now.getTime() - 90 * 60 * 1000),
    isLatestBySupplier: false,
    rank: 2,
  });
  const rfq2LatestBase = [
    createBidSeed({
      rfq: savedRFQ2,
      supplierName: "Supplier A",
      carrierName: "Snowline Movers",
      charges: { freight: 22000, origin: 3000, destination: 3000 },
      transitDays: 2,
      quoteValidity: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 35 * 60 * 1000),
      isLatestBySupplier: true,
      rank: 999,
    }),
    createBidSeed({
      rfq: savedRFQ2,
      supplierName: "Supplier B",
      carrierName: "ColdCube Logistics",
      charges: { freight: 25000, origin: 3000, destination: 3000 },
      transitDays: 3,
      quoteValidity: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      submittedAt: new Date(now.getTime() - 25 * 60 * 1000),
      isLatestBySupplier: true,
      rank: 999,
    }),
  ];
  const rfq2RankedLatest = computeRanks(rfq2LatestBase).map((bid) => ({ ...bid }));

  const savedBids = await Bid.create([
    ...rfq1Ranked,
    rfq2OldBid,
    ...rfq2RankedLatest,
  ]);

  const rfq1SavedBids = savedBids.filter(
    (bid) => bid.rfqId.toString() === savedRFQ1._id.toString()
  );
  const rfq2SavedBids = savedBids.filter(
    (bid) => bid.rfqId.toString() === savedRFQ2._id.toString()
  );

  const extensionLogTime = new Date(now.getTime() - 20 * 60 * 1000);

  await AuctionLog.create([
    ...rfq1SavedBids
      .filter((bid) => bid.isLatestBySupplier)
      .map((bid) => createBidLogSeed({ rfq: savedRFQ1, bid })),
    ...rfq2SavedBids.map((bid) => createBidLogSeed({ rfq: savedRFQ2, bid })),
    {
      rfqId: savedRFQ2._id,
      eventType: "AUCTION_EXTENDED",
      description: "New bid received from Supplier A",
      metadata: {
        previousCloseTime: savedRFQ2.bidCloseTime,
        newCloseTime: savedRFQ2.currentBidCloseTime,
        extensionCount: savedRFQ2.extensionCount,
      },
      timestamp: extensionLogTime,
    },
    {
      rfqId: savedRFQ3._id,
      eventType: "NO_ACTIVITY_WARNING",
      description: "Auction is scheduled and awaiting supplier participation",
      metadata: {
        status: savedRFQ3.status,
      },
      timestamp: new Date(now.getTime() - 5 * 60 * 1000),
    },
  ]);
}

/**
 * Executes the seed workflow and closes the database connection afterward.
 *
 * @returns {Promise<void>} Resolves when the script finishes.
 */
async function runSeed() {
  try {
    await connectDB();
    await seed();
    console.info("Seed data inserted successfully");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Seed script failed", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runSeed();
