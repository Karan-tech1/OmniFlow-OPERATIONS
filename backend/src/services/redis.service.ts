import { Redis } from 'ioredis';
import { logger } from '../utils/logger.js';

class RedisCacheService {
  private client: Redis | null = null;
  private memoryCache = new Map<string, { value: string; expiresAt: number }>();
  private isRedisConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.client = new Redis(redisUrl, {
          retryStrategy: (times) => Math.min(times * 100, 3000),
          maxRetriesPerRequest: 1,
        });

        this.client.on('connect', () => {
          this.isRedisConnected = true;
          logger.info('[Redis] Connected to Redis server');
        });

        this.client.on('error', (err) => {
          this.isRedisConnected = false;
          logger.warn(`[Redis] Connection warning: ${err.message}. Using fallback in-memory cache.`);
        });
      } catch (err) {
        logger.warn('[Redis] Failed to initialize Redis. Falling back to in-memory cache.');
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisConnected && this.client) {
        const val = await this.client.get(key);
        return val ? JSON.parse(val) : null;
      }
    } catch {
      // Fallback
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return JSON.parse(item.value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    const serialized = JSON.stringify(value);
    try {
      if (this.isRedisConnected && this.client) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
        return;
      }
    } catch {
      // Fallback
    }

    this.memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(keyPattern: string): Promise<void> {
    try {
      if (this.isRedisConnected && this.client) {
        const keys = await this.client.keys(`*${keyPattern}*`);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }
    } catch {
      // Fallback
    }

    for (const key of this.memoryCache.keys()) {
      if (key.includes(keyPattern)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const redisCache = new RedisCacheService();
