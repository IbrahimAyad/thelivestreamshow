/**
 * Rate Limiter - Day 10
 *
 * Prevents abuse by limiting action frequency.
 * Uses sliding window algorithm for accurate rate limiting.
 */

export interface RateLimitConfig {
  maxRequests: number;  // Max requests allowed
  windowMs: number;     // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  current: number;
}

/**
 * Sliding window rate limiter
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map(); // key -> timestamps
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if action is allowed and record it
   */
  checkLimit(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this key
    let timestamps = this.requests.get(key) || [];

    // Remove timestamps outside the window
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    const allowed = timestamps.length < this.config.maxRequests;

    if (allowed) {
      // Add current request
      timestamps.push(now);
      this.requests.set(key, timestamps);
    }

    // Calculate remaining requests
    const remaining = Math.max(0, this.config.maxRequests - timestamps.length);

    // Calculate when the limit resets (when oldest request expires)
    const oldestTimestamp = timestamps[0] || now;
    const resetAt = new Date(oldestTimestamp + this.config.windowMs);

    return {
      allowed,
      remaining,
      resetAt,
      current: timestamps.length
    };
  }

  /**
   * Reset limits for a specific key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Reset all limits
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Get current usage for a key
   */
  getUsage(key: string): { current: number; limit: number; remaining: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let timestamps = this.requests.get(key) || [];
    timestamps = timestamps.filter(ts => ts > windowStart);

    return {
      current: timestamps.length,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - timestamps.length)
    };
  }

  /**
   * Cleanup old entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(ts => ts > windowStart);

      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

/**
 * Rate limiter manager for multiple limits
 */
export class RateLimiterManager {
  private limiters: Map<string, RateLimiter> = new Map();

  /**
   * Add a named rate limiter
   */
  addLimiter(name: string, config: RateLimitConfig): void {
    this.limiters.set(name, new RateLimiter(config));
  }

  /**
   * Check rate limit for a named limiter
   */
  checkLimit(limiterName: string, key: string): RateLimitResult {
    const limiter = this.limiters.get(limiterName);

    if (!limiter) {
      throw new Error(`Rate limiter "${limiterName}" not found`);
    }

    return limiter.checkLimit(key);
  }

  /**
   * Get limiter by name
   */
  getLimiter(name: string): RateLimiter | undefined {
    return this.limiters.get(name);
  }

  /**
   * Cleanup all limiters
   */
  cleanup(): void {
    for (const limiter of this.limiters.values()) {
      limiter.cleanup();
    }
  }
}

/**
 * Day 10: Preset rate limiters for AI Coordinator
 */
export function createCoordinatorRateLimiters(): RateLimiterManager {
  const manager = new RateLimiterManager();

  // Day 10 Task 2: Rate limiting requirements
  manager.addLimiter('question_generation', {
    maxRequests: 10,
    windowMs: 60 * 1000  // 10 questions per minute
  });

  manager.addLimiter('mood_changes', {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000  // 30 mood changes per hour
  });

  manager.addLimiter('log_inserts', {
    maxRequests: 100,
    windowMs: 60 * 1000  // 100 log inserts per minute
  });

  // Additional limiters for safety
  manager.addLimiter('api_calls', {
    maxRequests: 50,
    windowMs: 60 * 1000  // 50 API calls per minute
  });

  manager.addLimiter('database_writes', {
    maxRequests: 200,
    windowMs: 60 * 1000  // 200 database writes per minute
  });

  return manager;
}
