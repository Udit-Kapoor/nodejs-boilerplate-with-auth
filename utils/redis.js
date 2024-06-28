const { createClient } = require('redis');
const env = require('dotenv').config();

let client = null;
try {
  // 1) Try creating a client
  client = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    connect_timeout: 60 * 1000, // Connection timeout in milliseconds (5 seconds)
    retry_strategy: function (options) {
      if (options.error && options.error.code === 'ETIMEDOUT') {
        // Retry connection if timeout error occurs
        console.error('Redis connection timeout occurred');
        return 5000; // Retry after 5 seconds
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        // Stop retrying after 1 hour
        return new Error('Retry time exhausted');
      }
      if (options.attempt > 10) {
        // Stop retrying after 10 attempts
        return new Error('Max number of attempts reached');
      }
      // Retry with exponential backoff strategy
      return Math.min(options.attempt * 100, 3000);
    },
    // Socket timeout (also known as "idle" timeout)
    retry_unfulfilled_commands: true, // Retry commands that were sent before the connection was lost
    socket_keepalive: true, // Enable TCP keep-alive for socket connections
    enable_offline_queue: true, // Enable the offline queue for commands issued while the connection is offline
  });

  // 2. Connect the redis client
  client.connect().then(() => {
    console.log('redis connected');
  });
} catch (error) {
  console.log(error);
}

module.exports = client;
