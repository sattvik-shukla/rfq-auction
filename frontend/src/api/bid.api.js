import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const bidApi = axios.create({
  baseURL: API_BASE_URL,
});

/**
 * Normalizes Axios errors into a simple application-friendly shape.
 *
 * @param {unknown} error - The thrown Axios error.
 * @returns {never} Throws the normalized error payload.
 */
function rethrowApiError(error) {
  if (error?.response?.data) {
    throw error.response.data;
  }

  throw {
    success: false,
    error: error?.message || "Request failed",
    code: "NETWORK_ERROR",
  };
}

/**
 * Submits a bid for a specific RFQ.
 *
 * @param {string} rfqId - The RFQ identifier.
 * @param {object} payload - The bid submission payload.
 * @returns {Promise<object>} The bid submission response data.
 */
export async function submitBid(rfqId, payload) {
  try {
    const response = await bidApi.post(`/rfqs/${rfqId}/bids`, payload);
    return response.data.data;
  } catch (error) {
    rethrowApiError(error);
  }
}

/**
 * Fetches the latest bids for a specific RFQ.
 *
 * @param {string} rfqId - The RFQ identifier.
 * @returns {Promise<Array<object>>} The latest bids.
 */
export async function getBidsByRFQ(rfqId) {
  try {
    const response = await bidApi.get(`/rfqs/${rfqId}/bids`);
    return response.data.data;
  } catch (error) {
    rethrowApiError(error);
  }
}
