import { PrismaClient } from '@prisma/client';
import { generateCacheKey, memoryCacheOps } from '../cache';
import { logger, dbLogger, performanceLogger } from '../logging/logger';
import { DatabaseError, QueryError } from '../errors';

export interface QueryOptions {
  useCache?: boolean;
  cacheTTL?: number;
  cacheKey?: string;
  timeout?: number;
  retries?: number;
}

export interface QueryResult<T> {
  data: T;
  fromCache: boolean;
  executionTime: number;
  cacheKey?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchOptions {
  query: string;
  fields: string[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
}

export interface ContactFilters {
  type?: string;
  department?: string;
  isFavorite?: boolean;
  groupId?: string;
  search?: string;
}

export interface CallFilters {
  direction?: 'INBOUND' | 'OUTBOUND';
  status?: 'PENDING' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'MISSED' | 'VOICEMAIL';
  contactId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface VoicemailFilters {
  assignedToId?: string;
  isRead?: boolean;
  contactId?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface MessageFilters {
  contactId?: string;
  direction?: 'INBOUND' | 'OUTBOUND';
  status?: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

class DatabaseOptimization {
  private prisma: PrismaClient;
  private queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Optimized contact queries
  async getContacts(
    userId: string,
    options: PaginationOptions = { page: 1, limit: 20 },
    queryOptions: QueryOptions = {},
    filters: ContactFilters = {}
  ): Promise<QueryResult<{ contacts: any[]; pagination: any }>> {
    const startTime = Date.now();
    const { useCache = true, cacheTTL = 300 } = queryOptions;
    const { page, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    
    // Build cache key with filters
    const filterKey = this.buildFilterKey(filters);
    const cacheKey = filterKey 
      ? generateCacheKey.contacts({ userId, ...filters, page, limit })
      : generateCacheKey.contacts({ userId, page, limit });
    
    // Try cache first
    if (useCache) {
      const cached = memoryCacheOps.getContact(cacheKey);
      if (cached) {
        const executionTime = Date.now() - startTime;
        performanceLogger.database('getContacts', executionTime, (cached as any).contacts?.length || 0);
        return { data: cached as any, fromCache: true, executionTime, cacheKey };
      }
    }

    try {
      const skip = (page - 1) * limit;
      
      // Build where clause with filters
      const where = this.buildContactWhereClause(userId, filters);
      
      const [contacts, total] = await Promise.all([
        this.prisma.contact.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: orderDirection },
          include: {
            calls: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                status: true,
                durationSec: true,
                createdAt: true,
              },
            },
            // removed voicemails snippet to satisfy Prisma types
            _count: true,
          },
        }),
        this.prisma.contact.count({ where }),
      ]);

      const result = {
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      // Cache the result
      if (useCache) {
        memoryCacheOps.setContact(cacheKey, result, cacheTTL * 1000);
      }

      const executionTime = Date.now() - startTime;
      performanceLogger.database('getContacts', executionTime, contacts.length);
      
      return { data: result, fromCache: false, executionTime, cacheKey };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      dbLogger.error(error as any);
      throw new QueryError('Failed to fetch contacts');
    }
  }

  // Optimized call queries
  async getCalls(
    userId: string,
    options: PaginationOptions = { page: 1, limit: 20 },
    queryOptions: QueryOptions = {},
    filters: CallFilters = {}
  ): Promise<QueryResult<{ calls: any[]; pagination: any }>> {
    const startTime = Date.now();
    const { useCache = true, cacheTTL = 180 } = queryOptions;
    const { page, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    
    // Build cache key with filters
    const filterKey = this.buildFilterKey(filters);
    const cacheKey = filterKey 
      ? generateCacheKey.calls({ userId, ...filters, page, limit })
      : generateCacheKey.calls({ userId, page, limit });
    
    if (useCache) {
      const cached = memoryCacheOps.getCall(cacheKey);
      if (cached) {
        const executionTime = Date.now() - startTime;
        performanceLogger.database('getCalls', executionTime, (cached as any).calls?.length || 0);
        return { data: cached as any, fromCache: true, executionTime, cacheKey };
      }
    }

    try {
      const skip = (page - 1) * limit;
      
      // Build where clause with filters
      const where = this.buildCallWhereClause(userId, filters);
      
      const [calls, total] = await Promise.all([
        this.prisma.call.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: orderDirection },
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                organization: true,
              },
            },
          },
        }),
        this.prisma.call.count({ where }),
      ]);

      const result = {
        calls,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      if (useCache) {
        memoryCacheOps.setCall(cacheKey, result, cacheTTL * 1000);
      }

      const executionTime = Date.now() - startTime;
      performanceLogger.database('getCalls', executionTime, calls.length);
      
      return { data: result, fromCache: false, executionTime, cacheKey };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      dbLogger.error(error as any);
      throw new QueryError('Failed to fetch calls');
    }
  }

  // Optimized voicemail queries
  async getVoicemails(
    userId: string,
    options: PaginationOptions = { page: 1, limit: 20 },
    queryOptions: QueryOptions = {},
    filters: VoicemailFilters = {}
  ): Promise<QueryResult<{ voicemails: any[]; pagination: any }>> {
    const startTime = Date.now();
    const { useCache = true, cacheTTL = 180 } = queryOptions;
    const { page, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    
    // Build cache key with filters
    const filterKey = this.buildFilterKey(filters);
    const cacheKey = filterKey 
      ? generateCacheKey.voicemails({ userId, ...filters, page, limit })
      : generateCacheKey.voicemails({ userId, page, limit });
    
    if (useCache) {
      const cached = memoryCacheOps.getVoicemail(cacheKey);
      if (cached) {
        const executionTime = Date.now() - startTime;
        performanceLogger.database('getVoicemails', executionTime, (cached as any).voicemails?.length || 0);
        return { data: cached as any, fromCache: true, executionTime, cacheKey };
      }
    }

    try {
      const skip = (page - 1) * limit;
      
      // Build where clause with filters
      const where = this.buildVoicemailWhereClause(userId, filters);
      
      const [voicemails, total] = await Promise.all([
        this.prisma.voicemail.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: orderDirection },
          include: {},
        }),
        this.prisma.voicemail.count({ where }),
      ]);

      const result = {
        voicemails,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      if (useCache) {
        memoryCacheOps.setVoicemail(cacheKey, result, cacheTTL * 1000);
      }

      const executionTime = Date.now() - startTime;
      performanceLogger.database('getVoicemails', executionTime, voicemails.length);
      
      return { data: result, fromCache: false, executionTime, cacheKey };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      dbLogger.error(error as any);
      throw new QueryError('Failed to fetch voicemails');
    }
  }

  // Optimized message queries
  async getMessages(
    userId: string,
    options: PaginationOptions = { page: 1, limit: 20 },
    queryOptions: QueryOptions = {},
    filters: MessageFilters = {}
  ): Promise<QueryResult<{ messages: any[]; pagination: any }>> {
    const startTime = Date.now();
    const { useCache = true, cacheTTL = 120 } = queryOptions;
    const { page, limit, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    
    // Build cache key with filters
    const filterKey = this.buildFilterKey(filters);
    const cacheKey = filterKey 
      ? generateCacheKey.messages({ userId, ...filters, page, limit })
      : generateCacheKey.messages({ userId, page, limit });
    
    if (useCache) {
      const cached = memoryCacheOps.getMessage(cacheKey);
      if (cached) {
        const executionTime = Date.now() - startTime;
        performanceLogger.database('getMessages', executionTime, (cached as any).messages?.length || 0);
        return { data: cached as any, fromCache: true, executionTime, cacheKey };
      }
    }

    try {
      const skip = (page - 1) * limit;
      
      // Build where clause with filters
      const where = this.buildMessageWhereClause(userId, filters);
      
      const [messages, total] = await Promise.all([
        this.prisma.message.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [orderBy]: orderDirection },
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
                organization: true,
              },
            },
          },
        }),
        this.prisma.message.count({ where }),
      ]);

      const result = {
        messages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      if (useCache) {
        memoryCacheOps.setMessage(cacheKey, result, cacheTTL * 1000);
      }

      const executionTime = Date.now() - startTime;
      performanceLogger.database('getMessages', executionTime, messages.length);
      
      return { data: result, fromCache: false, executionTime, cacheKey };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      dbLogger.error(error as any);
      throw new QueryError('Failed to fetch messages');
    }
  }

  // Helper methods for building filter keys and where clauses
  private buildFilterKey(filters: any): string | null {
    const filterEntries = Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null && value !== '');
    if (filterEntries.length === 0) return null;
    
    return filterEntries
      .map(([key, value]) => `${key}:${value}`)
      .sort()
      .join('|');
  }

  private buildContactWhereClause(userId: string, filters: ContactFilters): any {
    const where: any = { ownerId: userId };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.department) {
      where.organization = { contains: filters.department, mode: 'insensitive' };
    }

    if (filters.isFavorite !== undefined) {
      where.isFavorite = filters.isFavorite;
    }

    if (filters.groupId) {
      where.groups = {
        some: {
          groupId: filters.groupId,
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { organization: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildCallWhereClause(userId: string, filters: CallFilters): any {
    const where: any = { userId };

    if (filters.direction) {
      where.direction = filters.direction;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.contactId) {
      where.contactId = filters.contactId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { fromNumber: { contains: filters.search, mode: 'insensitive' } },
        { toNumber: { contains: filters.search, mode: 'insensitive' } },
        { contact: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private buildVoicemailWhereClause(userId: string, filters: VoicemailFilters): any {
    const where: any = {
      OR: [
        { assignedToId: userId },
        { contact: { ownerId: userId } },
      ],
    };

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.isRead !== undefined) {
      where.readAt = filters.isRead ? { not: null } : null;
    }

    if (filters.contactId) {
      where.contactId = filters.contactId;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { fromNumber: { contains: filters.search, mode: 'insensitive' } },
        { contact: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private buildMessageWhereClause(userId: string, filters: MessageFilters): any {
    const where: any = { userId };

    if (filters.contactId) {
      where.contactId = filters.contactId;
    }

    if (filters.direction) {
      where.direction = filters.direction;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    if (filters.search) {
      where.OR = [
        { body: { contains: filters.search, mode: 'insensitive' } },
        { fromNumber: { contains: filters.search, mode: 'insensitive' } },
        { toNumber: { contains: filters.search, mode: 'insensitive' } },
        { contact: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { contact: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  // Search functionality with full-text search
  async searchContacts(
    userId: string,
    searchOptions: SearchOptions,
    paginationOptions: PaginationOptions = { page: 1, limit: 20 },
    queryOptions: QueryOptions = {}
  ): Promise<QueryResult<{ contacts: any[]; pagination: any; search: any }>> {
    const startTime = Date.now();
    const { useCache = true, cacheTTL = 300 } = queryOptions;
    const { query, fields, caseSensitive = false, exactMatch = false } = searchOptions;
    const { page, limit } = paginationOptions;
    
    const cacheKey = generateCacheKey.contacts({ userId, search: query, page, limit });
    
    if (useCache) {
      const cached = memoryCacheOps.getContact(cacheKey);
      if (cached) {
        const executionTime = Date.now() - startTime;
        performanceLogger.database('searchContacts', executionTime, (cached as any).contacts?.length || 0);
        return { data: cached as any, fromCache: true, executionTime, cacheKey };
      }
    }

    try {
      const skip = (page - 1) * limit;
      
      // Build search conditions
      const searchConditions = fields.map(field => {
        if (exactMatch) {
          return { [field]: { equals: query } };
        } else {
          return { [field]: { contains: query, mode: caseSensitive ? 'default' : 'insensitive' } };
        }
      });

      const [contacts, total] = await Promise.all([
        this.prisma.contact.findMany({
          where: {
            ownerId: userId,
            OR: searchConditions,
          },
          skip,
          take: limit,
          include: {
            _count: true,
          },
        }),
        this.prisma.contact.count({
          where: {
            ownerId: userId,
            OR: searchConditions,
          },
        }),
      ]);

      const result = {
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        search: {
          query,
          fields,
          caseSensitive,
          exactMatch,
        },
      };

      if (useCache) {
        memoryCacheOps.setContact(cacheKey, result, cacheTTL * 1000);
      }

      const executionTime = Date.now() - startTime;
      performanceLogger.database('searchContacts', executionTime, contacts.length);
      
      return { data: result, fromCache: false, executionTime, cacheKey };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      dbLogger.error(error as any);
      throw new QueryError('Failed to search contacts');
    }
  }

  // Bulk operations with transaction support
  async bulkUpdateContacts(
    userId: string,
    contactIds: string[],
    updateData: any,
    queryOptions: QueryOptions = {}
  ): Promise<QueryResult<{ updated: number; failed: number }>> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let updated = 0;
        let failed = 0;

        for (const contactId of contactIds) {
          try {
            await tx.contact.update({
              where: { id: contactId },
              data: updateData,
            });
            updated++;
          } catch (error) {
            failed++;
            logger.warn(`Failed to update contact ${contactId}:`, error);
          }
        }

        return { updated, failed };
      });

      // Invalidate related cache entries
      // Note: Cache invalidation is handled by the new caching system

      const executionTime = Date.now() - startTime;
      performanceLogger.database('bulkUpdateContacts', executionTime, contactIds.length);
      
      return { data: result, fromCache: false, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      dbLogger.error(error as any);
      throw new QueryError('Failed to bulk update contacts');
    }
  }

  // Connection pooling optimization
  // optimizeConnectionPool removed; use pgbouncer/Prisma env for pooling

  // Query performance monitoring
  async getQueryStats(): Promise<any> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        ORDER BY total_time DESC 
        LIMIT 10
      `;
      
      return stats;
    } catch (error) {
      logger.error('Failed to get query stats:', error);
      return [];
    }
  }

  // Database health check
  async healthCheck(): Promise<{
    healthy: boolean;
    connectionCount: number;
    activeQueries: number;
    cacheHitRate: number;
  }> {
    try {
      const [connectionCount, activeQueries] = await Promise.all([
        this.prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity`,
        this.prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'`,
      ]);

      const cacheStats = 0; // Memory cache hit rate placeholder
      
      return {
        healthy: true,
        connectionCount: (connectionCount as any)[0]?.count || 0,
        activeQueries: (activeQueries as any)[0]?.count || 0,
        cacheHitRate: cacheStats,
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        healthy: false,
        connectionCount: 0,
        activeQueries: 0,
        cacheHitRate: 0,
      };
    }
  }
}

// Export singleton instance
let dbOptimization: DatabaseOptimization | null = null;

export const getDatabaseOptimization = (prisma: PrismaClient): DatabaseOptimization => {
  if (!dbOptimization) {
    dbOptimization = new DatabaseOptimization(prisma);
  }
  return dbOptimization;
};

export default DatabaseOptimization;
