const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Formats a numeric amount as Indian Rupees.
 *
 * @param {number|null|undefined} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "₹0";
  }

  return currencyFormatter.format(Number(amount));
}

/**
 * Formats a date or ISO string for auction UI display.
 *
 * @param {string|Date|null|undefined} dateString - The date value to format.
 * @returns {string} The formatted date string.
 */
export function formatDateTime(dateString) {
  if (!dateString) {
    return "Unavailable";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return dateTimeFormatter.format(date);
}

/**
 * Formats a relative time string against the current time.
 *
 * @param {string|Date|null|undefined} dateString - The timestamp to compare.
 * @returns {string} The relative time string.
 */
export function formatRelativeTime(dateString) {
  if (!dateString) {
    return "Unknown";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds} sec ago`;
  }

  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)} min ago`;
  }

  if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)} hr ago`;
  }

  return formatDateTime(dateString);
}

/**
 * Formats a countdown clock with zero-padded units.
 *
 * @param {number} hours - Remaining hours.
 * @param {number} minutes - Remaining minutes.
 * @param {number} seconds - Remaining seconds.
 * @returns {string} The formatted countdown string.
 */
export function formatCountdown(hours, minutes, seconds) {
  return [hours, minutes, seconds]
    .map((value) => String(Math.max(0, value)).padStart(2, "0"))
    .join(":");
}

/**
 * Computes a lightweight auction health score from competition and price movement.
 *
 * @param {Array<{ supplierName: string, totalAmount: number }>} bids - The bids to score.
 * @param {number} extensionCount - The number of applied extensions.
 * @param {number} firstBidAmount - The first bid amount baseline.
 * @returns {{ score: number, label: string, color: string }} The health score payload.
 */
export function computeHealthScore(bids, extensionCount, firstBidAmount) {
  if (!bids.length) {
    return { score: 0, label: "No Bids", color: "gray" };
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
