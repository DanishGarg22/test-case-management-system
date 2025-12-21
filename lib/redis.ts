// lib/redis.ts
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Redis environment variables are not set");
  }

  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redis;
}

// Cache helper functions
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      return await getRedis().get<T>(key);
    } catch (error) {
      console.error("[Redis get error]:", error);
      return null;
    }
  },

  async set(key: string, value: any, expirationSeconds: number): Promise<void> {
    try {
      await getRedis().setex(key, expirationSeconds, JSON.stringify(value));
    } catch (error) {
      console.error("[Redis set error]:", error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await getRedis().del(key);
    } catch (error) {
      console.error("[Redis delete error]:", error);
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await getRedis().keys(pattern);
      if (keys.length > 0) {
        await getRedis().del(...keys);
      }
    } catch (error) {
      console.error("[Redis delete pattern error]:", error);
    }
  },
};

// Cache duration constants
export const CACHE_DURATION = {
  ANALYTICS: 15 * 60,
  TEST_SUITES: 30 * 60,
  PROJECT_METADATA: 60 * 60,
  TEST_CASES: 10 * 60,
};
