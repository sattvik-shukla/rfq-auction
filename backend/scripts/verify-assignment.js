require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const rfqService = require("../src/services/rfq.service");
const bidService = require("../src/services/bid.service");
const { runAuctionScheduler } = require("../src/services/auction.service");
const RFQ = require("../src/models/RFQ.model");
const Bid = require("../src/models/Bid.model");
const AuctionLog = require("../src/models/AuctionLog.model");

function createIoMock() {
  const events = [];
  const roomSizes = new Map();

  return {
    events,
    sockets: {
      adapter: {
        rooms: {
          get: (id) => roomSizes.get(id),
        },
      },
    },
    to(roomId) {
      return {
        emit(event, payload) {
          events.push({ roomId, event, payload });
        },
      };
    },
  };
}

async function cleanup(prefix) {
  const rfqs = await RFQ.find({ name: new RegExp(`^${prefix}`) }).select("_id").lean();
  const ids = rfqs.map((rfq) => rfq._id);

  if (!ids.length) {
    return;
  }

  await Bid.deleteMany({ rfqId: { $in: ids } });
  await AuctionLog.deleteMany({ rfqId: { $in: ids } });
  await RFQ.deleteMany({ _id: { $in: ids } });
}

function printResult(result) {
  const marker = result.pass ? "[PASS]" : "[FAIL]";
  console.log(`${marker} ${result.case} -> ${result.detail}`);
}

