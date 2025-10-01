import { logger } from '../logging/logger';

export interface MetricData {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
}

export interface ApplicationMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  database: {
    queries: number;
    averageQueryTime: number;
    connections: number;
    cacheHitRate: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    operations: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    rate: number;
  };
  users: {
    active: number;
    total: number;
    newToday: number;
  };
}

export interface PerformanceMetrics {
  api: {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    timestamp: number;
  };
  database: {
    operation: string;
    duration: number;
    recordCount: number;
    timestamp: number;
  };
  cache: {
    operation: string;
    duration: number;
    hit: boolean;
    timestamp: number;
  };
}

class MetricsCollector {
  private metrics: Map<string, MetricData[]> = new Map();
  private systemMetrics: SystemMetrics | null = null;
  private applicationMetrics: ApplicationMetrics = {
    requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
    database: { queries: 0, averageQueryTime: 0, connections: 0, cacheHitRate: 0 },
    cache: { hits: 0, misses: 0, hitRate: 0, operations: 0 },
    errors: { total: 0, byType: {}, rate: 0 },
    users: { active: 0, total: 0, newToday: 0 },
  };
  private performanceMetrics: PerformanceMetrics[] = [];
  private maxPerformanceMetrics = 1000;

  // Metric collection methods
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric: MetricData = {
      timestamp: Date.now(),
      value,
      labels,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only last 1000 metrics per type
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }

