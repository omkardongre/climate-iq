/**
 * Unified API Client with caching and rate limiting
 * Handles all external API calls with proper error handling
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresIn: number;
}

class APIClient {
  private cache: Map<string, CacheEntry> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Make a cached API request
   * @param key - Unique cache key
   * @param fetcher - Function that fetches the data
   * @param ttl - Time to live in milliseconds (default: 5 minutes)
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.expiresIn) {
      console.log(`[Cache HIT] ${key}`);
      return cached.data as T;
    }

    // Fetch fresh data
    console.log(`[Cache MISS] ${key}`);
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresIn: ttl,
      });
      return data;
    } catch (error) {
      // Return stale cache if available on error
      if (cached) {
        console.warn(`[Cache STALE] Using stale cache for ${key}`);
        return cached.data as T;
      }
      throw error;
    }
  }

  /**
   * Check rate limit for a service
   * @param service - Service name (e.g., 'openweather')
   * @param maxRequests - Max requests per window
   * @param windowMs - Time window in milliseconds
   */
  checkRateLimit(service: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(service);

    if (!record || now > record.resetTime) {
      // Reset window
      this.requestCounts.set(service, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (record.count >= maxRequests) {
      console.warn(`[Rate Limit] ${service} exceeded ${maxRequests} requests`);
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Clear cache for a specific key or all cache
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const apiClient = new APIClient();

/**
 * Helper function for API routes to handle errors consistently
 */
export function handleAPIError(error: any) {
  console.error('[API Error]', error);

  if (error.response) {
    // External API error
    return {
      error: error.response.data?.message || 'External API error',
      status: error.response.status,
    };
  } else if (error.request) {
    // Network error
    return {
      error: 'Network error - please check your connection',
      status: 503,
    };
  } else {
    // Other errors
    return {
      error: error.message || 'Internal server error',
      status: 500,
    };
  }
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(vars: string[]): { valid: boolean; missing: string[] } {
  const missing = vars.filter((v) => !process.env[v]);
  return {
    valid: missing.length === 0,
    missing,
  };
}
