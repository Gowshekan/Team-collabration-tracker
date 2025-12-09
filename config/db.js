const mongoose = require('mongoose');

/**
 * Connect to MongoDB using MONGODB_URI from environment.
 * Includes simple retry logic and helpful logging for Atlas.
 */
async function connectDB(maxRetries = 3) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI environment variable is not set — skipping MongoDB connection.');
    return Promise.resolve();
  }

  // No special options required for modern Mongoose versions; keep defaults.
  const options = {};

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await mongoose.connect(uri, options);
      console.log('MongoDB connected successfully');
      // Optional: attach connection events
      mongoose.connection.on('error', err => console.error('MongoDB connection error:', err));
      mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
      return;
    } catch (err) {
      attempt += 1;
      console.error(`MongoDB connection attempt ${attempt} failed:`, err.message || err);
      if (attempt >= maxRetries) {
        console.error('Max MongoDB connection attempts reached. Exiting.');
        throw err;
      }
      // wait before retrying (exponential backoff)
      const waitMs = 1000 * Math.pow(2, attempt);
      await new Promise(res => setTimeout(res, waitMs));
    }
  }
}

module.exports = connectDB;
