const redis = require('redis');
require('dotenv').config();
const isRedisDisabled = process.env.NODE_ENV === 'test' || process.env.REDIS_DISABLED === 'true';

// Redis client configuration
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: Too many reconnection attempts');
        return new Error('Too many reconnection attempts');
      }
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, ...
      return Math.min(retries * 50, 3000);
    },
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: process.env.REDIS_DB || 0,
});

// Event handlers
redisClient.on('connect', () => {
  console.log('🔄 Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Connected and ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

redisClient.on('end', () => {
  console.log('⏹️  Redis: Connection closed');
});

// Connect to Redis unless explicitly disabled (e.g. in tests/CI).
if (!isRedisDisabled) {
  (async () => {
    try {
      await redisClient.connect();
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      console.log('⚠️  Application will continue without cache');
    }
  })();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Closing Redis connection...');
  await redisClient.quit();
  console.log('✅ Redis connection closed');
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Closing Redis connection...');
  await redisClient.quit();
  console.log('✅ Redis connection closed');
});

module.exports = redisClient;
