"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocket } from "@/components/socket-provider";
import { cn } from "@/lib/utils";
import { 
  Phone, 
  Voicemail, 
  MessageSquare, 
  CheckCircle, 
  Users, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

interface CounterData {
  value: number;
  previousValue?: number;
  trend?: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface QueueCounters {
  waitingCalls: CounterData;
  newVoicemails: CounterData;
  activeTasks: CounterData;
  unreadMessages: CounterData;
  slaViolations: CounterData;
}

interface PerformanceCounters {
  handleRate: CounterData;
  averageSpeedOfAnswer: CounterData;
  abandonRate: CounterData;
  agentUtilization: CounterData;
}

interface PresenceCounters {
  availableAgents: CounterData;
  busyAgents: CounterData;
  offlineAgents: CounterData;
}

interface RealtimeCountersProps {
  type: 'queue' | 'performance' | 'presence' | 'all';
  size?: 'sm' | 'md' | 'lg';
  showTrends?: boolean;
  showLastUpdated?: boolean;
  className?: string;
}

export function RealtimeCounters({
  type,
  size = 'md',
  showTrends = true,
  showLastUpdated = false,
  className
}: RealtimeCountersProps) {
  const { socket } = useSocket();
  const [queueCounters, setQueueCounters] = React.useState<QueueCounters>({
    waitingCalls: { value: 0, lastUpdated: new Date() },
    newVoicemails: { value: 0, lastUpdated: new Date() },
    activeTasks: { value: 0, lastUpdated: new Date() },
    unreadMessages: { value: 0, lastUpdated: new Date() },
    slaViolations: { value: 0, lastUpdated: new Date() }
  });
  const [performanceCounters, setPerformanceCounters] = React.useState<PerformanceCounters>({
    handleRate: { value: 0, lastUpdated: new Date() },
    averageSpeedOfAnswer: { value: 0, lastUpdated: new Date() },
    abandonRate: { value: 0, lastUpdated: new Date() },
    agentUtilization: { value: 0, lastUpdated: new Date() }
  });
  const [presenceCounters, setPresenceCounters] = React.useState<PresenceCounters>({
    availableAgents: { value: 0, lastUpdated: new Date() },
    busyAgents: { value: 0, lastUpdated: new Date() },
    offlineAgents: { value: 0, lastUpdated: new Date() }
  });

  // Real-time socket events
  React.useEffect(() => {
    if (!socket) return;

    const handleQueueUpdate = (data: any) => {
      setQueueCounters(prev => ({
        waitingCalls: { 
          value: data.waitingCalls || 0, 
          previousValue: prev.waitingCalls.value,
          trend: calculateTrend(prev.waitingCalls.value, data.waitingCalls || 0),
          lastUpdated: new Date() 
        },
        newVoicemails: { 
          value: data.newVoicemails || 0, 
          previousValue: prev.newVoicemails.value,
          trend: calculateTrend(prev.newVoicemails.value, data.newVoicemails || 0),
          lastUpdated: new Date() 
        },
        activeTasks: { 
          value: data.activeTasks || 0, 
          previousValue: prev.activeTasks.value,
          trend: calculateTrend(prev.activeTasks.value, data.activeTasks || 0),
          lastUpdated: new Date() 
        },
        unreadMessages: { 
          value: data.unreadMessages || 0, 
          previousValue: prev.unreadMessages.value,
          trend: calculateTrend(prev.unreadMessages.value, data.unreadMessages || 0),
          lastUpdated: new Date() 
        },
        slaViolations: { 
          value: data.slaViolations || 0, 
          previousValue: prev.slaViolations.value,
          trend: calculateTrend(prev.slaViolations.value, data.slaViolations || 0),
          lastUpdated: new Date() 
        }
      }));
    };

    const handlePerformanceUpdate = (data: any) => {
      setPerformanceCounters(prev => ({
        handleRate: { 
          value: data.handleRate || 0, 
          previousValue: prev.handleRate.value,
          trend: calculateTrend(prev.handleRate.value, data.handleRate || 0),
          lastUpdated: new Date() 
        },
        averageSpeedOfAnswer: { 
          value: data.averageSpeedOfAnswer || 0, 
          previousValue: prev.averageSpeedOfAnswer.value,
          trend: calculateTrend(prev.averageSpeedOfAnswer.value, data.averageSpeedOfAnswer || 0),
          lastUpdated: new Date() 
        },
        abandonRate: { 
          value: data.abandonRate || 0, 
          previousValue: prev.abandonRate.value,
          trend: calculateTrend(prev.abandonRate.value, data.abandonRate || 0),
          lastUpdated: new Date() 
        },
        agentUtilization: { 
          value: data.agentUtilization || 0, 
          previousValue: prev.agentUtilization.value,
          trend: calculateTrend(prev.agentUtilization.value, data.agentUtilization || 0),
          lastUpdated: new Date() 
        }
      }));
    };

    const handlePresenceUpdate = (data: any) => {
      setPresenceCounters(prev => ({
        availableAgents: { 
          value: data.availableAgents || 0, 
          previousValue: prev.availableAgents.value,
          trend: calculateTrend(prev.availableAgents.value, data.availableAgents || 0),
          lastUpdated: new Date() 
        },
        busyAgents: { 
          value: data.busyAgents || 0, 
          previousValue: prev.busyAgents.value,
          trend: calculateTrend(prev.busyAgents.value, data.busyAgents || 0),
          lastUpdated: new Date() 
        },
        offlineAgents: { 
          value: data.offlineAgents || 0, 
          previousValue: prev.offlineAgents.value,
          trend: calculateTrend(prev.offlineAgents.value, data.offlineAgents || 0),
          lastUpdated: new Date() 
        }
      }));
    };

    socket.on('counters:queue', handleQueueUpdate);
    socket.on('counters:performance', handlePerformanceUpdate);
    socket.on('counters:presence', handlePresenceUpdate);

    return () => {
      socket.off('counters:queue', handleQueueUpdate);
      socket.off('counters:performance', handlePerformanceUpdate);
      socket.off('counters:presence', handlePresenceUpdate);
    };
  }, [socket]);

  const calculateTrend = (previous: number, current: number): 'up' | 'down' | 'stable' => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable': return <Minus className="h-3 w-3 text-gray-500" />;
      default: return null;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return {
        card: 'p-2',
        title: 'text-xs',
        value: 'text-lg',
        icon: 'h-3 w-3'
      };
      case 'md': return {
        card: 'p-3',
        title: 'text-sm',
        value: 'text-xl',
        icon: 'h-4 w-4'
      };
      case 'lg': return {
        card: 'p-4',
        title: 'text-base',
        value: 'text-2xl',
        icon: 'h-5 w-5'
      };
    }
  };

  const sizeClasses = getSizeClasses();

  const CounterCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    variant = 'default',
    lastUpdated 
  }: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down' | 'stable';
    variant?: 'default' | 'destructive' | 'warning';
    lastUpdated?: Date;
  }) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'destructive': return 'border-red-200 bg-red-50';
        case 'warning': return 'border-yellow-200 bg-yellow-50';
        default: return 'border-gray-200 bg-white';
      }
    };

    return (
      <Card className={cn("transition-all duration-200", getVariantClasses())}>
        <CardContent className={sizeClasses.card}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={cn(sizeClasses.icon, "text-muted-foreground")} />
              <span className={cn("font-medium", sizeClasses.title)}>{title}</span>
            </div>
            {showTrends && trend && getTrendIcon(trend)}
          </div>
          <div className="mt-2">
            <div className={cn("font-bold", sizeClasses.value)}>{value}</div>
            {showLastUpdated && lastUpdated && (
              <div className="text-xs text-muted-foreground">
                {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderQueueCounters = () => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <CounterCard
        title="Waiting Calls"
        value={queueCounters.waitingCalls.value}
        icon={Phone}
        trend={queueCounters.waitingCalls.trend}
        variant={queueCounters.waitingCalls.value > 10 ? 'warning' : 'default'}
        lastUpdated={queueCounters.waitingCalls.lastUpdated}
      />
      <CounterCard
        title="New Voicemails"
        value={queueCounters.newVoicemails.value}
        icon={Voicemail}
        trend={queueCounters.newVoicemails.trend}
        variant={queueCounters.newVoicemails.value > 5 ? 'warning' : 'default'}
        lastUpdated={queueCounters.newVoicemails.lastUpdated}
      />
      <CounterCard
        title="Active Tasks"
        value={queueCounters.activeTasks.value}
        icon={CheckCircle}
        trend={queueCounters.activeTasks.trend}
        lastUpdated={queueCounters.activeTasks.lastUpdated}
      />
      <CounterCard
        title="Unread Messages"
        value={queueCounters.unreadMessages.value}
        icon={MessageSquare}
        trend={queueCounters.unreadMessages.trend}
        variant={queueCounters.unreadMessages.value > 20 ? 'warning' : 'default'}
        lastUpdated={queueCounters.unreadMessages.lastUpdated}
      />
      <CounterCard
        title="SLA Violations"
        value={queueCounters.slaViolations.value}
        icon={AlertTriangle}
        trend={queueCounters.slaViolations.trend}
        variant={queueCounters.slaViolations.value > 0 ? 'destructive' : 'default'}
        lastUpdated={queueCounters.slaViolations.lastUpdated}
      />
    </div>
  );

  const renderPerformanceCounters = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <CounterCard
        title="Handle Rate"
        value={performanceCounters.handleRate.value}
        icon={TrendingUp}
        trend={performanceCounters.handleRate.trend}
        lastUpdated={performanceCounters.handleRate.lastUpdated}
      />
      <CounterCard
        title="ASA (seconds)"
        value={performanceCounters.averageSpeedOfAnswer.value}
        icon={Clock}
        trend={performanceCounters.averageSpeedOfAnswer.trend}
        variant={performanceCounters.averageSpeedOfAnswer.value > 30 ? 'warning' : 'default'}
        lastUpdated={performanceCounters.averageSpeedOfAnswer.lastUpdated}
      />
      <CounterCard
        title="Abandon Rate"
        value={performanceCounters.abandonRate.value}
        icon={TrendingDown}
        trend={performanceCounters.abandonRate.trend}
        variant={performanceCounters.abandonRate.value > 5 ? 'destructive' : 'default'}
        lastUpdated={performanceCounters.abandonRate.lastUpdated}
      />
      <CounterCard
        title="Utilization"
        value={performanceCounters.agentUtilization.value}
        icon={Users}
        trend={performanceCounters.agentUtilization.trend}
        lastUpdated={performanceCounters.agentUtilization.lastUpdated}
      />
    </div>
  );

  const renderPresenceCounters = () => (
    <div className="grid grid-cols-3 gap-3">
      <CounterCard
        title="Available"
        value={presenceCounters.availableAgents.value}
        icon={Users}
        trend={presenceCounters.availableAgents.trend}
        variant={presenceCounters.availableAgents.value === 0 ? 'warning' : 'default'}
        lastUpdated={presenceCounters.availableAgents.lastUpdated}
      />
      <CounterCard
        title="Busy"
        value={presenceCounters.busyAgents.value}
        icon={Clock}
        trend={presenceCounters.busyAgents.trend}
        lastUpdated={presenceCounters.busyAgents.lastUpdated}
      />
      <CounterCard
        title="Offline"
        value={presenceCounters.offlineAgents.value}
        icon={Users}
        trend={presenceCounters.offlineAgents.trend}
        lastUpdated={presenceCounters.offlineAgents.lastUpdated}
      />
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {type === 'queue' && renderQueueCounters()}
      {type === 'performance' && renderPerformanceCounters()}
      {type === 'presence' && renderPresenceCounters()}
      {type === 'all' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Queue Status</h3>
            {renderQueueCounters()}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
            {renderPerformanceCounters()}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Agent Presence</h3>
            {renderPresenceCounters()}
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationBadgeProps {
  count: number;
  maxDisplay?: number;
  variant?: 'default' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export function NotificationBadge({
  count,
  maxDisplay = 99,
  variant = 'destructive',
  size = 'md',
  className,
  animated = true
}: NotificationBadgeProps) {
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (animated && count > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [count, animated]);

  if (count === 0) return null;

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4 text-xs';
      case 'md': return 'h-5 w-5 text-xs';
      case 'lg': return 'h-6 w-6 text-sm';
    }
  };

  return (
    <Badge
      variant={variant}
      className={cn(
        "absolute -top-1 -right-1 flex items-center justify-center p-0 font-medium",
        getSizeClasses(),
        animated && isAnimating && "animate-pulse scale-110",
        className
      )}
    >
      {count > maxDisplay ? `${maxDisplay}+` : count}
    </Badge>
  );
}

interface LiveIndicatorProps {
  isLive?: boolean;
  className?: string;
}

export function LiveIndicator({ isLive = true, className }: LiveIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "h-2 w-2 rounded-full",
        isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"
      )} />
      <span className="text-xs text-muted-foreground">
        {isLive ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}
