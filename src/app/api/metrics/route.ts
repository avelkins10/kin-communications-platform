import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/monitoring/metrics';
import { logger } from '@/lib/logging/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UnauthorizedError } from '@/lib/errors';

export interface MetricsResponse {
  timestamp: string;
  timeRange: {
    start: number;
    end: number;
  };
  system: any;
  application: any;
  performance: any[];
  custom: Record<string, any[]>;
  aggregated: {
    api: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
      topEndpoints: Array<{
        endpoint: string;
        method: string;
        count: number;
        averageResponseTime: number;
      }>;
    };
    database: {
      totalQueries: number;
      averageQueryTime: number;
      topOperations: Array<{
        operation: string;
        count: number;
        averageTime: number;
      }>;
    };
    cache: {
      totalOperations: number;
      hitRate: number;
      averageOperationTime: number;
    };
  };
}

function getTimeRange(query: URLSearchParams): { start: number; end: number } {
  const now = Date.now();
  const timeRange = query.get('timeRange') || '1h';
  
  let start: number;
  switch (timeRange) {
    case '5m':
      start = now - 5 * 60 * 1000;
      break;
    case '15m':
      start = now - 15 * 60 * 1000;
      break;
    case '1h':
      start = now - 60 * 60 * 1000;
      break;
    case '6h':
      start = now - 6 * 60 * 60 * 1000;
      break;
    case '24h':
      start = now - 24 * 60 * 60 * 1000;
      break;
    case '7d':
      start = now - 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      start = now - 60 * 60 * 1000; // Default to 1 hour
  }
  
  return { start, end: now };
}

