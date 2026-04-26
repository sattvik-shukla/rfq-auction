import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import useAuctionStore from "../store/useAuctionStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/**
 * Connects to the auction socket room and wires live updates into the store.
 *
 * @param {string|undefined} rfqId - The RFQ room identifier.
 * @returns {{ isConnected: boolean }} The socket connection state.
 */
export default function useSocket(rfqId) {
  const [isConnected, setIsConnected] = useState(false);
  const updateBids = useAuctionStore((state) => state.updateBids);
  const onAuctionExtended = useAuctionStore((state) => state.onAuctionExtended);
  const updateStatus = useAuctionStore((state) => state.updateStatus);
  const updateBidderCount = useAuctionStore((state) => state.updateBidderCount);

  useEffect(() => {
    if (!rfqId) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    /**
     * Marks the socket as connected and joins the requested auction room.
     *
     * @returns {void} Emits the join event.
     */
    function handleConnect() {
      setIsConnected(true);
      socket.emit("join:auction", { rfqId });
    }

    /**
     * Marks the socket as disconnected.
     *
     * @returns {void} Updates local connection state.
     */
    function handleDisconnect() {
      setIsConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("bid:new", updateBids);
    socket.on("auction:extended", onAuctionExtended);
    socket.on("auction:closed", () => updateStatus("closed"));
    socket.on("auction:force_closed", () => updateStatus("force_closed"));
    socket.on("bidder:count", (payload) => updateBidderCount(payload.count));

    return () => {
      socket.emit("leave:auction", { rfqId });
      socket.disconnect();
    };
  }, [onAuctionExtended, rfqId, updateBidderCount, updateBids, updateStatus]);

  return { isConnected };
}
