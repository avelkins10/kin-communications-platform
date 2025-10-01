"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Phone, Clock, User, CheckCircle, XCircle, AlertCircle, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Task {
  id: string;
  twilioTaskSid: string;
  attributes: any;
  priority: number;
  assignmentStatus: string;
  worker?: {
    id: string;
    friendlyName: string;
    User: {
      name?: string;
      email: string;
    };
  };
  call?: {
    id: string;
    fromNumber: string;
    toNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskManagementProps {
  tasks: Task[];
  onRefresh: () => void;
}

export function TaskManagement({ tasks, onRefresh }: TaskManagementProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  const handleCancelTask = async (task: Task) => {
    if (!confirm(`Are you sure you want to cancel this call?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/taskrouter/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Call canceled successfully",
          description: "The call has been canceled.",
        });
        onRefresh();
      } else {
        throw new Error("Failed to cancel call");
      }
    } catch (error) {
      toast({
        title: "Error canceling call",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any, label: string }> = {
      PENDING: { variant: "outline", icon: Clock, label: "Waiting" },
      ASSIGNED: { variant: "secondary", icon: AlertCircle, label: "Assigned" },
      RESERVED: { variant: "secondary", icon: User, label: "Reserved" },
      ACCEPTED: { variant: "default", icon: Phone, label: "Active" },
      COMPLETED: { variant: "default", icon: CheckCircle, label: "Completed" },
      CANCELED: { variant: "destructive", icon: XCircle, label: "Canceled" },
      TIMEOUT: { variant: "destructive", icon: Clock, label: "Timeout" },
    };

    const config = statusMap[status] || statusMap.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 10) {
      return <Badge variant="destructive">High Priority</Badge>;
    } else if (priority >= 5) {
      return <Badge variant="secondary">Normal</Badge>;
    } else {
      return <Badge variant="outline">Low</Badge>;
    }
  };

  const filteredTasks = statusFilter === "all"
    ? tasks
    : tasks.filter(t => t.assignmentStatus === statusFilter);

  const stats = {
    pending: tasks.filter(t => t.assignmentStatus === "PENDING").length,
    active: tasks.filter(t => ["ASSIGNED", "RESERVED", "ACCEPTED"].includes(t.assignmentStatus)).length,
    completed: tasks.filter(t => t.assignmentStatus === "COMPLETED").length,
    failed: tasks.filter(t => ["CANCELED", "TIMEOUT"].includes(t.assignmentStatus)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Call Queue Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage active calls
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Calls</SelectItem>
              <SelectItem value="PENDING">Waiting</SelectItem>
              <SelectItem value="ASSIGNED">Assigned</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
              <SelectItem value="ACCEPTED">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELED">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting Calls</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <Phone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully handled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Canceled or timeout</p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Calls</CardTitle>
          <CardDescription>
            All calls in the system ({filteredTasks.length} {statusFilter === "all" ? "total" : statusFilter.toLowerCase()})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No calls found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call Information</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {task.call ? (
                            <>
                              <Phone className="inline h-3 w-3 mr-1" />
                              {task.call.fromNumber}
                            </>
                          ) : (
                            <span className="text-muted-foreground">No call data</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.attributes?.reason || task.attributes?.selected_product || "General inquiry"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(task.assignmentStatus)}
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(task.priority)}
                    </TableCell>
                    <TableCell>
                      {task.worker ? (
                        <div>
                          <div className="font-medium">{task.worker.friendlyName}</div>
                          <div className="text-xs text-muted-foreground">
                            {task.worker.User.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(task.createdAt).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {["PENDING", "ASSIGNED", "RESERVED"].includes(task.assignmentStatus) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelTask(task)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}