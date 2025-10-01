# Caching Strategy Documentation

This document outlines the comprehensive caching strategy implemented in the KIN Communications Platform using Next.js built-in caching patterns and in-memory caching solutions.

## Overview

The platform uses a multi-layered caching approach to optimize performance:

1. **Next.js Built-in Caching**: Using `unstable_cache` for database query caching
2. **In-Memory Caching**: LRU cache with TTL for frequently accessed data
3. **Cache Invalidation**: Strategic cache invalidation using `revalidateTag` and `revalidatePath`

## Next.js Caching

### Database Query Caching

The platform uses Next.js `unstable_cache` to cache database queries with appropriate TTL values:

```typescript
import { unstable_cache } from 'next/cache';

export const cachedQueries = {
  getContacts: unstable_cache(
    async (params?: Record<string, any>) => {
      // Database query implementation
      return await prisma.contact.findMany(params);
    },
    ['contacts'],
    { tags: ['contacts'], revalidate: 300 } // 5 minutes
  ),
};
```

### Cache Tags

Cache tags are used for targeted invalidation:

- `contacts`: Contact-related data
- `calls`: Call history and status
- `voicemails`: Voicemail data
- `messages`: SMS and message data
- `taskrouter`: TaskRouter data
- `users`: User data
- `departments`: Department data

### Cache Invalidation

```typescript
import { revalidateTag, revalidatePath } from 'next/cache';

// Invalidate specific cache tags
export const invalidateCache = {
  contacts: () => revalidateTag('contacts'),
  calls: () => revalidateTag('calls'),
  voicemails: () => revalidateTag('voicemails'),
  messages: () => revalidateTag('messages'),
  taskrouter: () => revalidateTag('taskrouter'),
  users: () => revalidateTag('users'),
  departments: () => revalidateTag('departments'),
  all: () => {
    Object.values(CACHE_TAGS).forEach(tag => revalidateTag(tag));
  },
};
```

## In-Memory Caching

### LRU Cache Implementation

The platform implements an LRU (Least Recently Used) cache with TTL support for frequently accessed data:

```typescript
class MemoryCache {
  private cache = new Map<string, CacheItem>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 300000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    item.lastAccessed = Date.now();
    return item.value as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTTL);
    const item: CacheItem<T> = {
      value,
      expires,
      lastAccessed: Date.now(),
    };

    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, item);
  }
}
```

### Cache Instances

Different cache instances for different data types:

```typescript
export const sessionCache = new MemoryCache(500, 1800000); // 30 minutes TTL
export const userCache = new MemoryCache(200, 600000); // 10 minutes TTL
export const contactCache = new MemoryCache(1000, 300000); // 5 minutes TTL
export const callCache = new MemoryCache(500, 60000); // 1 minute TTL
export const voicemailCache = new MemoryCache(300, 30000); // 30 seconds TTL
export const messageCache = new MemoryCache(500, 60000); // 1 minute TTL
export const taskrouterCache = new MemoryCache(200, 30000); // 30 seconds TTL
```

## Cache Key Strategies

### Contact Caching

```typescript
export const generateMemoryCacheKey = {
  contact: (contactId: string) => `contact:${contactId}`,
  contactByPhone: (phone: string) => `contact:phone:${phone}`,
  userContacts: (userId: string, page: number, limit: number) => 
    `user:${userId}:contacts:page:${page}:limit:${limit}`,
};
```

### Call Caching

```typescript
export const generateMemoryCacheKey = {
  call: (callId: string) => `call:${callId}`,
  userCalls: (userId: string, page: number, limit: number) => 
    `user:${userId}:calls:page:${page}:limit:${limit}`,
  callHistory: (contactId: string) => `call:history:${contactId}`,
};
```

## Cache TTL Configuration

### Database Query Caching

- **Contacts**: 5 minutes (300 seconds)
- **Calls**: 1 minute (60 seconds)
- **Voicemails**: 30 seconds
- **Messages**: 1 minute (60 seconds)
- **TaskRouter**: 30 seconds
- **Users**: 10 minutes (600 seconds)
- **Departments**: 30 minutes (1800 seconds)

