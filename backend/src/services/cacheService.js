const redisClient = require('../config/redis');

/**
 * Cache Service
 * 
 * Redis-based caching layer for API responses
 * Reduces database load and improves response times
 */
class CacheService {
  /**
   * Cache TTL (Time To Live) in seconds
   */
  static TTL = {
    CAMPAIGNS_LIST: 5 * 60,        // 5 minutes
    CAMPAIGN_DETAIL: 10 * 60,      // 10 minutes
    SOURCES_LIST: 60 * 60,         // 1 hour
    USER_FAVORITES: 2 * 60,        // 2 minutes
    COMMENTS_LIST: 5 * 60,         // 5 minutes
    RATINGS_STATS: 10 * 60,        // 10 minutes
    SEARCH_RESULTS: 5 * 60,        // 5 minutes
  };

  /**
   * Cache key prefixes
   */
  static PREFIX = {
    CAMPAIGNS: 'campaigns',
    CAMPAIGN: 'campaign',
    SOURCES: 'sources',
    FAVORITES: 'favorites',
    COMMENTS: 'comments',
    RATINGS: 'ratings',
    SEARCH: 'search',
  };

  /**
   * Check if Redis is available
   */
  static isAvailable() {
    return redisClient.isReady;
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix
   * @param {string|object} identifier - Unique identifier or params object
   * @returns {string} Cache key
   */
  static generateKey(prefix, identifier) {
    if (typeof identifier === 'object') {
      // Convert object to sorted query string
      const params = Object.keys(identifier)
        .sort()
        .map(key => `${key}=${identifier[key]}`)
        .join('&');
      return `${prefix}:${params}`;
    }
    return `${prefix}:${identifier}`;
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null
   */
  static async get(key) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await redisClient.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error(`❌ Cache get error (${key}):`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  static async set(key, value, ttl) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await redisClient.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`❌ Cache set error (${key}):`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  static async del(key) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Cache delete error (${key}):`, error);
      return false;
    }
  }

  /**
   * Delete all keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'campaigns:*')
   * @returns {Promise<number>} Number of deleted keys
   */
  static async delPattern(pattern) {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await redisClient.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`❌ Cache delete pattern error (${pattern}):`, error);
      return 0;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} Success status
   */
  static async clear() {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await redisClient.flushDb();
      console.log('✅ Cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<object>} Cache stats
   */
  static async getStats() {
    if (!this.isAvailable()) {
      return {
        available: false,
        keys: 0,
        memory: '0 MB',
      };
    }

    try {
      const info = await redisClient.info('stats');
      const dbSize = await redisClient.dbSize();
      
      return {
        available: true,
        keys: dbSize,
        info: info,
      };
    } catch (error) {
      console.error('❌ Cache stats error:', error);
      return {
        available: false,
        error: error.message,
      };
    }
  }

  // ============================================
  // CAMPAIGN CACHE METHODS
  // ============================================

  /**
   * Get campaigns list from cache
   * @param {object} params - Query parameters
   * @returns {Promise<array|null>} Cached campaigns or null
   */
  static async getCampaignsList(params = {}) {
    const key = this.generateKey(this.PREFIX.CAMPAIGNS, params);
    return await this.get(key);
  }

  /**
   * Set campaigns list in cache
   * @param {object} params - Query parameters
   * @param {array} campaigns - Campaigns data
   * @returns {Promise<boolean>} Success status
   */
  static async setCampaignsList(params = {}, campaigns) {
    const key = this.generateKey(this.PREFIX.CAMPAIGNS, params);
    return await this.set(key, campaigns, this.TTL.CAMPAIGNS_LIST);
  }

  /**
   * Invalidate campaigns cache
   * @returns {Promise<number>} Number of deleted keys
   */
  static async invalidateCampaigns() {
    return await this.delPattern(`${this.PREFIX.CAMPAIGNS}:*`);
  }

  /**
   * Get campaign detail from cache
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<object|null>} Cached campaign or null
   */
  static async getCampaignDetail(campaignId) {
    const key = this.generateKey(this.PREFIX.CAMPAIGN, campaignId);
    return await this.get(key);
  }

  /**
   * Set campaign detail in cache
   * @param {string} campaignId - Campaign ID
   * @param {object} campaign - Campaign data
   * @returns {Promise<boolean>} Success status
   */
  static async setCampaignDetail(campaignId, campaign) {
    const key = this.generateKey(this.PREFIX.CAMPAIGN, campaignId);
    return await this.set(key, campaign, this.TTL.CAMPAIGN_DETAIL);
  }

  /**
   * Invalidate campaign detail cache
   * @param {string} campaignId - Campaign ID
   * @returns {Promise<boolean>} Success status
   */
  static async invalidateCampaignDetail(campaignId) {
    const key = this.generateKey(this.PREFIX.CAMPAIGN, campaignId);
    return await this.del(key);
  }

  // ============================================
  // SOURCE CACHE METHODS
  // ============================================

  /**
   * Get sources list from cache
   * @returns {Promise<array|null>} Cached sources or null
   */
  static async getSourcesList() {
    const key = this.PREFIX.SOURCES;
    return await this.get(key);
  }

  /**
   * Set sources list in cache
   * @param {array} sources - Sources data
   * @returns {Promise<boolean>} Success status
   */
  static async setSourcesList(sources) {
    const key = this.PREFIX.SOURCES;
    return await this.set(key, sources, this.TTL.SOURCES_LIST);
  }

  /**
   * Invalidate sources cache
   * @returns {Promise<boolean>} Success status
   */
  static async invalidateSources() {
    const key = this.PREFIX.SOURCES;
    return await this.del(key);
  }

  // ============================================
  // SEARCH CACHE METHODS
  // ============================================

  /**
   * Get search results from cache
   * @param {object} params - Search parameters
   * @returns {Promise<array|null>} Cached results or null
   */
  static async getSearchResults(params) {
    const key = this.generateKey(this.PREFIX.SEARCH, params);
    return await this.get(key);
  }

  /**
   * Set search results in cache
   * @param {object} params - Search parameters
   * @param {array} results - Search results
   * @returns {Promise<boolean>} Success status
   */
  static async setSearchResults(params, results) {
    const key = this.generateKey(this.PREFIX.SEARCH, params);
    return await this.set(key, results, this.TTL.SEARCH_RESULTS);
  }
}

module.exports = CacheService;
