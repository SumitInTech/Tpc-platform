const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MONGODB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MONGODB_ERROR] Error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MONGODB] Disconnected from database');
});

module.exports = { connectDB };
