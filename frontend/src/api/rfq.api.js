import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const rfqApi = axios.create({
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
 * Fetches the RFQ list from the backend API.
 *
 * @returns {Promise<Array<object>>} The RFQ list payload.
 */
export async function listRFQs() {
  try {
    const response = await rfqApi.get("/rfqs");
    return response.data.data;
  } catch (error) {
    rethrowApiError(error);
  }
}

/**
 * Fetches a single RFQ detail payload by identifier.
 *
 * @param {string} id - The RFQ identifier.
 * @returns {Promise<object>} The RFQ detail payload.
 */
export async function getRFQById(id) {
  try {
    const response = await rfqApi.get(`/rfqs/${id}`);
    return response.data.data;
  } catch (error) {
    rethrowApiError(error);
  }
}

/**
 * Creates a new RFQ via the backend API.
 *
 * @param {object} payload - The RFQ creation payload.
 * @returns {Promise<object>} The created RFQ document.
 */
export async function createRFQ(payload) {
  try {
    const response = await rfqApi.post("/rfqs", payload);
    return response.data.data;
  } catch (error) {
    rethrowApiError(error);
  }
}
