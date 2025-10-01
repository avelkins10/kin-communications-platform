import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { twilioClient } from '@/lib/twilio/client';
import { metricsCollector } from '@/lib/monitoring/metrics';
import { logger, systemLogger } from '@/lib/logging/logger';
import { memoryCacheOps } from '@/lib/cache';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    twilio: ServiceHealth;
    quickbase: ServiceHealth;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    uptime: number;
    load: number[];
  };
  metrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      averageResponseTime: number;
    };
    errors: {
      total: number;
      rate: number;
    };
    cache: {
      hitRate: number;
      operations: number;
    };
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: string;
  error?: string;
  details?: any;
}

async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get basic database stats
    const [connectionCount, activeQueries] = await Promise.all([
      prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity`,
      prisma.$queryRaw`SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'`,
    ]);

    const responseTime = Date.now() - startTime;
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        connections: (connectionCount as any)[0]?.count || 0,
        activeQueries: (activeQueries as any)[0]?.count || 0,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Database health check failed:', error);
    
    return {
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: (error as Error).message,
    };
  }
}


async function checkTwilio(forceFull = false): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check memory cache first (unless forcing full check)
    if (!forceFull) {
      const cached = memoryCacheOps.getUser('health:twilio');
      if (cached) {
        return {
          ...cached,
          lastChecked: new Date().toISOString(),
        };
      }
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Test Twilio API connectivity with timeout
      const account = await twilioClient.api.accounts(twilioClient.accountSid).fetch();
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const result = {
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          accountSid: account.sid,
          status: account.status,
          type: account.type,
        },
      };

      // Cache the result in memory for 30 seconds
      memoryCacheOps.setUser('health:twilio', result, 30000);
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        // Return degraded status on timeout instead of unhealthy
        const responseTime = Date.now() - startTime;
        const result = {
          status: 'degraded',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: 'Request timeout (5s)',
        };
        
        // Cache degraded result in memory for shorter time
        memoryCacheOps.setUser('health:twilio', result, 10000);
        return result;
      }
      throw error;
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Twilio health check failed:', error);
    
    return {
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: (error as Error).message,
    };
  }
}

async function checkQuickBase(forceFull = false): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    // Check memory cache first (unless forcing full check)
    if (!forceFull) {
      const cached = memoryCacheOps.getUser('health:quickbase');
      if (cached) {
        return {
          ...cached,
          lastChecked: new Date().toISOString(),
        };
      }
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Test QuickBase API connectivity with timeout
      const realmHost = process.env.QUICKBASE_REALM_HOST || `${process.env.QUICKBASE_REALM}.quickbase.com`;
      const baseUrl = `https://${realmHost}`;
      const response = await fetch(`${baseUrl}/apps`, {
        headers: {
          'QB-Realm-Hostname': realmHost,
          'Authorization': `QB-USER-TOKEN ${process.env.QUICKBASE_USER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`QuickBase API returned ${response.status}: ${response.statusText}`);
      }
      
      const result = {
        status: responseTime < 3000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          status: response.status,
          statusText: response.statusText,
        },
      };

      // Cache the result in memory for 30 seconds
      memoryCacheOps.setUser('health:quickbase', result, 30000);
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        // Return degraded status on timeout instead of unhealthy
        const responseTime = Date.now() - startTime;
        const result = {
          status: 'degraded',
          responseTime,
          lastChecked: new Date().toISOString(),
          error: 'Request timeout (5s)',
        };
        
        // Cache degraded result in memory for shorter time
        memoryCacheOps.setUser('health:quickbase', result, 10000);
        return result;
      }
      throw error;
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('QuickBase health check failed:', error);
    
    return {
      status: 'unhealthy',
      responseTime,
      lastChecked: new Date().toISOString(),
      error: (error as Error).message,
    };
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const forceFull = searchParams.get('full') === 'true';
    
    // Run all health checks in parallel
    const [database, twilio, quickbase] = await Promise.all([
      checkDatabase(),
      checkTwilio(forceFull),
      checkQuickBase(forceFull),
    ]);

    // Get system metrics
    const systemMetrics = metricsCollector.getSystemMetrics();
    const applicationMetrics = metricsCollector.getApplicationMetrics();
    
    // Determine overall status
    const serviceStatuses = [database.status, twilio.status, quickbase.status];
    const overallStatus = serviceStatuses.includes('unhealthy') 
      ? 'unhealthy' 
      : serviceStatuses.includes('degraded') 
        ? 'degraded' 
        : 'healthy';

    const healthResult: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      cached: !forceFull, // Indicate if results were from cache
      services: {
        database,
        twilio,
        quickbase,
      },
      system: {
        memory: systemMetrics ? {
          used: systemMetrics.memory.used,
          total: systemMetrics.memory.total,
          percentage: systemMetrics.memory.percentage,
        } : {
          used: 0,
          total: 0,
          percentage: 0,
        },
        uptime: process.uptime(),
        load: systemMetrics ? systemMetrics.cpu.load : [0, 0, 0],
      },
      metrics: {
        requests: applicationMetrics.requests,
        errors: {
          total: applicationMetrics.errors.total,
          rate: applicationMetrics.errors.rate,
        },
        cache: {
          hitRate: applicationMetrics.cache.hitRate,
          operations: applicationMetrics.cache.operations,
        },
      },
    };

    // Log health check
    systemLogger.health('health-check', overallStatus, {
      responseTime: Date.now() - startTime,
      forceFull,
      cached: !forceFull,
      services: Object.keys(healthResult.services).reduce((acc, key) => {
        acc[key] = healthResult.services[key as keyof typeof healthResult.services].status;
        return acc;
      }, {} as Record<string, string>),
    });

    // Return appropriate status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthResult, { status: statusCode });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Health check failed:', error);
    
    const errorResult: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services: {
        database: { status: 'unhealthy', responseTime: 0, lastChecked: new Date().toISOString(), error: 'Health check failed' },
        twilio: { status: 'unhealthy', responseTime: 0, lastChecked: new Date().toISOString(), error: 'Health check failed' },
        quickbase: { status: 'unhealthy', responseTime: 0, lastChecked: new Date().toISOString(), error: 'Health check failed' },
      },
      system: {
        memory: { used: 0, total: 0, percentage: 0 },
        uptime: process.uptime(),
        load: [0, 0, 0],
      },
      metrics: {
        requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
        errors: { total: 0, rate: 0 },
        cache: { hitRate: 0, operations: 0 },
      },
    };

    return NextResponse.json(errorResult, { status: 503 });
  }
}

// Simple health check for load balancers
export async function HEAD(request: NextRequest) {
  try {
    // Quick database check
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
