const CacheService = require('../services/cacheService');

/**
 * Cache middleware
 * 
 * Automatically caches GET requests and serves from cache if available
 * 
 * Usage:
 * router.get('/campaigns', cacheMiddleware(300), handler);
 */
function cacheMiddleware(ttl = 300) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache if disabled
    if (!CacheService.isAvailable()) {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `api:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cachedData = await CacheService.get(cacheKey);
      
      if (cachedData) {
        // Cache hit
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      // Cache miss - continue to handler
      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        // Cache the response
        CacheService.set(cacheKey, data, ttl).catch(err => {
          console.error('Cache set error:', err);
        });
        
        // Send response
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * 
 * Automatically invalidates cache on POST, PUT, DELETE requests
 * 
 * Usage:
 * router.post('/campaigns', invalidateCacheMiddleware('campaigns:*'), handler);
 */
function invalidateCacheMiddleware(pattern) {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override res.json to invalidate cache after response
    res.json = async function(data) {
      // Send response first
      originalJson(data);
      
      // Then invalidate cache (async, don't wait)
      try {
        const deletedCount = await CacheService.delPattern(pattern);
        console.log(`🗑️  Cache invalidated: ${pattern} (${deletedCount} keys)`);
      } catch (error) {
        console.error('Cache invalidation error:', error);
      }
    };

    next();
  };
}

module.exports = {
  cacheMiddleware,
  invalidateCacheMiddleware,
};
