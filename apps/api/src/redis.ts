import Redis from 'ioredis';
import { logger } from './utils/logger';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.error('REDIS_URL is not defined in environment variables.');
  throw new Error('REDIS_URL is not defined.');
}

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  // Add other options as needed from your architecture plan
});

redis.on('error', (err) => {
  logger.error('Redis connection error', { error: err });
});

logger.info('Redis client configured.');