    logger.debug('Metric recorded', { name, value, labels });
  }

  recordApiRequest(endpoint: string, method: string, responseTime: number, statusCode: number): void {
    const metric: PerformanceMetrics['api'] = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: Date.now(),
    };

    this.performanceMetrics.push(metric);

    // Keep only last maxPerformanceMetrics
    if (this.performanceMetrics.length > this.maxPerformanceMetrics) {
      this.performanceMetrics.splice(0, this.performanceMetrics.length - this.maxPerformanceMetrics);
    }

    // Update application metrics
    this.applicationMetrics.requests.total++;
    if (statusCode >= 200 && statusCode < 400) {
      this.applicationMetrics.requests.successful++;
    } else {
      this.applicationMetrics.requests.failed++;
    }

    // Update average response time
    const total = this.applicationMetrics.requests.total;
    const currentAvg = this.applicationMetrics.requests.averageResponseTime;
    this.applicationMetrics.requests.averageResponseTime = 
      (currentAvg * (total - 1) + responseTime) / total;

    this.recordMetric('api_response_time', responseTime, { endpoint, method, status: statusCode.toString() });
    this.recordMetric('api_requests_total', 1, { endpoint, method, status: statusCode.toString() });
  }

  recordDatabaseQuery(operation: string, duration: number, recordCount?: number): void {
    const metric: PerformanceMetrics['database'] = {
      operation,
      duration,
      recordCount: recordCount || 0,
      timestamp: Date.now(),
    };

    this.performanceMetrics.push(metric);

    // Update application metrics
    this.applicationMetrics.database.queries++;
    const total = this.applicationMetrics.database.queries;
    const currentAvg = this.applicationMetrics.database.averageQueryTime;
    this.applicationMetrics.database.averageQueryTime = 
      (currentAvg * (total - 1) + duration) / total;

    this.recordMetric('database_query_time', duration, { operation });
    this.recordMetric('database_queries_total', 1, { operation });
    if (recordCount) {
      this.recordMetric('database_records_processed', recordCount, { operation });
    }
  }

  recordCacheOperation(operation: string, duration: number, hit: boolean): void {
    const metric: PerformanceMetrics['cache'] = {
      operation,
      duration,
      hit,
      timestamp: Date.now(),
    };

    this.performanceMetrics.push(metric);

    // Update application metrics
    this.applicationMetrics.cache.operations++;
    if (hit) {
      this.applicationMetrics.cache.hits++;
    } else {
      this.applicationMetrics.cache.misses++;
    }

    const total = this.applicationMetrics.cache.hits + this.applicationMetrics.cache.misses;
    this.applicationMetrics.cache.hitRate = total > 0 ? (this.applicationMetrics.cache.hits / total) * 100 : 0;

    this.recordMetric('cache_operation_time', duration, { operation, hit: hit.toString() });
    this.recordMetric('cache_operations_total', 1, { operation, hit: hit.toString() });
  }

  recordError(errorType: string, errorMessage: string): void {
    this.applicationMetrics.errors.total++;
    
    if (!this.applicationMetrics.errors.byType[errorType]) {
      this.applicationMetrics.errors.byType[errorType] = 0;
    }
    this.applicationMetrics.errors.byType[errorType]++;

    // Calculate error rate (errors per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentErrors = this.performanceMetrics.filter(
      m => m.timestamp > oneMinuteAgo && 'error' in m
    ).length;
    this.applicationMetrics.errors.rate = recentErrors;

    this.recordMetric('errors_total', 1, { type: errorType });
    logger.warn('Error recorded', { errorType, errorMessage });
  }

  recordUserActivity(userId: string, action: string): void {
    this.recordMetric('user_activity', 1, { userId, action });
  }

  recordWebhookProcessed(type: 'voice' | 'sms', duration: number, labels?: Record<string, string | boolean>): void {
    // Record webhook processing metrics
    this.recordMetric('webhook_processed', 1, { 
      type, 
      ...Object.fromEntries(
        Object.entries(labels || {}).map(([k, v]) => [k, String(v)])
      )
    });
    
    this.recordMetric('webhook_processing_time', duration, { type });
    
    // Update application metrics
    this.applicationMetrics.requests.total++;
    this.applicationMetrics.requests.successful++; // Webhooks are generally successful if they reach this point
    
    // Update average response time
    const total = this.applicationMetrics.requests.total;
    const currentAvg = this.applicationMetrics.requests.averageResponseTime;
    this.applicationMetrics.requests.averageResponseTime = 
      (currentAvg * (total - 1) + duration) / total;
    
    logger.debug('Webhook processed', { type, duration, labels });
  }

  // System metrics collection
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      // This would typically use system monitoring libraries
      // For now, we'll return mock data
      const systemMetrics: SystemMetrics = {
        cpu: {
          usage: Math.random() * 100,
          load: [Math.random(), Math.random(), Math.random()],
        },
        memory: {
          used: Math.random() * 8 * 1024 * 1024 * 1024, // Random up to 8GB
          total: 8 * 1024 * 1024 * 1024, // 8GB
          percentage: Math.random() * 100,
        },
        disk: {
          used: Math.random() * 100 * 1024 * 1024 * 1024, // Random up to 100GB
          total: 100 * 1024 * 1024 * 1024, // 100GB
          percentage: Math.random() * 100,
        },
        network: {
          bytesIn: Math.random() * 1024 * 1024, // Random up to 1MB
          bytesOut: Math.random() * 1024 * 1024, // Random up to 1MB
        },
      };

      this.systemMetrics = systemMetrics;
      return systemMetrics;
    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
      throw error;
    }
  }

  // Get metrics methods
  getMetrics(name: string, timeRange?: { start: number; end: number }): MetricData[] {
    const metrics = this.metrics.get(name) || [];
    
    if (timeRange) {
      return metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return metrics;
  }

  getSystemMetrics(): SystemMetrics | null {
    return this.systemMetrics;
  }

  getApplicationMetrics(): ApplicationMetrics {
    return { ...this.applicationMetrics };
  }

  getPerformanceMetrics(timeRange?: { start: number; end: number }): PerformanceMetrics[] {
    if (timeRange) {
      return this.performanceMetrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return [...this.performanceMetrics];
  }

  // Aggregation methods
  getAverageMetric(name: string, timeRange?: { start: number; end: number }): number {
    const metrics = this.getMetrics(name, timeRange);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  getMaxMetric(name: string, timeRange?: { start: number; end: number }): number {
    const metrics = this.getMetrics(name, timeRange);
    if (metrics.length === 0) return 0;
    
    return Math.max(...metrics.map(m => m.value));
  }

  getMinMetric(name: string, timeRange?: { start: number; end: number }): number {
    const metrics = this.getMetrics(name, timeRange);
    if (metrics.length === 0) return 0;
    
    return Math.min(...metrics.map(m => m.value));
  }

  getSumMetric(name: string, timeRange?: { start: number; end: number }): number {
    const metrics = this.getMetrics(name, timeRange);
    return metrics.reduce((acc, m) => acc + m.value, 0);
  }

  // Health check methods
  isHealthy(): boolean {
    const errorRate = this.applicationMetrics.errors.rate;
    const avgResponseTime = this.applicationMetrics.requests.averageResponseTime;
    const cacheHitRate = this.applicationMetrics.cache.hitRate;
    
    return (
      errorRate < 10 && // Less than 10 errors per minute
      avgResponseTime < 2000 && // Less than 2 seconds average response time
      cacheHitRate > 70 // More than 70% cache hit rate
    );
  }

  getHealthStatus(): {
    healthy: boolean;
    issues: string[];
    metrics: {
      errorRate: number;
      avgResponseTime: number;
      cacheHitRate: number;
    };
  } {
    const issues: string[] = [];
    const errorRate = this.applicationMetrics.errors.rate;
    const avgResponseTime = this.applicationMetrics.requests.averageResponseTime;
    const cacheHitRate = this.applicationMetrics.cache.hitRate;

    if (errorRate >= 10) {
      issues.push(`High error rate: ${errorRate} errors per minute`);
    }

    if (avgResponseTime >= 2000) {
      issues.push(`Slow response time: ${avgResponseTime}ms average`);
    }

    if (cacheHitRate < 70) {
      issues.push(`Low cache hit rate: ${cacheHitRate.toFixed(2)}%`);
    }

    return {
      healthy: issues.length === 0,
      issues,
      metrics: {
        errorRate,
        avgResponseTime,
        cacheHitRate,
      },
    };
  }

  // Export methods
  exportMetrics(): {
    system: SystemMetrics | null;
    application: ApplicationMetrics;
    performance: PerformanceMetrics[];
    custom: Record<string, MetricData[]>;
  } {
    return {
      system: this.systemMetrics,
      application: this.applicationMetrics,
      performance: this.performanceMetrics,
      custom: Object.fromEntries(this.metrics),
    };
  }

  // Reset methods
  resetMetrics(): void {
    this.metrics.clear();
    this.performanceMetrics = [];
    this.applicationMetrics = {
      requests: { total: 0, successful: 0, failed: 0, averageResponseTime: 0 },
      database: { queries: 0, averageQueryTime: 0, connections: 0, cacheHitRate: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0, operations: 0 },
      errors: { total: 0, byType: {}, rate: 0 },
      users: { active: 0, total: 0, newToday: 0 },
    };
    logger.info('Metrics reset');
  }

  // Cleanup old metrics
  cleanupOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 hours
    const cutoff = Date.now() - maxAge;
    
    for (const [name, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      this.metrics.set(name, filtered);
    }
    
    this.performanceMetrics = this.performanceMetrics.filter(m => m.timestamp > cutoff);
    
    logger.info('Old metrics cleaned up');
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();

// Start system metrics collection (only in production with explicit flag or non-serverless environments)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_METRICS_CRON === 'true' || 
    process.env.NODE_ENV !== 'production') {
  setInterval(async () => {
    try {
      await metricsCollector.collectSystemMetrics();
    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }, 30000); // Every 30 seconds

  // Cleanup old metrics every hour
  setInterval(() => {
    metricsCollector.cleanupOldMetrics();
  }, 60 * 60 * 1000); // Every hour
}

export default metricsCollector;
