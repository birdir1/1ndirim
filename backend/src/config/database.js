const { Pool } = require('pg');
require('dotenv').config();

// Connection pool configuration
// Optimized for production performance
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'indirim_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum number of clients in the pool
  min: parseInt(process.env.DB_POOL_MIN) || 5,  // Minimum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000, // Return error after 10 seconds if connection cannot be established
  
  // Query timeout
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000, // Cancel queries after 30 seconds
  
  // Keep alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Connection event handlers
pool.on('connect', (client) => {
  console.log('✅ PostgreSQL bağlantısı başarılı');
  
  // Set timezone for this connection
  client.query('SET timezone = "UTC"');
});

pool.on('acquire', (client) => {
  // Log when a client is acquired from the pool (optional, for debugging)
  // console.log('🔵 Client acquired from pool');
});

pool.on('remove', (client) => {
  // Log when a client is removed from the pool (optional, for debugging)
  // console.log('🔴 Client removed from pool');
});

pool.on('error', (err, client) => {
  console.error('❌ PostgreSQL bağlantı hatası:', err);
  console.error('Client:', client ? 'Active' : 'Idle');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Shutting down gracefully...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

module.exports = pool;
