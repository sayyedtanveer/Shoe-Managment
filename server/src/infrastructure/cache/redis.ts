import { createClient, RedisClientType } from 'redis';
import logger from '@core/logger';

let redisClient: RedisClientType;

export async function connectRedis(): Promise<RedisClientType> {
    if (redisClient) return redisClient;

    redisClient = createClient({
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    }) as RedisClientType;

    redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
    redisClient.on('connect', () => logger.info('Redis connected'));
    redisClient.on('reconnecting', () => logger.warn('Redis reconnecting…'));

    await redisClient.connect();
    return redisClient;
}

export function getRedis(): RedisClientType {
    if (!redisClient) {
        throw new Error('Redis client is not initialised. Call connectRedis() first.');
    }
    return redisClient;
}

export default {
    connectRedis,
    getRedis,
};