function aggregateApiMetrics(performanceMetrics: any[], timeRange: { start: number; end: number }) {
  const apiMetrics = performanceMetrics.filter(
    m => 'endpoint' in m && m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
  );
  
  if (apiMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      topEndpoints: [],
    };
  }
  
  const totalRequests = apiMetrics.length;
  const averageResponseTime = apiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
  const errorCount = apiMetrics.filter(m => m.statusCode >= 400).length;
  const errorRate = (errorCount / totalRequests) * 100;
  
  // Group by endpoint and method
  const endpointGroups = apiMetrics.reduce((acc, m) => {
    const key = `${m.method} ${m.endpoint}`;
    if (!acc[key]) {
      acc[key] = {
        endpoint: m.endpoint,
        method: m.method,
        count: 0,
        totalResponseTime: 0,
      };
    }
    acc[key].count++;
    acc[key].totalResponseTime += m.responseTime;
    return acc;
  }, {} as Record<string, any>);
  
  const topEndpoints = Object.values(endpointGroups)
    .map((group: any) => ({
      endpoint: group.endpoint,
      method: group.method,
      count: group.count,
      averageResponseTime: group.totalResponseTime / group.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalRequests,
    averageResponseTime,
    errorRate,
    topEndpoints,
  };
}

function aggregateDatabaseMetrics(performanceMetrics: any[], timeRange: { start: number; end: number }) {
  const dbMetrics = performanceMetrics.filter(
    m => 'operation' in m && m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
  );
  
  if (dbMetrics.length === 0) {
    return {
      totalQueries: 0,
      averageQueryTime: 0,
      topOperations: [],
    };
  }
  
  const totalQueries = dbMetrics.length;
  const averageQueryTime = dbMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries;
  
  // Group by operation
  const operationGroups = dbMetrics.reduce((acc, m) => {
    if (!acc[m.operation]) {
      acc[m.operation] = {
        operation: m.operation,
        count: 0,
        totalTime: 0,
      };
    }
    acc[m.operation].count++;
    acc[m.operation].totalTime += m.duration;
    return acc;
  }, {} as Record<string, any>);
  
  const topOperations = Object.values(operationGroups)
    .map((group: any) => ({
      operation: group.operation,
      count: group.count,
      averageTime: group.totalTime / group.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalQueries,
    averageQueryTime,
    topOperations,
  };
}

function aggregateCacheMetrics(performanceMetrics: any[], timeRange: { start: number; end: number }) {
  const cacheMetrics = performanceMetrics.filter(
    m => 'hit' in m && m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
  );
  
  if (cacheMetrics.length === 0) {
    return {
      totalOperations: 0,
      hitRate: 0,
      averageOperationTime: 0,
    };
  }
  
  const totalOperations = cacheMetrics.length;
  const hits = cacheMetrics.filter(m => m.hit).length;
  const hitRate = (hits / totalOperations) * 100;
  const averageOperationTime = cacheMetrics.reduce((sum, m) => sum + m.duration, 0) / totalOperations;
  
  return {
    totalOperations,
    hitRate,
    averageOperationTime,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authorization: require admin session or valid API key
    // Note: METRICS_API_KEY environment variable is required when using API key authentication
    const session = await getServerSession(authOptions);
    const providedApiKey = request.headers.get('authorization')?.replace('Bearer ', '') || request.nextUrl.searchParams.get('apiKey');
    const configuredApiKey = process.env.METRICS_API_KEY;

    const isAdmin = !!(session?.user && (session.user as any).role === 'admin');
    const isKeyValid = !!configuredApiKey && providedApiKey === configuredApiKey;

    if (!isAdmin && !isKeyValid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const timeRange = getTimeRange(searchParams);
    const includeSystem = searchParams.get('includeSystem') === 'true';
    const includeCustom = searchParams.get('includeCustom') === 'true';
    
    // Get metrics data
    const systemMetrics = includeSystem ? metricsCollector.getSystemMetrics() : null;
    const applicationMetrics = metricsCollector.getApplicationMetrics();
    const performanceMetrics = metricsCollector.getPerformanceMetrics(timeRange);
    const customMetrics = includeCustom ? 
      Object.fromEntries(
        Object.entries(metricsCollector.exportMetrics().custom).map(([name, metrics]) => [
          name,
          metrics.filter(m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end)
        ])
      ) : {};
    
    // Aggregate performance metrics
    const aggregated = {
      api: aggregateApiMetrics(performanceMetrics, timeRange),
      database: aggregateDatabaseMetrics(performanceMetrics, timeRange),
      cache: aggregateCacheMetrics(performanceMetrics, timeRange),
    };
    
    const response: MetricsResponse = {
      timestamp: new Date().toISOString(),
      timeRange,
      system: systemMetrics,
      application: applicationMetrics,
      performance: performanceMetrics,
      custom: customMetrics,
      aggregated,
    };
    
    // Log metrics request
    logger.info('Metrics requested', {
      timeRange: `${timeRange.end - timeRange.start}ms`,
      includeSystem,
      includeCustom,
      performanceMetricsCount: performanceMetrics.length,
    });
    
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Metrics request failed:', error);
    
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}

// Export metrics in Prometheus format
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    
    if (format === 'prometheus') {
      const timeRange = getTimeRange(searchParams);
      const performanceMetrics = metricsCollector.getPerformanceMetrics(timeRange);
      const applicationMetrics = metricsCollector.getApplicationMetrics();
      
      let prometheusOutput = '';
      
      // API metrics
      const apiMetrics = performanceMetrics.filter(m => 'endpoint' in m);
      if (apiMetrics.length > 0) {
        prometheusOutput += '# HELP api_requests_total Total number of API requests\n';
        prometheusOutput += '# TYPE api_requests_total counter\n';
        
        const endpointGroups = apiMetrics.reduce((acc, m) => {
          const key = `${m.method}_${m.endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
          if (!acc[key]) {
            acc[key] = { method: m.method, endpoint: m.endpoint, count: 0 };
          }
          acc[key].count++;
          return acc;
        }, {} as Record<string, any>);
        
        for (const [key, group] of Object.entries(endpointGroups)) {
          prometheusOutput += `api_requests_total{method="${group.method}",endpoint="${group.endpoint}"} ${group.count}\n`;
        }
      }
      
      // Application metrics
      prometheusOutput += `# HELP application_requests_total Total application requests\n`;
      prometheusOutput += `# TYPE application_requests_total counter\n`;
      prometheusOutput += `application_requests_total ${applicationMetrics.requests.total}\n`;
      
      prometheusOutput += `# HELP application_errors_total Total application errors\n`;
      prometheusOutput += `# TYPE application_errors_total counter\n`;
      prometheusOutput += `application_errors_total ${applicationMetrics.errors.total}\n`;
      
      prometheusOutput += `# HELP cache_hit_rate Cache hit rate percentage\n`;
      prometheusOutput += `# TYPE cache_hit_rate gauge\n`;
      prometheusOutput += `cache_hit_rate ${applicationMetrics.cache.hitRate}\n`;
      
      return new NextResponse(prometheusOutput, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        },
      });
    }
    
    // Default to JSON format
    return GET(request);
  } catch (error) {
    logger.error('Metrics export failed:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to export metrics' },
      { status: 500 }
    );
  }
}
