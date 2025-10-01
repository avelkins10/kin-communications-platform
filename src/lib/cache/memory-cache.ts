// In-memory cache implementation with LRU and TTL support
interface CacheItem<T = any> {
  value: T;
  expires: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem>();
  private maxSize: number;
  private defaultTTL: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
  };

  constructor(maxSize = 1000, defaultTTL = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Clean up expired items every minute
    setInterval(() => this.cleanup(), 60000);
  }

  // Get item from cache
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update last accessed time
    item.lastAccessed = Date.now();
    this.stats.hits++;
    return item.value as T;
  }

  // Set item in cache
  set<T>(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    const item: CacheItem<T> = {
      value,
      expires,
      lastAccessed: Date.now(),
    };

    // If key already exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, item);
      this.stats.sets++;
      return;
    }

    // Check if we need to evict items
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, item);
    this.stats.sets++;
  }

  // Delete item from cache
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Clear all items
  clear(): void {
    this.cache.clear();
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Get cache statistics
  getStats(): CacheStats & { size: number; hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Clean up expired items
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  // Evict least recently used item
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
}

// Create cache instances for different data types
export const sessionCache = new MemoryCache(500, 1800000); // 30 minutes TTL
export const userCache = new MemoryCache(200, 600000); // 10 minutes TTL
export const contactCache = new MemoryCache(1000, 300000); // 5 minutes TTL
export const callCache = new MemoryCache(500, 60000); // 1 minute TTL
export const voicemailCache = new MemoryCache(300, 30000); // 30 seconds TTL
export const messageCache = new MemoryCache(500, 60000); // 1 minute TTL
export const taskrouterCache = new MemoryCache(200, 30000); // 30 seconds TTL

// Cache key generators for different data types
export const generateMemoryCacheKey = {
  session: (sessionId: string) => `session:${sessionId}`,
  user: (userId: string) => `user:${userId}`,
  contact: (contactId: string) => `contact:${contactId}`,
  contactByPhone: (phone: string) => `contact:phone:${phone}`,
  call: (callId: string) => `call:${callId}`,
  voicemail: (voicemailId: string) => `voicemail:${voicemailId}`,
  message: (messageId: string) => `message:${messageId}`,
  taskrouter: (type: string, id: string) => `taskrouter:${type}:${id}`,
  userPreferences: (userId: string) => `preferences:${userId}`,
  department: (departmentId: string) => `department:${departmentId}`,
};

// Cache operations for different data types
export const memoryCacheOps = {
  // Session operations
  setSession: (sessionId: string, data: any, ttl?: number) => 
    sessionCache.set(generateMemoryCacheKey.session(sessionId), data, ttl),
  getSession: (sessionId: string) => 
    sessionCache.get(generateMemoryCacheKey.session(sessionId)),
  deleteSession: (sessionId: string) => 
    sessionCache.delete(generateMemoryCacheKey.session(sessionId)),

  // User operations
  setUser: (userId: string, data: any, ttl?: number) => 
    userCache.set(generateMemoryCacheKey.user(userId), data, ttl),
  getUser: (userId: string) => 
    userCache.get(generateMemoryCacheKey.user(userId)),
  deleteUser: (userId: string) => 
    userCache.delete(generateMemoryCacheKey.user(userId)),

  // Contact operations
  setContact: (contactId: string, data: any, ttl?: number) => 
    contactCache.set(generateMemoryCacheKey.contact(contactId), data, ttl),
  getContact: (contactId: string) => 
    contactCache.get(generateMemoryCacheKey.contact(contactId)),
  setContactByPhone: (phone: string, data: any, ttl?: number) => 
    contactCache.set(generateMemoryCacheKey.contactByPhone(phone), data, ttl),
  getContactByPhone: (phone: string) => 
    contactCache.get(generateMemoryCacheKey.contactByPhone(phone)),
  deleteContact: (contactId: string) => 
    contactCache.delete(generateMemoryCacheKey.contact(contactId)),

  // Call operations
  setCall: (callId: string, data: any, ttl?: number) => 
    callCache.set(generateMemoryCacheKey.call(callId), data, ttl),
  getCall: (callId: string) => 
    callCache.get(generateMemoryCacheKey.call(callId)),
  deleteCall: (callId: string) => 
    callCache.delete(generateMemoryCacheKey.call(callId)),

  // Voicemail operations
  setVoicemail: (voicemailId: string, data: any, ttl?: number) => 
    voicemailCache.set(generateMemoryCacheKey.voicemail(voicemailId), data, ttl),
  getVoicemail: (voicemailId: string) => 
    voicemailCache.get(generateMemoryCacheKey.voicemail(voicemailId)),
  deleteVoicemail: (voicemailId: string) => 
    voicemailCache.delete(generateMemoryCacheKey.voicemail(voicemailId)),

  // Message operations
  setMessage: (messageId: string, data: any, ttl?: number) => 
    messageCache.set(generateMemoryCacheKey.message(messageId), data, ttl),
  getMessage: (messageId: string) => 
    messageCache.get(generateMemoryCacheKey.message(messageId)),
  deleteMessage: (messageId: string) => 
    messageCache.delete(generateMemoryCacheKey.message(messageId)),

  // TaskRouter operations
  setTaskRouter: (type: string, id: string, data: any, ttl?: number) => 
    taskrouterCache.set(generateMemoryCacheKey.taskrouter(type, id), data, ttl),
  getTaskRouter: (type: string, id: string) => 
    taskrouterCache.get(generateMemoryCacheKey.taskrouter(type, id)),
  deleteTaskRouter: (type: string, id: string) => 
    taskrouterCache.delete(generateMemoryCacheKey.taskrouter(type, id)),

  // User preferences
  setUserPreferences: (userId: string, data: any, ttl?: number) => 
    userCache.set(generateMemoryCacheKey.userPreferences(userId), data, ttl),
  getUserPreferences: (userId: string) => 
    userCache.get(generateMemoryCacheKey.userPreferences(userId)),
  deleteUserPreferences: (userId: string) => 
    userCache.delete(generateMemoryCacheKey.userPreferences(userId)),
};

// Get combined cache statistics
export const getMemoryCacheStats = () => {
  return {
    session: sessionCache.getStats(),
    user: userCache.getStats(),
    contact: contactCache.getStats(),
    call: callCache.getStats(),
    voicemail: voicemailCache.getStats(),
    message: messageCache.getStats(),
    taskrouter: taskrouterCache.getStats(),
    total: {
      size: sessionCache.size() + userCache.size() + contactCache.size() + 
            callCache.size() + voicemailCache.size() + messageCache.size() + 
            taskrouterCache.size(),
    },
  };
};

// Health check for memory cache
export const checkMemoryCacheHealth = () => {
  const stats = getMemoryCacheStats();
  return {
    status: 'healthy',
    type: 'memory-cache',
    timestamp: new Date().toISOString(),
    caches: Object.keys(stats).length - 1, // Exclude total
    totalSize: stats.total.size,
  };
};

// Clear all caches
export const clearAllMemoryCaches = () => {
  sessionCache.clear();
  userCache.clear();
  contactCache.clear();
  callCache.clear();
  voicemailCache.clear();
  messageCache.clear();
  taskrouterCache.clear();
};
