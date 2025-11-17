/**
 * Cache Service for Analytics
 * 
 * Provides in-memory caching with TTL support.
 * Can be easily replaced with Redis in production.
 */

// ============================================================================
// Types
// ============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
}

// ============================================================================
// Cache Service
// ============================================================================

export class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 300) { // Default 5 minutes
    this.cache = new Map();
    this.defaultTTL = defaultTTL;

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || this.defaultTTL;
    const expiresAt = Date.now() + (ttl * 1000);

    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[CacheService] Cleaned up ${cleaned} expired entries`);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let cacheInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService();
  }
  return cacheInstance;
}

// ============================================================================
// Cache Key Generators
// ============================================================================

export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  // Sort keys for consistent cache keys
  const sortedKeys = Object.keys(params).sort();
  const keyParts = sortedKeys.map(key => {
    const value = params[key];
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  });

  return `${prefix}:${keyParts.join(':')}`;
}

export function generateFilterHash(filters?: Record<string, any>): string {
  if (!filters) {
    return 'no-filters';
  }

  // Create a stable hash from filters
  const sortedKeys = Object.keys(filters).sort();
  const filterString = sortedKeys
    .map(key => `${key}=${JSON.stringify(filters[key])}`)
    .join('&');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < filterString.length; i++) {
    const char = filterString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
}
