'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Server,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemMetrics {
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

interface ApplicationMetrics {
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

interface PerformanceData {
  system: SystemMetrics | null;
  application: ApplicationMetrics;
  timestamp: string;
}

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/metrics?includeSystem=true&timeRange=1h');
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required to view performance metrics.');
        } else if (response.status === 401) {
          throw new Error('Authentication required. Please log in to view performance metrics.');
        } else {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }
      }
      
      const metricsData = await response.json();
      
      setData({
        system: metricsData.system,
        application: metricsData.application,
        timestamp: metricsData.timestamp,
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      console.error('Error fetching metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (value <= thresholds.warning) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <Button variant="outline" size="sm" disabled>
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Failed to load metrics: {error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { system, application } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(application.requests.averageResponseTime)}
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getStatusIcon(application.requests.averageResponseTime, { good: 500, warning: 1000 })}
                  <span className={getStatusColor(application.requests.averageResponseTime, { good: 500, warning: 1000 })}>
                    {application.requests.averageResponseTime < 500 ? 'Excellent' :
                     application.requests.averageResponseTime < 1000 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {application.errors.rate.toFixed(1)}/min
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getStatusIcon(application.errors.rate, { good: 1, warning: 5 })}
                  <span className={getStatusColor(application.errors.rate, { good: 1, warning: 5 })}>
                    {application.errors.rate < 1 ? 'Low' :
                     application.errors.rate < 5 ? 'Moderate' : 'High'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {application.cache.hitRate.toFixed(1)}%
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  {getStatusIcon(100 - application.cache.hitRate, { good: 20, warning: 40 })}
                  <span className={getStatusColor(100 - application.cache.hitRate, { good: 20, warning: 40 })}>
                    {application.cache.hitRate > 80 ? 'Excellent' :
                     application.cache.hitRate > 60 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {application.users.active}
                </div>
                <p className="text-xs text-muted-foreground">
                  {application.users.total} total users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* System Resources */}
          {system && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <Server className="h-4 w-4" />
                    <span>CPU Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usage</span>
                      <span className={getStatusColor(system.cpu.usage, { good: 50, warning: 80 })}>
                        {system.cpu.usage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={system.cpu.usage} 
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      Load: {system.cpu.load.map(l => l.toFixed(2)).join(', ')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <span>Memory Usage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usage</span>
                      <span className={getStatusColor(system.memory.percentage, { good: 70, warning: 85 })}>
                        {system.memory.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={system.memory.percentage} 
                      className="h-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      {formatBytes(system.memory.used)} / {formatBytes(system.memory.total)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <Activity className="h-4 w-4" />
                    <span>Network I/O</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>In</span>
                      <span>{formatBytes(system.network.bytesIn)}/s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Out</span>
                      <span>{formatBytes(system.network.bytesOut)}/s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {system ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Resources</CardTitle>
                  <CardDescription>Current system resource utilization</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">CPU Usage</span>
                      <span className="text-sm">{system.cpu.usage.toFixed(1)}%</span>
                    </div>
                    <Progress value={system.cpu.usage} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm">{system.memory.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={system.memory.percentage} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Disk Usage</span>
                      <span className="text-sm">{system.disk.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={system.disk.percentage} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Load</CardTitle>
                  <CardDescription>System load averages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {system.cpu.load.map((load, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">
                          {index === 0 ? '1 minute' : index === 1 ? '5 minutes' : '15 minutes'}
                        </span>
                        <Badge variant={load > 1 ? 'destructive' : load > 0.7 ? 'secondary' : 'default'}>
                          {load.toFixed(2)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  System metrics not available
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="application" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Metrics</CardTitle>
                <CardDescription>API request performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Requests</span>
                  <span className="font-medium">{application.requests.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Successful</span>
                  <span className="font-medium text-green-600">
                    {application.requests.successful.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Failed</span>
                  <span className="font-medium text-red-600">
                    {application.requests.failed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Response Time</span>
                  <span className="font-medium">
                    {formatDuration(application.requests.averageResponseTime)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Metrics</CardTitle>
                <CardDescription>Application error tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Errors</span>
                  <span className="font-medium">{application.errors.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Error Rate</span>
                  <span className="font-medium">
                    {application.errors.rate.toFixed(1)}/min
                  </span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Errors by Type</span>
                  {Object.entries(application.errors?.byType || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
                <CardDescription>Database query metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Queries</span>
                  <span className="font-medium">{application.database.queries.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Average Query Time</span>
                  <span className="font-medium">
                    {formatDuration(application.database.averageQueryTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Connections</span>
                  <span className="font-medium">{application.database.connections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cache Hit Rate</span>
                  <span className="font-medium">
                    {application.database.cacheHitRate.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cache Performance</CardTitle>
                <CardDescription>Next.js and memory cache metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Cache Hits</span>
                  <span className="font-medium text-green-600">
                    {application.cache.hits.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Cache Misses</span>
                  <span className="font-medium text-red-600">
                    {application.cache.misses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Hit Rate</span>
                  <span className="font-medium">
                    {application.cache.hitRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Operations</span>
                  <span className="font-medium">
                    {application.cache.operations.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PerformanceDashboard;
