import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { TypedSocketServer } from './socket.types';

/**
 * Redis configuration for Socket.io adapter
 */
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);

/**
 * Setup Redis adapter for Socket.io
 * Enables horizontal scaling across multiple server instances
 * @param io - Socket.io server instance
 */
export async function setupRedisAdapter(io: TypedSocketServer): Promise<void> {
  try {
    console.log(`📡 Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}...`);

    // Create Redis clients for pub/sub
    const pubClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
      password: REDIS_PASSWORD,
      database: REDIS_DB,
    });

    const subClient = pubClient.duplicate();

    // Error handling
    pubClient.on('error', (err) => {
      console.error('Redis Pub Client Error:', err);
    });

    subClient.on('error', (err) => {
      console.error('Redis Sub Client Error:', err);
    });

    // Connect clients
    await Promise.all([
      pubClient.connect(),
      subClient.connect(),
    ]);

    console.log('✅ Redis clients connected successfully');

    // Create and set adapter
    const adapter = createAdapter(pubClient, subClient);
    io.adapter(adapter);

    console.log('✅ Redis adapter configured for Socket.io');
    console.log('   → Multi-server broadcasting enabled');
  } catch (error) {
    console.error('❌ Failed to setup Redis adapter:', error);
    console.warn('⚠️  Falling back to in-memory adapter');
    console.warn('   → Multi-server broadcasting will NOT work');
    // Don't throw - allow server to continue with in-memory adapter
  }
}

/**
 * Check if Redis is available
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const testClient = createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
      password: REDIS_PASSWORD,
      database: REDIS_DB,
    });

    await testClient.connect();
    await testClient.ping();
    await testClient.quit();

    return true;
  } catch (error) {
    console.error('Redis connection check failed:', error);
    return false;
  }
}
