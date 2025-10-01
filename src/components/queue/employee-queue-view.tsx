"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QueueItemList } from "@/components/ui/queue-item-card";
import { RealtimeCounters } from "@/components/ui/realtime-counters";
import { useQueue } from "@/lib/hooks/use-queue";
import { useLayout } from "@/lib/hooks/use-layout";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  User, 
  Clock, 
  Target,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Bell,
  BellOff
} from "lucide-react";

interface PersonalMetrics {
  itemsAssigned: number;
  itemsCompleted: number;
  itemsOverdue: number;
  averageHandleTime: number;
  slaCompliance: number;
  dailyGoal: number;
  goalProgress: number;
  efficiency: number;
  streak: {
    current: number;
    longest: number;
  };
}

interface StatusConfig {
  status: 'available' | 'busy' | 'wrap-up' | 'offline';
  label: string;
  color: string;
  description: string;
}

const statusConfigs: StatusConfig[] = [
  {
    status: 'available',
    label: 'Available',
    color: 'bg-green-500',
    description: 'Ready to take new items'
  },
  {
    status: 'busy',
    label: 'Busy',
    color: 'bg-yellow-500',
    description: 'Currently working on items'
  },
  {
    status: 'wrap-up',
    label: 'Wrap-up',
    color: 'bg-blue-500',
    description: 'Completing current work'
  },
  {
    status: 'offline',
    label: 'Offline',
    color: 'bg-gray-500',
    description: 'Not available for new items'
  }
];

