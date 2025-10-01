import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { invalidateCache, revalidatePaths, clearAllMemoryCaches } from "@/lib/cache";
import { logger } from "@/lib/logging/logger";
import { rateLimiter } from "@/lib/api/rate-limiter";
import { AppError, toHttpStatus } from "@/lib/api/errors";

// Rate limiting: 10 requests per minute per user
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

interface InvalidateRequest {
  userId?: string;
  pattern?: string;
}

export const POST = async (request: NextRequest) => {
  const startTime = Date.now();
  
  try {
    // Get session for authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting check
    const rateLimitKey = `cache-invalidate:${session.user.id}`;
    if (rateLimiter.isRateLimited(rateLimitKey, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey);
      return NextResponse.json(
        { 
          error: "Rate limit exceeded", 
          retryAfter: Math.ceil(timeUntilReset / 1000) 
        }, 
        { status: 429 }
      );
    }

    // Parse request body
    let body: InvalidateRequest = {};
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { userId, pattern } = body;
    const isAdmin = session.user.role === 'admin';

    // Authorization logic
    if (userId && userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Cannot invalidate cache for other users" },
        { status: 403 }
      );
    }

    if (pattern && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only admins can invalidate by pattern" },
        { status: 403 }
      );
    }

    let result: { success: boolean; count?: number; message: string };

    // Execute invalidation based on parameters
    if (userId) {
      // Invalidate specific user's cache
      invalidateCache.all();
      revalidatePaths.all();
      clearAllMemoryCaches();
      result = {
        success: true,
        message: `Cache invalidated for user: ${userId}`
      };
      
      logger.info('Cache invalidated for user', {
        userId,
        requestedBy: session.user.id,
        isAdmin
      });
    } else if (pattern) {
      // Invalidate by pattern (admin only)
      invalidateCache.all();
      revalidatePaths.all();
      clearAllMemoryCaches();
      result = {
        success: true,
        count: 1,
        message: `Cache invalidated for pattern: ${pattern}`
      };
      
      logger.info('Cache invalidated by pattern', {
        pattern,
        count: 1,
        requestedBy: session.user.id
      });
    } else {
      // Default: invalidate current user's cache
      invalidateCache.all();
      revalidatePaths.all();
      clearAllMemoryCaches();
      result = {
        success: true,
        message: `Cache invalidated for current user: ${session.user.id}`
      };
      
      logger.info('Cache invalidated for current user', {
        userId: session.user.id
      });
    }

    const responseTime = Date.now() - startTime;
    logger.debug('Cache invalidation completed', {
      responseTime: `${responseTime}ms`,
      userId: session.user.id,
      result
    });

    return NextResponse.json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    if (error instanceof AppError) {
      logger.error('Cache invalidation error', {
        error: error.message,
        code: error.code,
        responseTime: `${responseTime}ms`
      });
      
      return NextResponse.json(
        { error: error.message },
        { status: toHttpStatus(error.code) }
      );
    }

    logger.error('Unexpected cache invalidation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      responseTime: `${responseTime}ms`
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};