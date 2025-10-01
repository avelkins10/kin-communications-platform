"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueueItemList } from "@/components/ui/queue-item-card";
import { RealtimeCounters } from "@/components/ui/realtime-counters";
import { SlaAlert } from "@/components/ui/sla-indicator";
import { useQueue } from "@/lib/hooks/use-queue";
import { useLayout } from "@/lib/hooks/use-layout";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Filter, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  UserPlus,
  Settings,
  BarChart3,
  RefreshCw,
  Download,
  Upload
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'employee' | 'admin';
  status: 'available' | 'busy' | 'offline' | 'away';
  currentWorkload: number;
  completedToday: number;
  averageHandleTime: number;
  slaCompliance: number;
  skills: string[];
}

interface TeamMetrics {
  totalAgents: number;
  availableAgents: number;
  busyAgents: number;
  offlineAgents: number;
  totalWorkload: number;
  averageSlaCompliance: number;
  teamEfficiency: number;
  peakHours: string[];
}

export function ManagerQueueView() {
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

  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([]);
  const [teamMetrics, setTeamMetrics] = React.useState<TeamMetrics>({
    totalAgents: 0,
    availableAgents: 0,
    busyAgents: 0,
    offlineAgents: 0,
    totalWorkload: 0,
    averageSlaCompliance: 0,
    teamEfficiency: 0,
    peakHours: []
  });
  const [selectedTeamMember, setSelectedTeamMember] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [bulkSelectedItems, setBulkSelectedItems] = React.useState<string[]>([]);

  // Fetch team data
  React.useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch('/api/team/members');
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.members || []);
          setTeamMetrics(data.metrics || teamMetrics);
        }
      } catch (error) {
        console.error('Failed to fetch team data:', error);
      }
    };

    fetchTeamData();
    const interval = setInterval(fetchTeamData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleItemAction = (action: string, item: any) => {
    switch (action) {
      case 'assign':
        // Show assignment dialog
        break;
      case 'escalate':
        escalateItem(item.id, 'Manager escalation');
        break;
      case 'complete':
        completeItem(item.id);
        break;
      case 'callback':
        callbackItem(item.id);
        break;
      case 'select':
        selectItem(item);
        const layoutMode = getLayoutModeForItem(item);
        switchToMode(layoutMode);
        break;
    }
  };

  const handleBulkAction = async (action: string) => {
    if (bulkSelectedItems.length === 0) return;

    try {
      await bulkAction(bulkSelectedItems, action);
      setBulkSelectedItems([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const handleTeamMemberSelect = (memberId: string) => {
    setSelectedTeamMember(memberId);
    setFilters({ assignedTo: [memberId] });
  };

  const getSlaViolations = () => {
    const now = new Date();
    return items.filter(item => {
      if (!item.sla) return false;
      const deadline = item.sla.deadline;
      return deadline.getTime() < now.getTime();
    }).map(item => ({
      id: item.id,
      type: item.type,
      customer: item.customer.name,
      overdueBy: Math.floor((now.getTime() - item.sla!.deadline.getTime()) / (1000 * 60)),
      urgency: item.priority === 'urgent' ? 'high' as const : 
               item.priority === 'high' ? 'medium' as const : 'low' as const
    }));
  };

  const getApproachingDeadlines = () => {
    const now = new Date();
    return items.filter(item => {
      if (!item.sla) return false;
      const deadline = item.sla.deadline;
      const diffMinutes = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60));
      return diffMinutes > 0 && diffMinutes <= 15;
    }).map(item => ({
      id: item.id,
      type: item.type,
      customer: item.customer.name,
      overdueBy: Math.floor((item.sla!.deadline.getTime() - now.getTime()) / (1000 * 60)),
      urgency: 'medium' as const
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Queue Management</h1>
          <p className="text-muted-foreground">Team oversight and management dashboard</p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Counters */}
      <RealtimeCounters type="all" size="md" />

      {/* SLA Alerts */}
      <SlaAlert violations={getSlaViolations()} />

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-8 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{teamMetrics.availableAgents}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{teamMetrics.busyAgents}</div>
              <div className="text-sm text-muted-foreground">Busy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{teamMetrics.offlineAgents}</div>
              <div className="text-sm text-muted-foreground">Offline</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{teamMetrics.averageSlaCompliance}%</div>
              <div className="text-sm text-muted-foreground">SLA Compliance</div>
            </div>
          </div>

          {/* Team Members */}
          <div className="space-y-2">
            <h4 className="font-medium">Team Members</h4>
            <div className="grid grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <Card
                  key={member.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedTeamMember === member.id && "ring-2 ring-primary"
                  )}
                  onClick={() => handleTeamMemberSelect(member.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          member.status === 'available' && 'bg-green-500',
                          member.status === 'busy' && 'bg-yellow-500',
                          member.status === 'offline' && 'bg-gray-500',
                          member.status === 'away' && 'bg-orange-500'
                        )} />
                        <span className="font-medium text-sm">{member.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.currentWorkload}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Completed: {member.completedToday}</div>
                      <div>AHT: {member.averageHandleTime}m</div>
                      <div>SLA: {member.slaCompliance}%</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-8">
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
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status?.join(',') || 'all'}
                  onValueChange={(value) => setFilters({ 
                    status: value === 'all' ? undefined : value.split(',') as any 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
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

      {/* Bulk Actions */}
      {bulkSelectedItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {bulkSelectedItems.length} items selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('assign')}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('escalate')}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Escalate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkSelectedItems([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Queue Items ({items.length})</CardTitle>
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
                  <SelectItem value="customer-asc">Customer A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading queue items...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : (
            <QueueItemList
              items={items}
              onItemAction={handleItemAction}
              onItemSelect={selectItem}
              selectedItemId={selectedItem?.id}
              showCustomerContext={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
