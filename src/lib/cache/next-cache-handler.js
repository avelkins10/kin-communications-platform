const { IncrementalCache } = require('next/dist/server/lib/incremental-cache');

class CustomCacheHandler {
  constructor(options) {
    this.options = options;
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 300000; // 5 minutes default
  }

  async get(key, ctx) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  async set(key, data, ctx) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value: data,
      timestamp: Date.now()
    });
  }

  async revalidateTag(tag) {
    // Clear cache entries that match the tag
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = CustomCacheHandler;
