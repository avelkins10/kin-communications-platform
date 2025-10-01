import { unstable_cache } from 'next/cache';
import { revalidateTag, revalidatePath } from 'next/cache';

// Cache tags for different data types
export const CACHE_TAGS = {
  CONTACTS: 'contacts',
  CALLS: 'calls',
  VOICEMAILS: 'voicemails',
  MESSAGES: 'messages',
  TASKROUTER: 'taskrouter',
  USERS: 'users',
  DEPARTMENTS: 'departments',
} as const;

// Cache key generators
export const generateCacheKey = {
  contacts: (params?: Record<string, any>) => 
    `contacts:${JSON.stringify(params || {})}`,
  calls: (params?: Record<string, any>) => 
    `calls:${JSON.stringify(params || {})}`,
  voicemails: (params?: Record<string, any>) => 
    `voicemails:${JSON.stringify(params || {})}`,
  messages: (params?: Record<string, any>) => 
    `messages:${JSON.stringify(params || {})}`,
  taskrouter: (params?: Record<string, any>) => 
    `taskrouter:${JSON.stringify(params || {})}`,
  users: (params?: Record<string, any>) => 
    `users:${JSON.stringify(params || {})}`,
  departments: (params?: Record<string, any>) => 
    `departments:${JSON.stringify(params || {})}`,
};

// Cache configuration
const CACHE_CONFIG = {
  contacts: { tags: [CACHE_TAGS.CONTACTS], revalidate: 300 }, // 5 minutes
  calls: { tags: [CACHE_TAGS.CALLS], revalidate: 60 }, // 1 minute
  voicemails: { tags: [CACHE_TAGS.VOICEMAILS], revalidate: 30 }, // 30 seconds
  messages: { tags: [CACHE_TAGS.MESSAGES], revalidate: 60 }, // 1 minute
  taskrouter: { tags: [CACHE_TAGS.TASKROUTER], revalidate: 30 }, // 30 seconds
  users: { tags: [CACHE_TAGS.USERS], revalidate: 600 }, // 10 minutes
  departments: { tags: [CACHE_TAGS.DEPARTMENTS], revalidate: 1800 }, // 30 minutes
};

// The app now uses cacheService.getCachedQuery for query caching.
// cachedQueries has been removed to avoid confusion.

// Cache invalidation functions
export const invalidateCache = {
  contacts: () => revalidateTag(CACHE_TAGS.CONTACTS),
  calls: () => revalidateTag(CACHE_TAGS.CALLS),
  voicemails: () => revalidateTag(CACHE_TAGS.VOICEMAILS),
  messages: () => revalidateTag(CACHE_TAGS.MESSAGES),
  taskrouter: () => revalidateTag(CACHE_TAGS.TASKROUTER),
  users: () => revalidateTag(CACHE_TAGS.USERS),
  departments: () => revalidateTag(CACHE_TAGS.DEPARTMENTS),
  all: () => {
    Object.values(CACHE_TAGS).forEach(tag => revalidateTag(tag));
  },
};

// Path revalidation functions
export const revalidatePaths = {
  contacts: () => revalidatePath('/api/contacts'),
  calls: () => revalidatePath('/api/calls'),
  voicemails: () => revalidatePath('/api/voicemails'),
  messages: () => revalidatePath('/api/messages'),
  taskrouter: () => revalidatePath('/api/taskrouter'),
  dashboard: () => revalidatePath('/dashboard'),
  all: () => {
    revalidatePath('/api/contacts');
    revalidatePath('/api/calls');
    revalidatePath('/api/voicemails');
    revalidatePath('/api/messages');
    revalidatePath('/api/taskrouter');
    revalidatePath('/dashboard');
  },
};

// Cache statistics (for monitoring)
export const getCacheStats = () => {
  return {
    tags: Object.values(CACHE_TAGS),
    config: CACHE_CONFIG,
    lastUpdated: new Date().toISOString(),
  };
};

// Health check for cache system
export const checkCacheHealth = () => {
  return {
    status: 'healthy',
    type: 'nextjs-cache',
    timestamp: new Date().toISOString(),
    tags: Object.keys(CACHE_TAGS).length,
  };
};
