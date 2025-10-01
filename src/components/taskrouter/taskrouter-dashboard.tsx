"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Activity, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Phone,
  MessageSquare,
  Settings,
  RefreshCw
} from "lucide-react";

interface DashboardStats {
  totalWorkers: number;
  availableWorkers: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  averageWaitTime: number;
  totalCalls: number;
  totalMessages: number;
}

interface RecentActivity {
  id: string;
  type: "task_created" | "task_completed" | "worker_available" | "worker_offline" | "rule_triggered";
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface TaskRouterDashboardProps {
  onRefresh: () => void;
}

export function TaskRouterDashboard({ onRefresh }: TaskRouterDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkers: 0,
    availableWorkers: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    averageWaitTime: 0,
    totalCalls: 0,
    totalMessages: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch workers
      const workersResponse = await fetch("/api/taskrouter/workers");
      const workers = await workersResponse.json();
      
      // Fetch tasks
      const tasksResponse = await fetch("/api/taskrouter/tasks");
      const tasks = await tasksResponse.json();
      
      // Calculate stats
      const totalWorkers = workers.length;
      const availableWorkers = workers.filter((w: any) => w.available).length;
      const totalTasks = tasks.length;
      const pendingTasks = tasks.filter((t: any) => t.assignmentStatus === "PENDING").length;
      const completedTasks = tasks.filter((t: any) => t.assignmentStatus === "COMPLETED").length;
      
      // Calculate average wait time (simplified)
      const pendingTaskTimes = tasks
        .filter((t: any) => t.assignmentStatus === "PENDING")
        .map((t: any) => new Date().getTime() - new Date(t.createdAt).getTime());
      const averageWaitTime = pendingTaskTimes.length > 0 
        ? Math.round(pendingTaskTimes.reduce((a, b) => a + b, 0) / pendingTaskTimes.length / 1000 / 60) // minutes
        : 0;
      
      // Count calls and messages
      const totalCalls = tasks.filter((t: any) => t.attributes?.type === "voice").length;
      const totalMessages = tasks.filter((t: any) => t.attributes?.type === "sms").length;
      
      setStats({
        totalWorkers,
        availableWorkers,
        totalTasks,
        pendingTasks,
        completedTasks,
        averageWaitTime,
        totalCalls,
        totalMessages,
      });
      
      // Generate recent activity (mock data for now)
      setRecentActivity([
        {
          id: "1",
          type: "task_created",
          description: "New voice call task created for customer +1234567890",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          metadata: { customerPhone: "+1234567890", taskType: "voice" }
        },
        {
          id: "2",
          type: "worker_available",
          description: "John Doe is now available",
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          metadata: { workerName: "John Doe" }
        },
        {
          id: "3",
          type: "task_completed",
          description: "SMS task completed by Jane Smith",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          metadata: { workerName: "Jane Smith", taskType: "sms" }
        },
        {
          id: "4",
          type: "rule_triggered",
          description: "Routing rule 'Urgent Permits' triggered",
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          metadata: { ruleName: "Urgent Permits" }
        },
        {
          id: "5",
          type: "worker_offline",
          description: "Mike Johnson went offline",
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          metadata: { workerName: "Mike Johnson" }
        },
      ]);
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "task_completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "worker_available":
        return <Users className="h-4 w-4 text-green-600" />;
      case "worker_offline":
        return <Users className="h-4 w-4 text-red-600" />;
      case "rule_triggered":
        return <Settings className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadge = (type: string) => {
    const badgeConfig = {
      task_created: { variant: "default" as const, label: "Call Started" },
      task_completed: { variant: "default" as const, label: "Call Completed" },
      worker_available: { variant: "default" as const, label: "Agent Available" },
      worker_offline: { variant: "destructive" as const, label: "Agent Offline" },
      rule_triggered: { variant: "secondary" as const, label: "Rule Triggered" },
    };

    const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.task_created;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Call Center Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics and activity
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableWorkers} available agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting Calls</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.averageWaitTime}min avg wait
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Calls</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalTasks} total calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls + stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCalls} calls, {stats.totalMessages} messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Communication Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Voice Calls</span>
            </CardTitle>
            <CardDescription>
              Call volume and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalCalls}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Total voice calls processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>SMS Messages</span>
            </CardTitle>
            <CardDescription>
              Message volume and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.totalMessages}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Total SMS messages processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
          <CardDescription>
            Latest call center events and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {getActivityBadge(activity.type)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Agent Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalWorkers > 0 ? Math.round((stats.availableWorkers / stats.totalWorkers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.availableWorkers} of {stats.totalWorkers} agents available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Call Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} of {stats.totalTasks} calls completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Wait Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageWaitTime}m</div>
            <p className="text-xs text-muted-foreground">
              Average time before agent pickup
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
