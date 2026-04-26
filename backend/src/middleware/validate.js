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

/**
 * Builds the locked validation error object.
 *
 * @param {string} message - The human-readable validation message.
 * @returns {{ message: string, code: string }} The validation error payload.
 */
function buildValidationError(message) {
  return {
    message,
    code: "VALIDATION_ERROR",
  };
}

/**
 * Checks whether a value is null or undefined.
 *
 * @param {unknown} value - The value to inspect.
 * @returns {boolean} True when the value is missing.
 */
function isMissing(value) {
  return value === undefined || value === null;
}

/**
 * Checks whether a value is a valid date input.
 *
 * @param {unknown} value - The value to inspect.
 * @returns {boolean} True when the value can be converted to a valid date.
 */
function isValidDate(value) {
  return !Number.isNaN(new Date(value).getTime());
}

/**
 * Validates the RFQ creation payload before it reaches the service layer.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - The Express next callback.
 * @returns {void} Proceeds to the next middleware or forwards a validation error.
 */
function validateCreateRFQ(req, res, next) {
  const {
    name,
    bidStartTime,
    bidCloseTime,
    forcedBidCloseTime,
    pickupDate,
    britishAuctionConfig,
  } = req.body;

  if (
    isMissing(name) ||
    isMissing(bidStartTime) ||
    isMissing(bidCloseTime) ||
    isMissing(forcedBidCloseTime) ||
    isMissing(pickupDate) ||
    isMissing(britishAuctionConfig)
  ) {
    return next(buildValidationError("Missing required RFQ fields"));
  }

  if (
    !isValidDate(bidStartTime) ||
    !isValidDate(bidCloseTime) ||
    !isValidDate(forcedBidCloseTime) ||
    !isValidDate(pickupDate)
  ) {
    return next(buildValidationError("RFQ dates must be valid ISO date values"));
  }

  if (
    isMissing(britishAuctionConfig.triggerWindowMinutes) ||
    isMissing(britishAuctionConfig.extensionDurationMinutes) ||
    isMissing(britishAuctionConfig.extensionTrigger) ||
    isMissing(britishAuctionConfig.minimumDecrementType)
  ) {
    return next(buildValidationError("Missing required britishAuctionConfig fields"));
  }

  if (
    !EXTENSION_TRIGGER_VALUES.includes(britishAuctionConfig.extensionTrigger)
  ) {
    return next(buildValidationError("extensionTrigger is invalid"));
  }

  if (
    !MINIMUM_DECREMENT_TYPE_VALUES.includes(
      britishAuctionConfig.minimumDecrementType
    )
  ) {
    return next(buildValidationError("minimumDecrementType is invalid"));
  }

  if (
    !Number.isFinite(Number(britishAuctionConfig.triggerWindowMinutes)) ||
    !Number.isFinite(Number(britishAuctionConfig.extensionDurationMinutes))
  ) {
    return next(
      buildValidationError(
        "triggerWindowMinutes and extensionDurationMinutes must be numbers"
      )
    );
  }

  if (
    !isMissing(britishAuctionConfig.minimumDecrementValue) &&
    !Number.isFinite(Number(britishAuctionConfig.minimumDecrementValue))
  ) {
    return next(buildValidationError("minimumDecrementValue must be a number"));
  }

  if (
    !isMissing(britishAuctionConfig.maxExtensions) &&
    !Number.isFinite(Number(britishAuctionConfig.maxExtensions))
  ) {
    return next(buildValidationError("maxExtensions must be a number"));
  }

  return next();
}

/**
 * Validates the bid submission payload before it reaches the service layer.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - The Express next callback.
 * @returns {void} Proceeds to the next middleware or forwards a validation error.
 */
function validateSubmitBid(req, res, next) {
  const { supplierName, carrierName, charges, transitDays, quoteValidity } = req.body;

  if (
    isMissing(supplierName) ||
    isMissing(carrierName) ||
    isMissing(charges) ||
    isMissing(transitDays) ||
    isMissing(quoteValidity)
  ) {
    return next(buildValidationError("Missing required bid fields"));
  }

  if (
    isMissing(charges.freight) ||
    isMissing(charges.origin) ||
    isMissing(charges.destination)
  ) {
    return next(buildValidationError("charges.freight, charges.origin, and charges.destination are required"));
  }

  if (
    !Number.isFinite(Number(charges.freight)) ||
    Number(charges.freight) <= 0 ||
    !Number.isFinite(Number(charges.origin)) ||
    Number(charges.origin) <= 0 ||
    !Number.isFinite(Number(charges.destination)) ||
    Number(charges.destination) <= 0
  ) {
    return next(buildValidationError("Bid charges must be numbers greater than 0"));
  }

  if (!Number.isFinite(Number(transitDays)) || Number(transitDays) <= 0) {
    return next(buildValidationError("transitDays must be a number greater than 0"));
  }

  if (!isValidDate(quoteValidity) || new Date(quoteValidity) <= new Date()) {
    return next(buildValidationError("quoteValidity must be a valid future date"));
  }

  return next();
}

module.exports = {
  validateCreateRFQ,
  validateSubmitBid,
};
