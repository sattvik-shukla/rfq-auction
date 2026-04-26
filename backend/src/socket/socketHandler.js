/**
 * Emits the active bidder count for a single auction room.
 *
 * @param {object} io - The Socket.io server instance.
 * @param {string} rfqId - The RFQ room identifier.
 * @returns {void} Broadcasts the room member count.
 */
function emitBidderCount(io, rfqId) {
  const count = io.sockets.adapter.rooms.get(rfqId)?.size || 0;

  io.to(rfqId).emit("bidder:count", {
    rfqId,
    count,
  });
}

/**
 * Registers Socket.io auction room listeners.
 *
 * @param {object} io - The Socket.io server instance.
 * @returns {void} Attaches socket listeners.
 */
function socketHandler(io) {
  io.on("connection", (socket) => {
    socket.data.auctionRooms = new Set();

    socket.on("join:auction", ({ rfqId }) => {
      if (!rfqId) {
        return;
      }

      const roomId = rfqId.toString();
      socket.join(roomId);
      socket.data.auctionRooms.add(roomId);
      emitBidderCount(io, roomId);
    });

    socket.on("leave:auction", ({ rfqId }) => {
      if (!rfqId) {
        return;
      }

      const roomId = rfqId.toString();
      socket.leave(roomId);
      socket.data.auctionRooms.delete(roomId);
      emitBidderCount(io, roomId);
    });

    socket.on("disconnect", () => {
      for (const roomId of socket.data.auctionRooms) {
        emitBidderCount(io, roomId);
      }
    });
  });
}

module.exports = socketHandler;
