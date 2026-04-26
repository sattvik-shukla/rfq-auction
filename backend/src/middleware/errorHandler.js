/**
 * Resolves the HTTP status code for an application error code.
 *
 * @param {string} code - The application error code.
 * @returns {number} The HTTP status code.
 */
function getStatusCode(code) {
  if (code === "RFQ_NOT_FOUND") {
    return 404;
  }

  if (
    code === "AUCTION_CLOSED" ||
    code === "BID_TIME_PASSED" ||
    code === "BELOW_MIN_DECREMENT" ||
    code === "MAX_EXTENSIONS_REACHED" ||
    code === "INVALID_DATES" ||
    code === "INVALID_CONFIG" ||
    code === "VALIDATION_ERROR"
  ) {
    return 400;
  }

  return 500;
}

/**
 * Formats application errors into the locked API response shape.
 *
 * @param {object} err - The thrown application error.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - The Express next callback.
 * @returns {void} Sends the error response.
 */
function errorHandler(err, req, res, next) {
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "An unexpected error occurred";
  const statusCode = getStatusCode(code);

  console.error(err);

  res.status(statusCode).json({
    success: false,
    error: message,
    code,
  });
}

module.exports = errorHandler;