### In-Memory Caching

- **Session Data**: 30 minutes (1800000 ms)
- **User Preferences**: 10 minutes (600000 ms)
- **Contact Lookups**: 5 minutes (300000 ms)
- **Call History**: 1 minute (60000 ms)
- **Voicemail Data**: 30 seconds (30000 ms)
- **Message Data**: 1 minute (60000 ms)
- **TaskRouter Data**: 30 seconds (30000 ms)

## Cache Invalidation Patterns

### Automatic Invalidation

Cache invalidation is triggered by:

1. **Data Updates**: When contacts, calls, or messages are created/updated
2. **User Actions**: When users perform actions that affect cached data
3. **Time-based**: Automatic expiration based on TTL
4. **Manual**: Admin-triggered cache clearing

### Invalidation Examples

```typescript
// Invalidate contact cache when contact is updated
export const updateContact = async (id: string, data: ContactUpdateInput) => {
  const contact = await prisma.contact.update({
    where: { id },
    data,
  });

  // Invalidate Next.js cache
  invalidateCache.contacts();
  
  // Invalidate memory cache
  memoryCacheOps.deleteContact(id);
  memoryCacheOps.deleteContactByPhone(contact.phone);

  return contact;
};
```

## Performance Optimization

### Cache Warming

The platform implements cache warming strategies:

```typescript
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
};
```

### Cache Statistics

Monitor cache performance:

```typescript
export const getMemoryCacheStats = () => {
  return {
    session: sessionCache.getStats(),
    user: userCache.getStats(),
    contact: contactCache.getStats(),
    call: callCache.getStats(),
    voicemail: voicemailCache.getStats(),
    message: messageCache.getStats(),
    taskrouter: taskrouterCache.getStats(),
  };
};
```

## Best Practices

### Cache Key Design

1. **Hierarchical Keys**: Use consistent naming patterns
2. **Include Context**: Include user ID, page, limit in keys
3. **Avoid Conflicts**: Use prefixes to avoid key collisions
4. **Versioning**: Consider versioning for schema changes

### TTL Selection

1. **Frequently Updated Data**: Short TTL (30 seconds - 1 minute)
2. **Stable Data**: Longer TTL (5-30 minutes)
3. **User Preferences**: Medium TTL (10 minutes)
4. **Session Data**: Long TTL (30 minutes)

### Memory Management

1. **Size Limits**: Set appropriate max sizes for each cache
2. **LRU Eviction**: Automatic eviction of least recently used items
3. **TTL Cleanup**: Regular cleanup of expired items
4. **Memory Monitoring**: Track memory usage and hit rates

## Monitoring and Debugging

### Health Checks

```typescript
export const checkCacheHealth = () => {
  return {
    status: 'healthy',
    type: 'nextjs-cache',
    timestamp: new Date().toISOString(),
    tags: Object.keys(CACHE_TAGS).length,
  };
};
```

### Cache Statistics

```typescript
export const getCacheStats = () => {
  return {
    nextjs: getCacheStats(),
    memory: getMemoryCacheStats(),
    timestamp: new Date().toISOString(),
  };
};
```

## Serverless Considerations

In-memory cache is per-instance and ephemeral on serverless platforms. Use Next.js `unstable_cache` with tags for cross-invocation caching and call `revalidateTag` on writes. Avoid relying on process memory for shared state in serverless.

## Troubleshooting

### Common Issues

1. **Cache Misses**: Check TTL settings and invalidation logic
2. **Memory Usage**: Monitor cache sizes and adjust limits
3. **Stale Data**: Ensure proper invalidation on updates
4. **Performance**: Monitor hit rates and adjust TTL values

### Debug Tools

```typescript
// Enable cache debugging
const DEBUG_CACHE = process.env.DEBUG_CACHE === 'true';

if (DEBUG_CACHE) {
  console.log('Cache operation:', { key, hit: !!cached, ttl });
}
```