async function run() {
  const prefix = "VERIFY_CASE";
  const io = createIoMock();
  const results = [];
  let schedulerInterval;

  try {
    await connectDB();
    await cleanup(prefix);

    try {
      await rfqService.createRFQ({
        name: `${prefix}_INVALID_DATES`,
        pickupDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        bidStartTime: new Date(Date.now() + 3600000).toISOString(),
        bidCloseTime: new Date(Date.now() + 7200000).toISOString(),
        forcedBidCloseTime: new Date(Date.now() + 7200000).toISOString(),
        britishAuctionConfig: {
          triggerWindowMinutes: 10,
          extensionDurationMinutes: 5,
          extensionTrigger: "BID_RECEIVED",
          minimumDecrementType: "NONE",
          minimumDecrementValue: 0,
          maxExtensions: 0,
        },
      });
      results.push({
        case: "invalid_dates",
        pass: false,
        detail: "expected INVALID_DATES",
      });
    } catch (error) {
      results.push({
        case: "invalid_dates",
        pass: error.code === "INVALID_DATES",
        detail: error.code || error.message,
      });
    }

    const now = Date.now();
    const rfqCap = await rfqService.createRFQ({
      name: `${prefix}_FORCED_CAP`,
      pickupDate: new Date(now + 7 * 86400000).toISOString(),
      bidStartTime: new Date(now - 3600000).toISOString(),
      bidCloseTime: new Date(now + 2 * 60000).toISOString(),
      forcedBidCloseTime: new Date(now + 4 * 60000).toISOString(),
      britishAuctionConfig: {
        triggerWindowMinutes: 10,
        extensionDurationMinutes: 5,
        extensionTrigger: "BID_RECEIVED",
        minimumDecrementType: "NONE",
        minimumDecrementValue: 0,
        maxExtensions: 0,
      },
    });

    await bidService.submitBid(
      rfqCap._id.toString(),
      {
        supplierName: "Supplier A",
        carrierName: "Carrier A",
        charges: { freight: 1000, origin: 100, destination: 100 },
        transitDays: 2,
        quoteValidity: new Date(now + 9 * 86400000).toISOString(),
      },
      io
    );

    const capAfter = await RFQ.findById(rfqCap._id).lean();
    results.push({
      case: "forced_close_cap",
      pass:
        new Date(capAfter.currentBidCloseTime).getTime() ===
        new Date(rfqCap.forcedBidCloseTime).getTime(),
      detail: `current=${new Date(capAfter.currentBidCloseTime).toISOString()} forced=${new Date(
        rfqCap.forcedBidCloseTime
      ).toISOString()}`,
    });

    const rfqL1 = await rfqService.createRFQ({
      name: `${prefix}_L1_SAME_SUPPLIER`,
      pickupDate: new Date(now + 7 * 86400000).toISOString(),
      bidStartTime: new Date(now - 3600000).toISOString(),
      bidCloseTime: new Date(now + 8 * 60000).toISOString(),
      forcedBidCloseTime: new Date(now + 30 * 60000).toISOString(),
      britishAuctionConfig: {
        triggerWindowMinutes: 10,
        extensionDurationMinutes: 5,
        extensionTrigger: "L1_RANK_CHANGE",
        minimumDecrementType: "NONE",
        minimumDecrementValue: 0,
        maxExtensions: 0,
      },
    });

    await bidService.submitBid(
      rfqL1._id.toString(),
      {
        supplierName: "Supplier A",
        carrierName: "Carrier A",
        charges: { freight: 1000, origin: 100, destination: 100 },
        transitDays: 2,
        quoteValidity: new Date(now + 9 * 86400000).toISOString(),
      },
      io
    );

    const beforeL1Time = (await RFQ.findById(rfqL1._id).lean()).currentBidCloseTime;
    const resL1 = await bidService.submitBid(
      rfqL1._id.toString(),
      {
        supplierName: "Supplier A",
        carrierName: "Carrier A",
        charges: { freight: 900, origin: 100, destination: 100 },
        transitDays: 2,
        quoteValidity: new Date(now + 9 * 86400000).toISOString(),
      },
      io
    );
    const afterL1 = await RFQ.findById(rfqL1._id).lean();
    results.push({
      case: "l1_same_supplier_no_extension",
      pass:
        resL1.extensionResult.extended === false &&
        new Date(afterL1.currentBidCloseTime).getTime() ===
          new Date(beforeL1Time).getTime(),
      detail: JSON.stringify(resL1.extensionResult),
    });

    const rfqL1First = await rfqService.createRFQ({
      name: `${prefix}_L1_FIRST_BID`,
      pickupDate: new Date(now + 7 * 86400000).toISOString(),
      bidStartTime: new Date(now - 3600000).toISOString(),
      bidCloseTime: new Date(now + 2 * 60000).toISOString(),
      forcedBidCloseTime: new Date(now + 20 * 60000).toISOString(),
      britishAuctionConfig: {
        triggerWindowMinutes: 10,
        extensionDurationMinutes: 5,
        extensionTrigger: "L1_RANK_CHANGE",
        minimumDecrementType: "NONE",
        minimumDecrementValue: 0,
        maxExtensions: 0,
      },
    });

    const l1FirstBefore = (await RFQ.findById(rfqL1First._id).lean()).currentBidCloseTime;
    const l1FirstResult = await bidService.submitBid(
      rfqL1First._id.toString(),
      {
        supplierName: "Supplier A",
        carrierName: "Carrier A",
        charges: { freight: 1000, origin: 100, destination: 100 },
        transitDays: 2,
        quoteValidity: new Date(now + 9 * 86400000).toISOString(),
      },
      io
    );
    const l1FirstAfter = await RFQ.findById(rfqL1First._id).lean();
    results.push({
      case: "l1_first_bid_no_extension",
      pass:
        l1FirstResult.extensionResult.extended === false &&
        new Date(l1FirstAfter.currentBidCloseTime).getTime() ===
          new Date(l1FirstBefore).getTime(),
      detail: JSON.stringify(l1FirstResult.extensionResult),
    });

    const rfqRank = await rfqService.createRFQ({
      name: `${prefix}_ANY_RANK_CHANGE`,
      pickupDate: new Date(now + 7 * 86400000).toISOString(),
      bidStartTime: new Date(now - 3600000).toISOString(),
      bidCloseTime: new Date(now + 20 * 60000).toISOString(),
      forcedBidCloseTime: new Date(now + 40 * 60000).toISOString(),
      britishAuctionConfig: {
        triggerWindowMinutes: 10,
        extensionDurationMinutes: 5,
        extensionTrigger: "ANY_RANK_CHANGE",
        minimumDecrementType: "NONE",
        minimumDecrementValue: 0,
        maxExtensions: 0,
      },
    });

    await bidService.submitBid(
      rfqRank._id.toString(),
      {
        supplierName: "Supplier A",
        carrierName: "Carrier A",
        charges: { freight: 1000, origin: 100, destination: 100 },
        transitDays: 2,
        quoteValidity: new Date(now + 9 * 86400000).toISOString(),
      },
      io
    );

    await RFQ.findByIdAndUpdate(rfqRank._id, {
      currentBidCloseTime: new Date(Date.now() + 5 * 60000),
      status: "active",
    });

    const beforeRankTime = (await RFQ.findById(rfqRank._id).lean()).currentBidCloseTime;
    const resRank = await bidService.submitBid(
      rfqRank._id.toString(),
      {
        supplierName: "Supplier A",
        carrierName: "Carrier A",
        charges: { freight: 950, origin: 100, destination: 100 },
        transitDays: 2,
        quoteValidity: new Date(now + 9 * 86400000).toISOString(),
      },
      io
    );
    const afterRank = await RFQ.findById(rfqRank._id).lean();
    results.push({
      case: "any_rank_change_same_supplier_should_not_extend",
      pass:
        resRank.extensionResult.extended === false &&
        new Date(afterRank.currentBidCloseTime).getTime() ===
          new Date(beforeRankTime).getTime(),
      detail: JSON.stringify(resRank.extensionResult),
    });

    const rfqPending = await rfqService.createRFQ({
      name: `${prefix}_PENDING_STATUS`,
      pickupDate: new Date(now + 7 * 86400000).toISOString(),
      bidStartTime: new Date(Date.now() + 1500).toISOString(),
      bidCloseTime: new Date(Date.now() + 15 * 60000).toISOString(),
      forcedBidCloseTime: new Date(Date.now() + 30 * 60000).toISOString(),
      britishAuctionConfig: {
        triggerWindowMinutes: 10,
        extensionDurationMinutes: 5,
        extensionTrigger: "BID_RECEIVED",
        minimumDecrementType: "NONE",
        minimumDecrementValue: 0,
        maxExtensions: 0,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2500));
    const pendingDetail = await rfqService.getRFQById(rfqPending._id.toString());
    results.push({
      case: "pending_auto_activation_on_read",
      pass: pendingDetail.rfq.status === "active",
      detail: `status=${pendingDetail.rfq.status}`,
    });

    const rfqPendingBid = await rfqService.createRFQ({
      name: `${prefix}_PENDING_BID`,
      pickupDate: new Date(now + 7 * 86400000).toISOString(),
      bidStartTime: new Date(Date.now() + 1500).toISOString(),
      bidCloseTime: new Date(Date.now() + 15 * 60000).toISOString(),
      forcedBidCloseTime: new Date(Date.now() + 30 * 60000).toISOString(),
      britishAuctionConfig: {
        triggerWindowMinutes: 10,
        extensionDurationMinutes: 5,
        extensionTrigger: "BID_RECEIVED",
        minimumDecrementType: "NONE",
        minimumDecrementValue: 0,
        maxExtensions: 0,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2500));

    let pendingBidPass = true;
    let pendingBidDetail = "submitted";

    try {
      await bidService.submitBid(
        rfqPendingBid._id.toString(),
        {
          supplierName: "Supplier A",
          carrierName: "Carrier A",
          charges: { freight: 1000, origin: 100, destination: 100 },
          transitDays: 2,
          quoteValidity: new Date(now + 9 * 86400000).toISOString(),
        },
        io
      );
    } catch (error) {
      pendingBidPass = false;
      pendingBidDetail = error.code || error.message;
    }

    results.push({
      case: "pending_auto_activation_on_bid",
      pass: pendingBidPass,
      detail: pendingBidDetail,
    });

    const rfqTie = await rfqService.createRFQ({
      name: `${prefix}_TIE_BREAK`,
      pickupDate: new Date(now + 7 * 86400000).toISOString(),
      bidStartTime: new Date(now - 3600000).toISOString(),
      bidCloseTime: new Date(now + 12 * 60000).toISOString(),
      forcedBidCloseTime: new Date(now + 30 * 60000).toISOString(),
      britishAuctionConfig: {
        triggerWindowMinutes: 10,
        extensionDurationMinutes: 5,
        extensionTrigger: "BID_RECEIVED",
        minimumDecrementType: "NONE",
        minimumDecrementValue: 0,
        maxExtensions: 0,
      },
    });

    await bidService.submitBid(
      rfqTie._id.toString(),
      {
        supplierName: "Supplier Early",
        carrierName: "Carrier E",
        charges: { freight: 1000, origin: 100, destination: 100 },
        transitDays: 2,
        quoteValidity: new Date(now + 9 * 86400000).toISOString(),
      },
      io
    );
    await new Promise((resolve) => setTimeout(resolve, 15));
    await bidService.submitBid(
      rfqTie._id.toString(),
      {
        supplierName: "Supplier Late",
        carrierName: "Carrier L",
        charges: { freight: 1000, origin: 100, destination: 100 },
        transitDays: 2,
        quoteValidity: new Date(now + 9 * 86400000).toISOString(),
      },
      io
    );

    const tieBids = await Bid.find({
      rfqId: rfqTie._id,
      isLatestBySupplier: true,
    })
      .sort({ rank: 1 })
      .lean();

    results.push({
      case: "tie_break_earlier_submission_wins",
      pass:
        tieBids[0]?.supplierName === "Supplier Early" &&
        tieBids[0]?.rank === 1 &&
        tieBids[1]?.rank === 2,
      detail: tieBids.map((bid) => `${bid.supplierName}:${bid.rank}`).join(", "),
    });

    schedulerInterval = runAuctionScheduler(io);

    const rfqScheduler = await rfqService.createRFQ({
      name: `${prefix}_SCHEDULER_PENDING`,
      pickupDate: new Date(now + 7 * 86400000).toISOString(),
      bidStartTime: new Date(Date.now() + 1500).toISOString(),
      bidCloseTime: new Date(Date.now() + 15 * 60000).toISOString(),
      forcedBidCloseTime: new Date(Date.now() + 30 * 60000).toISOString(),
      britishAuctionConfig: {
        triggerWindowMinutes: 10,
        extensionDurationMinutes: 5,
        extensionTrigger: "BID_RECEIVED",
        minimumDecrementType: "NONE",
        minimumDecrementValue: 0,
        maxExtensions: 0,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 11000));
    const schedulerRFQ = await RFQ.findById(rfqScheduler._id).lean();
    results.push({
      case: "pending_auto_activation_on_scheduler",
      pass: schedulerRFQ.status === "active",
      detail: `status=${schedulerRFQ.status}`,
    });

    console.log("\nVerification summary:\n");
    results.forEach(printResult);

    if (results.some((result) => !result.pass)) {
      process.exitCode = 1;
    }
  } finally {
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
    }
    await cleanup(prefix);
    await mongoose.connection.close();
  }
}

run().catch((error) => {
  console.error("Verification script failed", error);
  process.exit(1);
});
