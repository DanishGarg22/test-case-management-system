import { redis } from "./redis"

interface RateLimitConfig {
  interval: number // in seconds
  limit: number // max requests
}

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  auth: { interval: 15 * 60, limit: 5 }, // 5 requests per 15 minutes
  testcase: { interval: 60 * 60, limit: 100 }, // 100 requests per hour
  execution: { interval: 60 * 60, limit: 200 }, // 200 requests per hour
  analytics: { interval: 60 * 60, limit: 50 }, // 50 requests per hour
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const key = `rate_limit:${identifier}`

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, config.interval)
    }

    const ttl = await redis.ttl(key)
    const remaining = Math.max(0, config.limit - current)

    return {
      success: current <= config.limit,
      remaining,
      reset: Date.now() + ttl * 1000,
    }
  } catch (error) {
    console.error("[v0] Rate limit error:", error)
    // On error, allow the request
    return { success: true, remaining: config.limit, reset: Date.now() + config.interval * 1000 }
  }
}
