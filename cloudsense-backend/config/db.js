const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB with embedded MongoMemoryServer fallback
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  try {
    if (uri && !uri.includes('<user>')) {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      logger.info(`MongoDB connected: ${conn.connection.host}`);
      return;
    }
  } catch (error) {
    logger.warn(`Primary MongoDB URI unreachable (${error.message}). Starting embedded MongoMemoryServer...`);
  }

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
    const conn = await mongoose.connect(uri);
    logger.info(`Embedded MongoDB Memory Server connected: ${conn.connection.host}`);
  } catch (fallbackError) {
    logger.error(`MongoDB connection error: ${fallbackError.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

