import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
// For development, you can use Upstash free tier: https://upstash.com/
// Set these environment variables in .env.local:
// UPSTASH_REDIS_REST_URL=your_url
// UPSTASH_REDIS_REST_TOKEN=your_token

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisInstance) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error(
        'Redis configuration missing. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local'
      );
    }

    redisInstance = new Redis({
      url,
      token,
    });
  }

  return redisInstance;
}

export const redis = getRedisClient();

// Queue operations for matching
export class MatchingQueue {
  private redis: Redis;
  private queueKey: string;

  constructor(queueType: 'random' | 'voice' | 'text') {
    this.redis = getRedisClient();
    this.queueKey = `queue:${queueType}`;
  }

  // Add user to waiting queue
  async addToQueue(userId: string): Promise<void> {
    const timestamp = Date.now();
    await this.redis.zadd(this.queueKey, {
      score: timestamp,
      member: userId,
    });
  }

  // Remove user from queue
  async removeFromQueue(userId: string): Promise<void> {
    await this.redis.zrem(this.queueKey, userId);
  }

  // Get oldest waiting user (excluding current user)
  async getMatch(currentUserId: string): Promise<string | null> {
    // Get all users in queue ordered by timestamp
    const users = await this.redis.zrange(this.queueKey, 0, -1) as string[];

    // Find first user that's not the current user
    for (const user of users) {
      if (user !== currentUserId) {
        // Remove matched user from queue
        await this.removeFromQueue(user);
        return user;
      }
    }

    return null;
  }

  // Get queue size
  async getQueueSize(): Promise<number> {
    return await this.redis.zcard(this.queueKey);
  }

  // Clean up old entries (older than 5 minutes)
  async cleanupOldEntries(): Promise<void> {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    await this.redis.zremrangebyscore(this.queueKey, 0, fiveMinutesAgo);
  }
}

// Session management
export class SessionManager {
  private redis: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  // Store session data with TTL
  async setSession(sessionId: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    await this.redis.setex(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
  }

  // Get session data
  async getSession(sessionId: string): Promise<any | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    return data ? JSON.parse(data as string) : null;
  }

  // Delete session
  async deleteSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }

  // Extend session TTL
  async extendSession(sessionId: string, ttlSeconds: number = 3600): Promise<void> {
    await this.redis.expire(`session:${sessionId}`, ttlSeconds);
  }
}

// Rate limiting
export class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  // Check if action is allowed (sliding window)
  async isAllowed(
    identifier: string,
    action: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<boolean> {
    const key = `ratelimit:${action}:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);

    // Count requests in current window
    const count = await this.redis.zcard(key);

    if (count >= maxRequests) {
      return false;
    }

    // Add current request
    await this.redis.zadd(key, {
      score: now,
      member: `${now}`,
    });

    // Set expiry on key
    await this.redis.expire(key, windowSeconds);

    return true;
  }
}

export default getRedisClient;