export function EmployeeQueueView() {
  const { data: session } = useSession();
  const {
    items,
    selectedItem,
    stats,
    loading,
    error,
    filters,
    sort,
    setFilters,
    setSort,
    clearFilters,
    selectItem,
    assignItem,
    completeItem,
    callbackItem,
    escalateItem,
    bulkAction,
    switchToMode,
    getLayoutModeForItem,
    refresh,
    isConnected
  } = useQueue();

  const { mode, setMode } = useLayout();

  const [personalMetrics, setPersonalMetrics] = React.useState<PersonalMetrics>({
    itemsAssigned: 0,
    itemsCompleted: 0,
    itemsOverdue: 0,
    averageHandleTime: 0,
    slaCompliance: 0,
    dailyGoal: 20,
    goalProgress: 0,
    efficiency: 0,
    streak: {
      current: 0,
      longest: 0
    }
  });
  const [currentStatus, setCurrentStatus] = React.useState<'available' | 'busy' | 'wrap-up' | 'offline'>('available');
  const [showFilters, setShowFilters] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [quickActions, setQuickActions] = React.useState<string[]>([]);

  const userId = (session?.user as any)?.id;
  const userName = session?.user?.name || 'Employee';

  // Fetch personal metrics
  React.useEffect(() => {
    const fetchPersonalMetrics = async () => {
      try {
        const response = await fetch(`/api/employee/metrics/${userId}`);
        if (response.ok) {
          const data = await response.json();
          // Map the API response to the expected structure
          setPersonalMetrics({
            itemsAssigned: data.stats?.assigned || 0,
            itemsCompleted: data.stats?.completed || 0,
            itemsOverdue: data.stats?.overdue || 0,
            averageHandleTime: data.stats?.averageHandleTime || 0,
            slaCompliance: data.stats?.slaCompliance || 0,
            dailyGoal: data.goals?.daily?.target || 20,
            goalProgress: data.goals?.daily?.completed || 0,
            efficiency: data.stats?.efficiency || 0,
            streak: data.streak || { current: 0, longest: 0 }
          });
        }
      } catch (error) {
        console.error('Failed to fetch personal metrics:', error);
      }
    };

    if (userId) {
      fetchPersonalMetrics();
      const interval = setInterval(fetchPersonalMetrics, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Update status
  const updateStatus = async (newStatus: 'available' | 'busy' | 'wrap-up' | 'offline') => {
    try {
      const response = await fetch('/api/employee/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setCurrentStatus(newStatus);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleItemAction = (action: string, item: any) => {
    switch (action) {
      case 'complete':
        completeItem(item.id);
        break;
      case 'callback':
        callbackItem(item.id);
        break;
      case 'escalate':
        escalateItem(item.id, 'Employee escalation');
        break;
      case 'select':
        selectItem(item);
        const layoutMode = getLayoutModeForItem(item);
        switchToMode(layoutMode);
        break;
    }
  };

  const handleQuickAction = (action: string) => {
    // Handle common quick actions
    switch (action) {
      case 'mark-available':
        updateStatus('available');
        break;
      case 'mark-busy':
        updateStatus('busy');
        break;
      case 'refresh-queue':
        refresh();
        break;
      case 'toggle-notifications':
        setNotificationsEnabled(!notificationsEnabled);
        break;
    }
  };

  const getStatusConfig = (status: string) => {
    return statusConfigs.find(config => config.status === status) || statusConfigs[0];
  };

  const getGoalProgress = () => {
    return Math.min(100, (personalMetrics.goalProgress / personalMetrics.dailyGoal) * 100);
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600';
    if (efficiency >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Queue</h1>
          <p className="text-muted-foreground">Personal workload and productivity</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status Selector */}
          <Select value={currentStatus} onValueChange={updateStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusConfigs.map((config) => (
                <SelectItem key={config.status} value={config.status}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Personal Metrics */}
      <div className="grid grid-cols-4 gap-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold">{personalMetrics.itemsAssigned}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{personalMetrics.itemsCompleted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{personalMetrics.itemsOverdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className={cn("text-2xl font-bold", getEfficiencyColor(personalMetrics.efficiency))}>
                  {personalMetrics.efficiency}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Goal Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {personalMetrics.goalProgress} / {personalMetrics.dailyGoal} items completed
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(getGoalProgress())}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${getGoalProgress()}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Streak: {personalMetrics.streak.current} days</span>
              <span>AHT: {personalMetrics.averageHandleTime}m</span>
              <span>SLA: {personalMetrics.slaCompliance}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <Button
              variant="outline"
              onClick={() => handleQuickAction('mark-available')}
              className="flex items-center gap-2"
            >
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Mark Available
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction('mark-busy')}
              className="flex items-center gap-2"
            >
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              Mark Busy
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction('refresh-queue')}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Queue
            </Button>
            <Button
              variant="outline"
              onClick={() => handleQuickAction('toggle-notifications')}
              className="flex items-center gap-2"
            >
              {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {notificationsEnabled ? 'Disable' : 'Enable'} Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Counters */}
      <RealtimeCounters type="queue" size="sm" />

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-8">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers, content..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={filters.type?.join(',') || 'all'}
                  onValueChange={(value) => setFilters({ 
                    type: value === 'all' ? undefined : value.split(',') as any 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="call">Calls</SelectItem>
                    <SelectItem value="voicemail">Voicemails</SelectItem>
                    <SelectItem value="message">Messages</SelectItem>
                    <SelectItem value="task">Tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select
                  value={filters.priority?.join(',') || 'all'}
                  onValueChange={(value) => setFilters({ 
                    priority: value === 'all' ? undefined : value.split(',') as any 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(false)}>
                Hide Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Queue Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Queue ({items.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={`${sort.field}-${sort.direction}`}
                onValueChange={(value) => {
                  const [field, direction] = value.split('-');
                  setSort({ field: field as any, direction: direction as any });
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="priority-desc">Priority High to Low</SelectItem>
                  <SelectItem value="priority-asc">Priority Low to High</SelectItem>
                  <SelectItem value="sla-asc">SLA Deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading your queue...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No items in your queue</p>
              <p className="text-sm">Great job! You're all caught up.</p>
            </div>
          ) : (
            <QueueItemList
              items={items}
              onItemAction={handleItemAction}
              onItemSelect={selectItem}
              selectedItemId={selectedItem?.id}
              showCustomerContext={true}
              compact={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Current Status Display */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("h-3 w-3 rounded-full", getStatusConfig(currentStatus).color)} />
              <div>
                <p className="font-medium">{getStatusConfig(currentStatus).label}</p>
                <p className="text-sm text-muted-foreground">
                  {getStatusConfig(currentStatus).description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Connection</p>
              <div className="flex items-center gap-1">
                <div className={cn("h-2 w-2 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
                <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
