/**
 * Determines whether a bid was submitted inside the configured trigger window.
 *
 * @param {Date} bidTime - The bid submission time.
 * @param {Date} currentBidCloseTime - The current auction close time.
 * @param {number} triggerWindowMinutes - The number of minutes before close that should trigger monitoring.
 * @returns {boolean} True when the bid falls inside the trigger window.
 */
function isInTriggerWindow(bidTime, currentBidCloseTime, triggerWindowMinutes) {
  const triggerWindowStart = new Date(
    currentBidCloseTime.getTime() - triggerWindowMinutes * 60 * 1000
  );

  return bidTime >= triggerWindowStart;
}

/**
 * Computes a new close time while respecting the hard forced close cap.
 *
 * @param {Date} currentBidCloseTime - The current close time.
 * @param {number} extensionDurationMinutes - The extension duration in minutes.
 * @param {Date} forcedBidCloseTime - The forced close deadline.
 * @returns {Date} The computed next close time.
 */
function computeNewCloseTime(
  currentBidCloseTime,
  extensionDurationMinutes,
  forcedBidCloseTime
) {
  const newTime = new Date(
    currentBidCloseTime.getTime() + extensionDurationMinutes * 60 * 1000
  );

  if (newTime > forcedBidCloseTime) {
    return new Date(forcedBidCloseTime);
  }

  return newTime;
}

/**
 * Decides whether an extension should be triggered for the current bid event.
 *
 * @param {string} extensionTrigger - The configured trigger strategy.
 * @param {{ wasBidReceived: boolean, didAnyRankChange: boolean, didL1Change: boolean }} eventData - Bid event facts.
 * @returns {boolean} True when the configured trigger condition is satisfied.
 */
function shouldExtend(extensionTrigger, eventData) {
  if (extensionTrigger === "BID_RECEIVED") {
    return eventData.wasBidReceived;
  }

  if (extensionTrigger === "ANY_RANK_CHANGE") {
    return eventData.didAnyRankChange;
  }

  if (extensionTrigger === "L1_RANK_CHANGE") {
    return eventData.didL1Change;
  }

  return false;
}

/**
 * Determines whether supplier ranks changed between two latest-bid snapshots.
 *
 * @param {Array<{ supplierName: string, rank?: number, totalAmount: number, submittedAt: Date }>} previousBids - The latest bids before the new submission.
 * @param {Array<{ supplierName: string, rank?: number, totalAmount: number, submittedAt: Date }>} currentBids - The latest bids after the new submission.
 * @returns {boolean} True when at least one supplier's rank changed.
 */
function didSupplierRanksChange(previousBids, currentBids) {
  if (previousBids.length === 0) {
    return false;
  }

  const rankedPreviousBids = computeRanks(previousBids);
  const rankedCurrentBids = computeRanks(currentBids);
  const previousRanks = new Map(
    rankedPreviousBids.map((bid) => [bid.supplierName, bid.rank])
  );
  const currentRanks = new Map(
    rankedCurrentBids.map((bid) => [bid.supplierName, bid.rank])
  );
  const supplierNames = new Set([
    ...previousRanks.keys(),
    ...currentRanks.keys(),
  ]);

  for (const supplierName of supplierNames) {
    if (previousRanks.get(supplierName) !== currentRanks.get(supplierName)) {
      return true;
    }
  }

  return false;
}

/**
 * Computes bid ranks by total amount and submission time.
 *
 * @param {Array<{ _id: string|object, supplierName: string, totalAmount: number, submittedAt: Date }>} bids - The bids to rank.
 * @returns {Array<object>} A new array of bids with rank values applied.
 */
function computeRanks(bids) {
  return [...bids]
    .sort((left, right) => {
      if (left.totalAmount !== right.totalAmount) {
        return left.totalAmount - right.totalAmount;
      }

      return new Date(left.submittedAt).getTime() - new Date(right.submittedAt).getTime();
    })
    .map((bid, index) => ({
      ...bid,
      rank: index + 1,
    }));
}

