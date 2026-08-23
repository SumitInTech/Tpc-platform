const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const http = require('http');
const app = require('./app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);


const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);
async function startServer() {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`[SERVER] Running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
    });
  } catch (error) {
    console.error('[SERVER_ERROR] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
