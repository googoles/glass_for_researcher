const NodeCache = require('node-cache');

/**
 * CacheService provides in-memory caching for research data
 * with TTL support and automatic cleanup
 */
class CacheService {
  constructor() {
    // Create cache with 10 minute default TTL and 5 minute check period
    this.cache = new NodeCache({ 
      stdTTL: 600, // 10 minutes default
      checkperiod: 300, // Check for expired keys every 5 minutes
      useClones: false // For better performance with large objects
    });
    
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // Listen to cache events for debugging
    this.cache.on('set', (key, value) => {
      this.stats.sets++;
      console.log(`[Cache] Set key: ${key}`);
    });
    
    this.cache.on('del', (key, value) => {
      this.stats.deletes++;
      console.log(`[Cache] Deleted key: ${key}`);
    });
    
    this.cache.on('expired', (key, value) => {
      console.log(`[Cache] Expired key: ${key}`);
    });
  }

  async initialize() {
    console.log('[Cache Service] Initialized');
    
    // Setup periodic stats logging
    setInterval(() => {
      if (this.stats.hits > 0 || this.stats.misses > 0) {
        const hitRate = (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1);
        console.log(`[Cache] Stats - Hits: ${this.stats.hits}, Misses: ${this.stats.misses}, Hit Rate: ${hitRate}%`);
      }
    }, 300000); // Log every 5 minutes
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      const value = this.cache.get(key);
      if (value !== undefined) {
        this.stats.hits++;
        return value;
      } else {
        this.stats.misses++;
        return null;
      }
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = null) {
    try {
      const success = this.cache.set(key, value, ttl || 0);
      return success;
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    try {
      const result = this.cache.del(key);
      return result > 0;
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Existence status
   */
  async has(key) {
    try {
      return this.cache.has(key);
    } catch (error) {
      console.error(`[Cache] Error checking key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async mget(keys) {
    try {
      const result = {};
      for (const key of keys) {
        const value = await this.get(key);
        if (value !== null) {
          result[key] = value;
        }
      }
      return result;
    } catch (error) {
      console.error(`[Cache] Error getting multiple keys:`, error);
      return {};
    }
  }

  /**
   * Set multiple values in cache
   * @param {Object} keyValuePairs - Object with key-value pairs
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async mset(keyValuePairs, ttl = null) {
    try {
      const success = this.cache.mset(
        Object.entries(keyValuePairs).map(([key, value]) => ({
          key,
          val: value,
          ttl: ttl || 0
        }))
      );
      return success;
    } catch (error) {
      console.error(`[Cache] Error setting multiple keys:`, error);
      return false;
    }
  }

  /**
   * Clear all cache entries
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      this.cache.flushAll();
      console.log('[Cache] All entries cleared');
    } catch (error) {
      console.error('[Cache] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats();
    return {
      ...this.stats,
      keys: cacheStats.keys,
      ksize: cacheStats.ksize,
      vsize: cacheStats.vsize
    };
  }

  /**
   * Get all cache keys
   * @returns {string[]} Array of cache keys
   */
  getKeys() {
    return this.cache.keys();
  }

  /**
   * Get cache key with pattern matching
   * @param {string} pattern - Pattern to match (simple string matching)
   * @returns {string[]} Array of matching keys
   */
  getKeysMatching(pattern) {
    return this.cache.keys().filter(key => key.includes(pattern));
  }

  /**
   * Delete cache keys with pattern matching
   * @param {string} pattern - Pattern to match
   * @returns {Promise<number>} Number of deleted keys
   */
  async deleteMatching(pattern) {
    try {
      const matchingKeys = this.getKeysMatching(pattern);
      const deleted = this.cache.del(matchingKeys);
      console.log(`[Cache] Deleted ${deleted} keys matching pattern: ${pattern}`);
      return deleted;
    } catch (error) {
      console.error(`[Cache] Error deleting keys matching ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Cache with automatic refresh function
   * @param {string} key - Cache key
   * @param {Function} refreshFunction - Function to call when cache misses
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<any>} Cached or fresh value
   */
  async getOrSet(key, refreshFunction, ttl = 600) {
    try {
      let value = await this.get(key);
      
      if (value === null) {
        console.log(`[Cache] Cache miss for ${key}, calling refresh function`);
        value = await refreshFunction();
        if (value !== null && value !== undefined) {
          await this.set(key, value, ttl);
        }
      }
      
      return value;
    } catch (error) {
      console.error(`[Cache] Error in getOrSet for key ${key}:`, error);
      // Try to call refresh function as fallback
      try {
        return await refreshFunction();
      } catch (refreshError) {
        console.error(`[Cache] Refresh function failed for key ${key}:`, refreshError);
        return null;
      }
    }
  }

  /**
   * Invalidate cache entries by tags or patterns
   * @param {string[]} tags - Tags to invalidate
   * @returns {Promise<number>} Number of invalidated entries
   */
  async invalidateByTags(tags) {
    let totalDeleted = 0;
    
    for (const tag of tags) {
      const deleted = await this.deleteMatching(tag);
      totalDeleted += deleted;
    }
    
    return totalDeleted;
  }

  /**
   * Preload cache with data
   * @param {Object} data - Data to preload
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async preload(data, ttl = 600) {
    try {
      return await this.mset(data, ttl);
    } catch (error) {
      console.error('[Cache] Error preloading cache:', error);
      return false;
    }
  }
}

module.exports = CacheService;