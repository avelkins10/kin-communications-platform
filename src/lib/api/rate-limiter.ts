import pLimit from 'p-limit';

/**
 * Rate limiter for external API calls
 * Provides concurrency control and rate limiting for external services
 */
export class RateLimiter {
  private limiters: Map<string, pLimit.Limit> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Get or create a concurrency limiter for a service
   */
  getConcurrencyLimiter(service: string, concurrency: number = 5): pLimit.Limit {
    const key = `concurrency:${service}`;
    if (!this.limiters.has(key)) {
      this.limiters.set(key, pLimit(concurrency));
    }
    return this.limiters.get(key)!;
  }

  /**
   * Check if rate limit is exceeded for a service
   */
  isRateLimited(service: string, maxRequests: number, windowMs: number): boolean {
    const key = `rate:${service}`;
    const now = Date.now();
    const current = this.requestCounts.get(key);

    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return false;
    }

    if (current.count >= maxRequests) {
      return true;
    }

    // Increment count
    current.count++;
    return false;
  }

  /**
   * Get time until rate limit resets
   */
  getTimeUntilReset(service: string): number {
    const key = `rate:${service}`;
    const current = this.requestCounts.get(key);
    if (!current) return 0;
    return Math.max(0, current.resetTime - Date.now());
  }

  /**
   * Wait for rate limit to reset
   */
  async waitForRateLimit(service: string): Promise<void> {
    const waitTime = this.getTimeUntilReset(service);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Pre-configured limiters for common services
export const serviceLimiters = {
  // Twilio API limits
  twilio: {
    concurrency: 10, // Max 10 concurrent requests
    rateLimit: {
      voice: { maxRequests: 1, windowMs: 1000 }, // 1 call per second
      sms: { maxRequests: 1, windowMs: 1000 }, // 1 SMS per second
      taskrouter: { maxRequests: 100, windowMs: 1000 }, // 100 requests per second
      api: { maxRequests: 100, windowMs: 1000 }, // 100 API requests per second
    }
  },
  
  // Quickbase API limits
  quickbase: {
    concurrency: 5, // Max 5 concurrent requests
    rateLimit: {
      queries: { maxRequests: 10, windowMs: 1000 }, // 10 queries per second
      records: { maxRequests: 5, windowMs: 1000 }, // 5 record operations per second
      reports: { maxRequests: 2, windowMs: 1000 }, // 2 reports per second
    }
  },

  // Database limits
  database: {
    concurrency: 20, // Max 20 concurrent queries
    rateLimit: {
      queries: { maxRequests: 100, windowMs: 1000 }, // 100 queries per second
    }
  },

};

/**
 * Execute a function with rate limiting and concurrency control
 */
export async function withRateLimit<T>(
  service: string,
  operation: string,
  fn: () => Promise<T>,
  options?: {
    concurrency?: number;
    maxRequests?: number;
    windowMs?: number;
    retries?: number;
    retryDelay?: number;
  }
): Promise<T> {
  const config = serviceLimiters[service as keyof typeof serviceLimiters];
  if (!config) {
    throw new Error(`Unknown service: ${service}`);
  }

  const operationConfig = config.rateLimit[operation as keyof typeof config.rateLimit];
  if (!operationConfig) {
    throw new Error(`Unknown operation: ${operation} for service: ${service}`);
  }

  const {
    concurrency = config.concurrency,
    maxRequests = operationConfig.maxRequests,
    windowMs = operationConfig.windowMs,
    retries = 3,
    retryDelay = 1000
  } = options || {};

  const concurrencyLimiter = rateLimiter.getConcurrencyLimiter(service, concurrency);
  
  return concurrencyLimiter(async () => {
    let attempts = 0;
    
    while (attempts < retries) {
      // Check rate limit
      if (rateLimiter.isRateLimited(service, maxRequests, windowMs)) {
        await rateLimiter.waitForRateLimit(service);
      }

      try {
        return await fn();
      } catch (error: any) {
        attempts++;
        
        // Check if it's a rate limit error
        if (error.code === 20429 || error.status === 429) {
          // Twilio rate limit error
          const resetTime = error.resetTime || (Date.now() + 60000); // Default 1 minute
          const waitTime = resetTime - Date.now();
          
          if (waitTime > 0 && attempts < retries) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        if (attempts >= retries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
      }
    }
    
    throw new Error('Max retries exceeded');
  });
}

/**
 * Create a rate-limited function wrapper
 */
export function createRateLimitedFunction<T extends (...args: any[]) => Promise<any>>(
  service: string,
  operation: string,
  fn: T,
  options?: Parameters<typeof withRateLimit>[3]
): T {
  return (async (...args: Parameters<T>) => {
    return withRateLimit(service, operation, () => fn(...args), options);
  }) as T;
}
