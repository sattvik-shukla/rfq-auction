const mongoose = require("mongoose");

/**
 * Connects the application to MongoDB using the configured environment URI.
 *
 * @returns {Promise<void>} Resolves once the database connection is established.
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
}

module.exports = connectDB;
