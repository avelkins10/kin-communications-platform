// Main cache export file - unified interface for Next.js and in-memory caching
export * from './next-cache';
export * from './memory-cache';

// If using named re-exports, ensure they split correctly
export {
  // Next.js cache functions
  invalidateCache,
  revalidatePaths,
  generateCacheKey,
  CACHE_TAGS,
  getCacheStats,
  checkCacheHealth,
} from './next-cache';

export {
  // Memory cache functions
  memoryCacheOps,
  generateMemoryCacheKey,
  getMemoryCacheStats,
  checkMemoryCacheHealth,
  clearAllMemoryCaches,
  
  // Cache instances
  sessionCache,
  userCache,
  contactCache,
  callCache,
  voicemailCache,
  messageCache,
  taskrouterCache,
} from './memory-cache';

// Unified cache interface
export interface CacheService {
  // Next.js cache operations
  getCachedQuery: <T>(key: string, queryFn: () => Promise<T>, tags: string[]) => Promise<T>;
  invalidateByTag: (tag: string) => Promise<void>;
  invalidateByPath: (path: string) => Promise<void>;
  
  // Memory cache operations
  getFromMemory: <T>(key: string) => T | null;
  setInMemory: <T>(key: string, value: T, ttl?: number) => void;
  deleteFromMemory: (key: string) => boolean;
  
  // Health and stats
  getHealth: () => { status: string; type: string; timestamp: string };
  getStats: () => any;
}

// Cache service implementation
import { unstable_cache } from 'next/cache';

export const cacheService: CacheService = {
  // Next.js cache operations
  getCachedQuery: async <T>(key: string, queryFn: () => Promise<T>, tags: string[]) => {
    const cached = unstable_cache(queryFn, [key], { tags, revalidate: 300 });
    return cached();
  },
  
  invalidateByTag: async (tag: string) => {
    const { revalidateTag } = await import('next/cache');
    revalidateTag(tag);
  },
  
  invalidateByPath: async (path: string) => {
    const { revalidatePath } = await import('next/cache');
    revalidatePath(path);
  },
  
  // Memory cache operations
  getFromMemory: <T>(key: string) => {
    // Try different caches based on key pattern
    if (key.startsWith('session:')) {
      return sessionCache.get<T>(key);
    } else if (key.startsWith('user:')) {
      return userCache.get<T>(key);
    } else if (key.startsWith('contact:')) {
      return contactCache.get<T>(key);
    } else if (key.startsWith('call:')) {
      return callCache.get<T>(key);
    } else if (key.startsWith('voicemail:')) {
      return voicemailCache.get<T>(key);
    } else if (key.startsWith('message:')) {
      return messageCache.get<T>(key);
    } else if (key.startsWith('taskrouter:')) {
      return taskrouterCache.get<T>(key);
    }
    return null;
  },
  
  setInMemory: <T>(key: string, value: T, ttl?: number) => {
    // Set in appropriate cache based on key pattern
    if (key.startsWith('session:')) {
      sessionCache.set(key, value, ttl);
    } else if (key.startsWith('user:')) {
      userCache.set(key, value, ttl);
    } else if (key.startsWith('contact:')) {
      contactCache.set(key, value, ttl);
    } else if (key.startsWith('call:')) {
      callCache.set(key, value, ttl);
    } else if (key.startsWith('voicemail:')) {
      voicemailCache.set(key, value, ttl);
    } else if (key.startsWith('message:')) {
      messageCache.set(key, value, ttl);
    } else if (key.startsWith('taskrouter:')) {
      taskrouterCache.set(key, value, ttl);
    }
  },
  
  deleteFromMemory: (key: string) => {
    // Delete from appropriate cache based on key pattern
    if (key.startsWith('session:')) {
      return sessionCache.delete(key);
    } else if (key.startsWith('user:')) {
      return userCache.delete(key);
    } else if (key.startsWith('contact:')) {
      return contactCache.delete(key);
    } else if (key.startsWith('call:')) {
      return callCache.delete(key);
    } else if (key.startsWith('voicemail:')) {
      return voicemailCache.delete(key);
    } else if (key.startsWith('message:')) {
      return messageCache.delete(key);
    } else if (key.startsWith('taskrouter:')) {
      return taskrouterCache.delete(key);
    }
    return false;
  },
  
  // Health and stats
  getHealth: () => {
    const nextjsHealth = checkCacheHealth();
    const memoryHealth = checkMemoryCacheHealth();
    
    return {
      status: 'healthy',
      type: 'unified-cache',
      timestamp: new Date().toISOString(),
      nextjs: nextjsHealth,
      memory: memoryHealth,
    };
  },
  
  getStats: () => {
    return {
      nextjs: getCacheStats(),
      memory: getMemoryCacheStats(),
      timestamp: new Date().toISOString(),
    };
  },
};

// Simple in-memory get-or-set helper for webhook and route usage
export const getOrSet = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 300000
): Promise<T> => {
  const cached = cacheService.getFromMemory<T>(key);
  if (cached) return cached as T;
  const value = await fetcher();
  cacheService.setInMemory(key, value, ttlMs);
  return value;
};

// Cache invalidation helpers
export const invalidateAllCaches = async () => {
  // Invalidate Next.js caches
  const { invalidateCache } = await import('./next-cache');
  invalidateCache.all();
  
  // Clear memory caches
  clearAllMemoryCaches();
};

// Cache warming helpers
export const warmCache = {
  contacts: async (contacts: any[]) => {
    contacts.forEach(contact => {
      if (contact.id) {
        memoryCacheOps.setContact(contact.id, contact);
      }
      if (contact.phone) {
        memoryCacheOps.setContactByPhone(contact.phone, contact);
      }
    });
  },
  
  users: async (users: any[]) => {
    users.forEach(user => {
      if (user.id) {
        memoryCacheOps.setUser(user.id, user);
      }
    });
  },
  
  calls: async (calls: any[]) => {
    calls.forEach(call => {
      if (call.id) {
        memoryCacheOps.setCall(call.id, call);
      }
    });
  },
};

// Export default cache service
export default cacheService;
