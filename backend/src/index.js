require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const rfqRouter = require("./routes/rfq.routes");
const bidRouter = require("./routes/bid.routes");
const socketHandler = require("./socket/socketHandler");
const errorHandler = require("./middleware/errorHandler");
const { runAuctionScheduler } = require("./services/auction.service");

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
  },
});

app.use(
  cors({
    origin: FRONTEND_URL,
  })
);
app.use(express.json());

app.use("/api/rfqs", rfqRouter);
app.use("/api/rfqs/:id/bids", bidRouter(io));

app.use(errorHandler);

socketHandler(io);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    runAuctionScheduler(io);
  });
});
