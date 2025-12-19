import { Redis } from "@upstash/redis"

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  throw new Error("Redis environment variables are not set")
}

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

// Cache helper functions
export const cache = {
  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get<T>(key)
      return data
    } catch (error) {
      console.error("[v0] Redis get error:", error)
      return null
    }
  },

  // Set cached data with expiration (in seconds)
  async set(key: string, value: any, expirationSeconds: number): Promise<void> {
    try {
      await redis.setex(key, expirationSeconds, JSON.stringify(value))
    } catch (error) {
      console.error("[v0] Redis set error:", error)
    }
  },

  // Delete cached data
  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error("[v0] Redis delete error:", error)
    }
  },

  // Delete multiple keys by pattern
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error("[v0] Redis delete pattern error:", error)
    }
  },
}

// Cache duration constants (in seconds)
export const CACHE_DURATION = {
  ANALYTICS: 15 * 60, // 15 minutes
  TEST_SUITES: 30 * 60, // 30 minutes
  PROJECT_METADATA: 60 * 60, // 1 hour
  TEST_CASES: 10 * 60, // 10 minutes
}
