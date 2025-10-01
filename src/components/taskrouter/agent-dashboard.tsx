"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  PhoneOff,
  Clock,
  CheckCircle,
  User,
  AlertCircle,
  Coffee,
  Pause,
  Play,
  RefreshCw
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AgentStatus {
  id: string;
  twilioActivitySid: string;
  friendlyName: string;
  available: boolean;
}

interface AssignedCall {
  id: string;
  twilioTaskSid: string;
  attributes: any;
  priority: number;
  assignmentStatus: string;
  call?: {
    id: string;
    fromNumber: string;
    toNumber: string;
    status: string;
  };
  createdAt: string;
}

interface AgentStats {
  callsHandledToday: number;
  averageCallDuration: number;
  currentStatus: string;
  timeInCurrentStatus: number;
}

export function AgentDashboard() {
  const { data: session } = useSession();
  const [currentStatus, setCurrentStatus] = useState<AgentStatus | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<AgentStatus[]>([]);
  const [assignedCalls, setAssignedCalls] = useState<AssignedCall[]>([]);
  const [stats, setStats] = useState<AgentStats>({
    callsHandledToday: 0,
    averageCallDuration: 0,
    currentStatus: "Offline",
    timeInCurrentStatus: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const { toast } = useToast();

  const fetchAgentData = async () => {
    try {
      setIsLoading(true);

      // Fetch available statuses
      const statusesResponse = await fetch("/api/taskrouter/activities");
      if (statusesResponse.ok) {
        const statuses = await statusesResponse.json();
        setAvailableStatuses(statuses);
      }

      // Fetch current worker info
      const workerResponse = await fetch("/api/taskrouter/workers/me");
      if (workerResponse.ok) {
        const worker = await workerResponse.json();
        const currentActivity = availableStatuses.find(
          (s) => s.twilioActivitySid === worker.activitySid
        );
        setCurrentStatus(currentActivity || null);
      }

      // Fetch assigned calls
      const tasksResponse = await fetch("/api/taskrouter/tasks?assigned=me");
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        setAssignedCalls(tasks.filter(
          (t: AssignedCall) => ["ASSIGNED", "RESERVED", "ACCEPTED"].includes(t.assignmentStatus)
        ));
      }

      // Fetch agent stats
      const statsResponse = await fetch("/api/taskrouter/workers/me/stats");
      if (statsResponse.ok) {
        const agentStats = await statsResponse.json();
        setStats(agentStats);
      }
    } catch (error) {
      console.error("Error fetching agent data:", error);
      toast({
        title: "Error",
        description: "Failed to load agent dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
    const interval = setInterval(fetchAgentData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (activitySid: string) => {
    try {
      setIsChangingStatus(true);
      const response = await fetch("/api/taskrouter/workers/me/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activitySid }),
      });

      if (response.ok) {
        const newStatus = availableStatuses.find((s) => s.twilioActivitySid === activitySid);
        setCurrentStatus(newStatus || null);
        toast({
          title: "Status Updated",
          description: `Your status is now: ${newStatus?.friendlyName}`,
        });
        fetchAgentData();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your status",
        variant: "destructive",
      });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleAcceptCall = async (callId: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${callId}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Call Accepted",
          description: "You are now connected to the caller",
        });
        fetchAgentData();
      } else {
        throw new Error("Failed to accept call");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept call",
        variant: "destructive",
      });
    }
  };

  const handleRejectCall = async (callId: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${callId}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Call Rejected",
          description: "The call will be routed to another agent",
        });
        fetchAgentData();
      } else {
        throw new Error("Failed to reject call");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject call",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    const iconMap: Record<string, any> = {
      Available: <Phone className="h-4 w-4 text-green-600" />,
      Offline: <PhoneOff className="h-4 w-4 text-gray-600" />,
      "On a Call": <Phone className="h-4 w-4 text-blue-600" />,
      "On Break": <Coffee className="h-4 w-4 text-orange-600" />,
      "In Meeting": <Pause className="h-4 w-4 text-purple-600" />,
    };
    return iconMap[status] || <AlertCircle className="h-4 w-4" />;
  };

  const getStatusColor = (available: boolean) => {
    return available ? "bg-green-600" : "bg-gray-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || "Agent"}
          </p>
        </div>
        <Button onClick={fetchAgentData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(currentStatus?.friendlyName || "Offline")}
            <span>Your Status</span>
          </CardTitle>
          <CardDescription>
            Manage your availability for incoming calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select
                value={currentStatus?.twilioActivitySid || ""}
                onValueChange={handleStatusChange}
                disabled={isChangingStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status.id} value={status.twilioActivitySid}>
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${getStatusColor(status.available)}`} />
                        <span>{status.friendlyName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant={currentStatus?.available ? "default" : "secondary"} className="text-lg px-4 py-2">
              {currentStatus?.available ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Available for Calls
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Not Available
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Handled Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.callsHandledToday}</div>
            <p className="text-xs text-muted-foreground">Completed calls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCallDuration}m</div>
            <p className="text-xs text-muted-foreground">Average time per call</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Status Time</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.timeInCurrentStatus}m</div>
            <p className="text-xs text-muted-foreground">Time in current status</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Your Active Calls</span>
            {assignedCalls.length > 0 && (
              <Badge variant="destructive">{assignedCalls.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Calls currently assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedCalls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No Active Calls</p>
              <p className="text-sm text-muted-foreground mt-2">
                {currentStatus?.available
                  ? "Waiting for incoming calls..."
                  : "Change your status to Available to receive calls"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedCalls.map((call) => (
                <Card key={call.id} className="border-2 border-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span className="font-medium text-lg">
                            {call.call?.fromNumber || "Unknown Number"}
                          </span>
                          {call.priority >= 10 && (
                            <Badge variant="destructive">High Priority</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {call.attributes?.reason || "General inquiry"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Waiting for {Math.round((Date.now() - new Date(call.createdAt).getTime()) / 1000 / 60)}m
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {call.assignmentStatus === "RESERVED" && (
                          <>
                            <Button
                              onClick={() => handleAcceptCall(call.id)}
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Phone className="mr-2 h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleRejectCall(call.id)}
                              variant="outline"
                            >
                              <PhoneOff className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}
                        {call.assignmentStatus === "ACCEPTED" && (
                          <Badge variant="default" className="bg-green-600 text-lg px-4 py-2">
                            <Phone className="mr-2 h-4 w-4" />
                            On Call
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common agent tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" size="lg" className="h-20">
              <div className="flex flex-col items-center">
                <Coffee className="h-6 w-6 mb-2" />
                <span>Take a Break</span>
              </div>
            </Button>
            <Button variant="outline" size="lg" className="h-20">
              <div className="flex flex-col items-center">
                <User className="h-6 w-6 mb-2" />
                <span>View My Stats</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}