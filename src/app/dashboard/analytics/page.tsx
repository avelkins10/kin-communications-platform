"use client";
import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/components/socket-provider";
import { useSession } from "next-auth/react";

interface RealTimeMetrics {
  handleRate: number;
  missedCallRate: number;
  asa: number; // Average Speed of Answer in seconds
  abandonRate: number;
  queueDepth: number;
  longestWaitTime: number;
  activeAgents: number;
}

interface SlaCompliance {
  callbackCompliance: number;
  textResponseCompliance: number;
  overdueItems: Array<{
    id: string;
    type: 'voicemail' | 'text' | 'call';
    customer: string;
    overdueBy: number; // minutes
    urgency: 'high' | 'medium' | 'low';
  }>;
  nextSlaBreach: number; // minutes until next breach
}

interface VolumeAnalytics {
  inboundVolume: {
    hourly: Array<{ hour: number; count: number }>;
    daily: Array<{ date: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  outboundVolume: Array<{ agent: string; count: number }>;
  queueDistribution: Array<{ queue: string; count: number }>;
  peakTimes: Array<{ time: string; volume: number }>;
}

interface AgentPerformance {
  callsPerAgent: Array<{ agent: string; count: number }>;
  averageHandleTime: Array<{ agent: string; time: number }>;
  skillMatchSuccess: number;
  fallbackRouteUsage: number;
  utilizationPercentage: number;
}

interface CustomerSatisfaction {
  averageSurveyScore: number;
  googleReviewConversion: number;
  negativeFeedbackQueue: number;
}

export default function AnalyticsPage() {
  const { socket } = useSocket();
  const { data: session } = useSession();
  const [realTimeMetrics, setRealTimeMetrics] = React.useState<RealTimeMetrics>({
    handleRate: 0,
    missedCallRate: 0,
    asa: 0,
    abandonRate: 0,
    queueDepth: 0,
    longestWaitTime: 0,
    activeAgents: 0
  });
  const [slaCompliance, setSlaCompliance] = React.useState<SlaCompliance>({
    callbackCompliance: 0,
    textResponseCompliance: 0,
    overdueItems: [],
    nextSlaBreach: 0
  });
  const [volumeAnalytics, setVolumeAnalytics] = React.useState<VolumeAnalytics>({
    inboundVolume: { hourly: [], daily: [], monthly: [] },
    outboundVolume: [],
    queueDistribution: [],
    peakTimes: []
  });
  const [agentPerformance, setAgentPerformance] = React.useState<AgentPerformance>({
    callsPerAgent: [],
    averageHandleTime: [],
    skillMatchSuccess: 0,
    fallbackRouteUsage: 0,
    utilizationPercentage: 0
  });
  const [customerSatisfaction, setCustomerSatisfaction] = React.useState<CustomerSatisfaction>({
    averageSurveyScore: 0,
    googleReviewConversion: 0,
    negativeFeedbackQueue: 0
  });

  // Real-time metrics refresh every 10 seconds
  React.useEffect(() => {
    const fetchRealTimeMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/realtime');
        if (response.ok) {
          const data = await response.json();
          setRealTimeMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch real-time metrics:', error);
      }
    };

    fetchRealTimeMetrics();
    const interval = setInterval(fetchRealTimeMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  // SLA compliance refresh every 1 minute
  React.useEffect(() => {
    const fetchSlaCompliance = async () => {
      try {
        const response = await fetch('/api/analytics/sla-compliance');
        if (response.ok) {
          const data = await response.json();
          setSlaCompliance(data);
        }
      } catch (error) {
        console.error('Failed to fetch SLA compliance:', error);
      }
    };

    fetchSlaCompliance();
    const interval = setInterval(fetchSlaCompliance, 60000);
    return () => clearInterval(interval);
  }, []);

  // Volume analytics refresh every 5 minutes
  React.useEffect(() => {
    const fetchVolumeAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/volume');
        if (response.ok) {
          const data = await response.json();
          setVolumeAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch volume analytics:', error);
      }
    };

    fetchVolumeAnalytics();
    const interval = setInterval(fetchVolumeAnalytics, 300000);
    return () => clearInterval(interval);
  }, []);

  // Agent performance refresh every 5 minutes
  React.useEffect(() => {
    const fetchAgentPerformance = async () => {
      try {
        const response = await fetch('/api/analytics/agent-performance');
        if (response.ok) {
          const data = await response.json();
          setAgentPerformance(data);
        }
      } catch (error) {
        console.error('Failed to fetch agent performance:', error);
      }
    };

    fetchAgentPerformance();
    const interval = setInterval(fetchAgentPerformance, 300000);
    return () => clearInterval(interval);
  }, []);

  // Customer satisfaction refresh every 5 minutes
  React.useEffect(() => {
    const fetchCustomerSatisfaction = async () => {
      try {
        const response = await fetch('/api/analytics/customer-satisfaction');
        if (response.ok) {
          const data = await response.json();
          setCustomerSatisfaction(data);
        }
      } catch (error) {
        console.error('Failed to fetch customer satisfaction:', error);
      }
    };

    fetchCustomerSatisfaction();
    const interval = setInterval(fetchCustomerSatisfaction, 300000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket events
  React.useEffect(() => {
    if (!socket) return;

    const handleMetricsUpdate = (data: any) => {
      setRealTimeMetrics(prev => ({ ...prev, ...data }));
    };

    const handleSlaUpdate = (data: any) => {
      setSlaCompliance(prev => ({ ...prev, ...data }));
    };

    socket.on('analytics:metrics', handleMetricsUpdate);
    socket.on('analytics:sla', handleSlaUpdate);

    return () => {
      socket.off('analytics:metrics', handleMetricsUpdate);
      socket.off('analytics:sla', handleSlaUpdate);
    };
  }, [socket]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">Live Data</span>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Handle Rate</CardTitle>
            <Badge variant="outline">{realTimeMetrics.handleRate}%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics.handleRate}%</div>
            <p className="text-xs text-muted-foreground">
              Calls answered vs total calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed Call Rate</CardTitle>
            <Badge variant={realTimeMetrics.missedCallRate > 10 ? "destructive" : "outline"}>
              {realTimeMetrics.missedCallRate}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics.missedCallRate}%</div>
            <p className="text-xs text-muted-foreground">
              Calls not answered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ASA</CardTitle>
            <Badge variant="outline">{formatTime(realTimeMetrics.asa)}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(realTimeMetrics.asa)}</div>
            <p className="text-xs text-muted-foreground">
              Average Speed of Answer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandon Rate</CardTitle>
            <Badge variant={realTimeMetrics.abandonRate > 5 ? "destructive" : "outline"}>
              {realTimeMetrics.abandonRate}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics.abandonRate}%</div>
            <p className="text-xs text-muted-foreground">
              Calls abandoned in queue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Queue Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Queue Depth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{realTimeMetrics.queueDepth}</div>
            <p className="text-xs text-muted-foreground">
              Calls waiting in queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Longest Wait Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatTime(realTimeMetrics.longestWaitTime)}</div>
            <p className="text-xs text-muted-foreground">
              Current longest wait
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{realTimeMetrics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              Agents currently available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SLA Compliance</CardTitle>
            <CardDescription>Real-time compliance tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Callback Compliance</span>
              <Badge variant={slaCompliance.callbackCompliance >= 95 ? "default" : "destructive"}>
                {slaCompliance.callbackCompliance}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Text Response Compliance</span>
              <Badge variant={slaCompliance.textResponseCompliance >= 95 ? "default" : "destructive"}>
                {slaCompliance.textResponseCompliance}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Next SLA Breach</span>
              <Badge variant={slaCompliance.nextSlaBreach < 15 ? "destructive" : "outline"}>
                {slaCompliance.nextSlaBreach}m
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue Items</CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            {slaCompliance.overdueItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue items</p>
            ) : (
              <div className="space-y-2">
                {slaCompliance.overdueItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium">{item.customer}</p>
                      <p className="text-xs text-muted-foreground">{item.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getUrgencyColor(item.urgency)}>
                        {item.urgency}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {item.overdueBy}m overdue
                      </span>
                    </div>
                  </div>
                ))}
                {slaCompliance.overdueItems.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{slaCompliance.overdueItems.length - 5} more items
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Volume Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Volume Analytics</CardTitle>
          <CardDescription>Call volume trends and distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Peak Times</h4>
              <div className="space-y-1">
                {volumeAnalytics.peakTimes.slice(0, 3).map((peak, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{peak.time}</span>
                    <span>{peak.volume} calls</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Queue Distribution</h4>
              <div className="space-y-1">
                {volumeAnalytics.queueDistribution.slice(0, 3).map((queue, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{queue.queue}</span>
                    <span>{queue.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Top Agents</h4>
              <div className="space-y-1">
                {volumeAnalytics.outboundVolume.slice(0, 3).map((agent, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{agent.agent}</span>
                    <span>{agent.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Today's Volume</h4>
              <div className="text-2xl font-bold">
                {volumeAnalytics.inboundVolume.daily[0]?.count || 0}
              </div>
              <p className="text-xs text-muted-foreground">Total calls</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
          <CardDescription>Individual and team performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Skill Match Success</h4>
              <div className="text-2xl font-bold">{agentPerformance.skillMatchSuccess}%</div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Fallback Usage</h4>
              <div className="text-2xl font-bold">{agentPerformance.fallbackRouteUsage}%</div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Utilization</h4>
              <div className="text-2xl font-bold">{agentPerformance.utilizationPercentage}%</div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Top Performer</h4>
              <div className="text-sm">
                {agentPerformance.callsPerAgent[0]?.agent || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {agentPerformance.callsPerAgent[0]?.count || 0} calls
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Satisfaction */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Satisfaction</CardTitle>
          <CardDescription>Customer feedback and satisfaction metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Average Survey Score</h4>
              <div className="text-2xl font-bold">{customerSatisfaction.averageSurveyScore}/5</div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Google Review Conversion</h4>
              <div className="text-2xl font-bold">{customerSatisfaction.googleReviewConversion}%</div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Negative Feedback Queue</h4>
              <div className="text-2xl font-bold">{customerSatisfaction.negativeFeedbackQueue}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
