import { create } from "zustand";
import { createRFQ, getRFQById, listRFQs } from "../api/rfq.api";
import { submitBid } from "../api/bid.api";

/**
 * Creates a synthetic log entry from an extension socket payload.
 *
 * @param {object} payload - The extension socket payload.
 * @returns {object} The normalized log entry.
 */
function buildExtensionLog(payload) {
  return {
    _id: `extension-${payload.rfqId}-${payload.newCloseTime}`,
    eventType: "AUCTION_EXTENDED",
    description: payload.reason,
    metadata: {
      previousCloseTime: payload.previousCloseTime,
      newCloseTime: payload.newCloseTime,
      extensionCount: payload.extensionCount,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a normalized UI error object.
 *
 * @param {unknown} error - The thrown error value.
 * @returns {{ error: string, code: string }} The normalized error shape.
 */
function normalizeError(error) {
  return {
    error: error?.error || error?.message || "Something went wrong",
    code: error?.code || "UNKNOWN_ERROR",
  };
}

const useAuctionStore = create((set, get) => ({
  rfqs: [],
  currentRFQ: null,
  bids: [],
  logs: [],
  l1PriceHistory: [],
  activeBidderCount: 0,
  isLoading: false,
  error: null,
  toasts: [],

  /**
   * Fetches all RFQs and stores them in the list view state.
   *
   * @returns {Promise<Array<object>>} The fetched RFQs.
   */
  fetchRFQs: async () => {
    set({ isLoading: true, error: null });

    try {
      const rfqs = await listRFQs();
      set({ rfqs, isLoading: false });
      return rfqs;
    } catch (error) {
      const normalizedError = normalizeError(error);
      set({ error: normalizedError, isLoading: false });
      throw normalizedError;
    }
  },

  /**
   * Fetches a single RFQ detail payload and stores it in detail view state.
   *
   * @param {string} id - The RFQ identifier.
   * @returns {Promise<object>} The fetched RFQ detail payload.
   */
  fetchRFQById: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const data = await getRFQById(id);
      set({
        currentRFQ: data.rfq,
        bids: data.bids,
        logs: data.logs,
        l1PriceHistory: data.l1PriceHistory,
        isLoading: false,
      });
      return data;
    } catch (error) {
      const normalizedError = normalizeError(error);
      set({ error: normalizedError, isLoading: false });
      throw normalizedError;
    }
  },

  /**
   * Creates a new RFQ and prepends it to the list state.
   *
   * @param {object} data - The RFQ creation payload.
   * @returns {Promise<object>} The created RFQ document.
   */
  createRFQ: async (data) => {
    set({ error: null });

    try {
      const result = await createRFQ(data);
      set((state) => ({
        rfqs: [result, ...state.rfqs],
      }));
      return result;
    } catch (error) {
      const normalizedError = normalizeError(error);
      set({ error: normalizedError });
      throw normalizedError;
    }
  },

  /**
   * Submits a bid and returns the API response without mutating bid state directly.
   *
   * @param {string} rfqId - The RFQ identifier.
   * @param {object} data - The bid submission payload.
   * @returns {Promise<object>} The bid submission result.
   */
  submitBid: async (rfqId, data) => {
    set({ error: null });

    try {
      return await submitBid(rfqId, data);
    } catch (error) {
      const normalizedError = normalizeError(error);
      set({ error: normalizedError });
      throw normalizedError;
    }
  },

  /**
   * Updates live bid data from a socket payload.
   *
   * @param {{ bids: Array<object>, activeBidderCount: number }} payload - The bid socket payload.
   * @returns {void} Updates the store state.
   */
  updateBids: (payload) => {
    set((state) => ({
      bids: payload.bids,
      activeBidderCount: payload.activeBidderCount,
      currentRFQ: state.currentRFQ
        ? {
            ...state.currentRFQ,
            status:
              state.currentRFQ.status === "closed" || state.currentRFQ.status === "force_closed"
                ? state.currentRFQ.status
                : state.currentRFQ.status,
          }
        : state.currentRFQ,
    }));
  },

  /**
   * Handles an auction extension event by updating RFQ state, logs, and toasts.
   *
   * @param {object} payload - The extension socket payload.
   * @returns {void} Updates the store state.
   */
  onAuctionExtended: (payload) => {
    const toast = {
      id: `${payload.rfqId}-${payload.newCloseTime}`,
      type: "extension",
      message: payload.reason,
      detail: payload.newCloseTime,
    };
    const extensionLog = buildExtensionLog(payload);

    set((state) => ({
      currentRFQ: state.currentRFQ
        ? {
            ...state.currentRFQ,
            currentBidCloseTime: payload.newCloseTime,
            extensionCount: payload.extensionCount,
            status: "extended",
          }
        : state.currentRFQ,
      rfqs: state.rfqs.map((rfq) =>
        rfq._id === payload.rfqId
          ? {
              ...rfq,
              currentBidCloseTime: payload.newCloseTime,
              extensionCount: payload.extensionCount,
              status: "extended",
            }
          : rfq
      ),
      logs: [extensionLog, ...state.logs],
      toasts: [...state.toasts, toast],
    }));
  },

  /**
   * Updates the current RFQ status in detail and list state.
   *
   * @param {string} status - The next RFQ status.
   * @returns {void} Updates the store state.
   */
  updateStatus: (status) => {
    set((state) => ({
      currentRFQ: state.currentRFQ ? { ...state.currentRFQ, status } : state.currentRFQ,
      rfqs: state.rfqs.map((rfq) =>
        state.currentRFQ && rfq._id === state.currentRFQ._id ? { ...rfq, status } : rfq
      ),
    }));
  },

  /**
   * Updates the live active bidder count.
   *
   * @param {number} count - The active bidder count.
   * @returns {void} Updates the store state.
   */
  updateBidderCount: (count) => {
    set({ activeBidderCount: count });
  },

  /**
   * Adds a toast notification to the UI queue.
   *
   * @param {{ id: string, type: string, message: string, detail: string }} toast - The toast payload.
   * @returns {void} Updates the store state.
   */
  addToast: (toast) => {
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
  },

  /**
   * Removes a toast notification from the UI queue.
   *
   * @param {string} id - The toast identifier.
   * @returns {void} Updates the store state.
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

export default useAuctionStore;