/**
 * Validates a new bid total against the configured decrement rule.
 *
 * @param {number} newBidTotal - The new bid total amount.
 * @param {number} currentL1Total - The current lowest bid total.
 * @param {string} minimumDecrementType - The decrement validation strategy.
 * @param {number} minimumDecrementValue - The decrement threshold value.
 * @returns {boolean} True when the new bid satisfies the decrement rule.
 */
function isMinimumDecrementValid(
  newBidTotal,
  currentL1Total,
  minimumDecrementType,
  minimumDecrementValue
) {
  if (minimumDecrementType === "NONE") {
    return true;
  }

  if (minimumDecrementType === "PERCENTAGE") {
    const required = currentL1Total * (1 - minimumDecrementValue / 100);
    return newBidTotal <= required;
  }

  if (minimumDecrementType === "FIXED_AMOUNT") {
    return newBidTotal <= currentL1Total - minimumDecrementValue;
  }

  return false;
}

/**
 * Computes the runtime auction status based on the configured timelines.
 *
 * @param {Date} bidStartTime - The bid start time.
 * @param {Date} currentBidCloseTime - The current effective close time.
 * @param {Date} forcedBidCloseTime - The hard close deadline.
 * @param {Date} now - The current evaluation time.
 * @returns {string} The calculated status.
 */
function computeAuctionStatus(
  bidStartTime,
  currentBidCloseTime,
  forcedBidCloseTime,
  now
) {
  if (now < bidStartTime) {
    return "pending";
  }

  if (now >= forcedBidCloseTime) {
    return "force_closed";
  }

  if (now >= currentBidCloseTime) {
    return "closed";
  }

  return "active";
}

/**
 * Builds a human-readable reason for an auction extension.
 *
 * @param {string} extensionTrigger - The configured trigger strategy.
 * @param {string} supplierName - The supplier that submitted the triggering bid.
 * @returns {string} A readable extension reason.
 */
function buildExtensionReason(extensionTrigger, supplierName) {
  if (extensionTrigger === "L1_RANK_CHANGE") {
    return `${supplierName} became the new lowest bidder (L1)`;
  }

  if (extensionTrigger === "ANY_RANK_CHANGE") {
    return `Supplier ranking changed — ${supplierName} submitted a new bid`;
  }

  if (extensionTrigger === "BID_RECEIVED") {
    return `New bid received from ${supplierName}`;
  }

  return `New bid received from ${supplierName}`;
}

/**
 * Computes a simple auction health score from competition, price movement, and extensions.
 *
 * @param {Array<{ supplierName: string, totalAmount: number }>} bids - The latest bids in the auction.
 * @param {number} extensionCount - The number of extensions applied.
 * @param {number} firstBidAmount - The amount of the first bid placed in the auction.
 * @returns {{ score: number, label: string, color: string }} The auction health assessment.
 */
function computeHealthScore(bids, extensionCount, firstBidAmount) {
  if (bids.length === 0) {
    return {
      score: 0,
      label: "No Bids",
      color: "gray",
    };
  }

  const uniqueSuppliers = new Set(bids.map((bid) => bid.supplierName)).size;
  const currentL1 = Math.min(...bids.map((bid) => bid.totalAmount));
  const baselineAmount = firstBidAmount > 0 ? firstBidAmount : currentL1;
  const priceDropPercent =
    baselineAmount > 0 ? ((baselineAmount - currentL1) / baselineAmount) * 100 : 0;

  let score = 0;

  if (uniqueSuppliers >= 4) {
    score += 40;
  } else if (uniqueSuppliers >= 2) {
    score += 20;
  }

  if (priceDropPercent >= 10) {
    score += 40;
  } else if (priceDropPercent >= 5) {
    score += 20;
  }

  if (extensionCount >= 2) {
    score += 20;
  } else if (extensionCount >= 1) {
    score += 10;
  }

  if (score >= 80) {
    return { score, label: "Strong", color: "green" };
  }

  if (score >= 40) {
    return { score, label: "Moderate", color: "yellow" };
  }

  return { score, label: "Weak", color: "red" };
}

module.exports = {
  isInTriggerWindow,
  computeNewCloseTime,
  shouldExtend,
  didSupplierRanksChange,
  computeRanks,
  isMinimumDecrementValid,
  computeAuctionStatus,
  buildExtensionReason,
  computeHealthScore,
};
