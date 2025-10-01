"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { QueueItemList } from "@/components/ui/queue-item-card";
import { QueueItem } from "@/types/layout";
import { 
  Clock, 
  Phone, 
  MessageSquare, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX
} from "lucide-react";

interface Task {
  id: string;
  twilioTaskSid: string;
  taskQueueSid?: string;
  workflowSid?: string;
  attributes: {
    type?: "voice" | "sms" | "callback" | "support";
    priority?: "low" | "normal" | "high" | "urgent";
    customer_phone?: string;
    customer_name?: string;
    customer_id?: string;
    quickbase_id?: string;
    project_coordinator?: string;
    department?: string;
    keywords?: string[];
    call_sid?: string;
    message_sid?: string;
    transcription?: string;
    notes?: string;
  };
  priority: number;
  assignmentStatus: "PENDING" | "ASSIGNED" | "RESERVED" | "ACCEPTED" | "COMPLETED" | "CANCELED" | "TIMEOUT";
  worker?: {
    id: string;
    friendlyName: string;
    user: {
      name?: string;
      email: string;
    };
  };
  call?: {
    id: string;
    fromNumber: string;
    toNumber: string;
    status: string;
  };
  message?: {
    id: string;
    fromNumber: string;
    toNumber: string;
    body: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskQueueProps {
  tasks: Task[];
  onRefresh: () => void;
  useUnifiedView?: boolean; // New prop to use unified queue view
}

// Convert Task to QueueItem for unified queue model
const convertTaskToQueueItem = (task: Task): QueueItem => {
  const priorityMap: Record<string, 'urgent' | 'high' | 'medium' | 'low'> = {
    urgent: 'urgent',
    high: 'high',
    normal: 'medium',
    low: 'low'
  };

  const statusMap: Record<string, 'new' | 'assigned' | 'in-progress' | 'completed' | 'overdue'> = {
    PENDING: 'new',
    ASSIGNED: 'assigned',
    RESERVED: 'assigned',
    ACCEPTED: 'in-progress',
    COMPLETED: 'completed',
    CANCELED: 'completed',
    TIMEOUT: 'overdue'
  };

  const typeMap: Record<string, 'call' | 'voicemail' | 'message' | 'task'> = {
    voice: 'call',
    sms: 'message',
    callback: 'call',
    support: 'task'
  };

  return {
    id: task.id,
    type: typeMap[task.attributes.type || 'support'] || 'task',
    priority: priorityMap[task.attributes.priority || 'normal'] || 'medium',
    status: statusMap[task.assignmentStatus] || 'new',
    customer: {
      id: task.attributes.customer_id || task.attributes.customer_phone || 'unknown',
      name: task.attributes.customer_name || 'Unknown Customer',
      phone: task.attributes.customer_phone,
      email: undefined
    },
    assignedTo: task.worker ? {
      id: task.worker.id,
      name: task.worker.friendlyName,
      email: task.worker.user.email,
      role: 'employee',
      status: 'available'
    } : undefined,
    sla: undefined, // Tasks don't have SLA in this model
    metadata: {
      content: task.attributes.transcription || task.attributes.notes,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      source: 'taskrouter',
      tags: task.attributes.keywords
    },
    actions: {
      canCall: task.attributes.type === 'voice' || task.attributes.type === 'callback',
      canText: task.attributes.type === 'sms',
      canComplete: true,
      canAssign: true
    }
  };
};

export function TaskQueue({ tasks, onRefresh, useUnifiedView = false }: TaskQueueProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  // If using unified view, render with QueueItemList
  if (useUnifiedView) {
    const queueItems = tasks.map(convertTaskToQueueItem);
    
    const handleItemAction = (action: string, item: QueueItem) => {
      const task = tasks.find(t => t.id === item.id);
      if (!task) return;

      switch (action) {
        case 'complete':
          // Handle task completion
          break;
        case 'assign':
          // Handle task assignment
          break;
        case 'call':
          // Handle call action
          break;
        case 'text':
          // Handle text action
          break;
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Task Queue</h2>
            <p className="text-muted-foreground">
              Monitor and manage incoming tasks
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="text-center p-4 bg-muted rounded">
            <div className="text-2xl font-bold text-yellow-600">
              {tasks.filter(t => t.assignmentStatus === "PENDING").length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-4 bg-muted rounded">
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => ["ASSIGNED", "RESERVED", "ACCEPTED"].includes(t.assignmentStatus)).length}
            </div>
            <div className="text-sm text-muted-foreground">Assigned</div>
          </div>
          <div className="text-center p-4 bg-muted rounded">
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.assignmentStatus === "COMPLETED").length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-4 bg-muted rounded">
            <div className="text-2xl font-bold text-red-600">
              {tasks.filter(t => t.attributes.priority === "urgent").length}
            </div>
            <div className="text-sm text-muted-foreground">Urgent</div>
          </div>
        </div>

        <QueueItemList
          items={queueItems}
          onItemAction={handleItemAction}
          showCustomerContext={true}
          compact={false}
        />
      </div>
    );
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.attributes.customer_phone?.includes(searchTerm) ||
                         task.attributes.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.attributes.transcription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || task.assignmentStatus === filterStatus;
    const matchesType = filterType === "all" || task.attributes.type === filterType;
    const matchesPriority = filterPriority === "all" || task.attributes.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  const pendingTasks = tasks.filter(t => t.assignmentStatus === "PENDING").length;
  const assignedTasks = tasks.filter(t => ["ASSIGNED", "RESERVED", "ACCEPTED"].includes(t.assignmentStatus)).length;
  const completedTasks = tasks.filter(t => t.assignmentStatus === "COMPLETED").length;
  const urgentTasks = tasks.filter(t => t.attributes.priority === "urgent").length;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      ASSIGNED: { variant: "default" as const, icon: UserCheck, color: "text-blue-600" },
      RESERVED: { variant: "default" as const, icon: UserCheck, color: "text-blue-600" },
      ACCEPTED: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      COMPLETED: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      CANCELED: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      TIMEOUT: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority?: string) => {
    const priorityConfig = {
      urgent: { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      high: { variant: "destructive" as const, color: "bg-orange-100 text-orange-800" },
      normal: { variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      low: { variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;

    return (
      <Badge className={config.color}>
        {priority?.toUpperCase() || "NORMAL"}
      </Badge>
    );
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "voice":
        return <Phone className="h-4 w-4 text-blue-600" />;
      case "sms":
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case "callback":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "support":
        return <User className="h-4 w-4 text-purple-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAge = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMins > 0) return `${diffMins}m`;
    return "Just now";
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsDialogOpen(true);
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by manager" }),
      });

      if (response.ok) {
        toast({
          title: "Task cancelled",
          description: "The task has been cancelled successfully.",
        });
        onRefresh();
      } else {
        throw new Error("Failed to cancel task");
      }
    } catch (error) {
      toast({
        title: "Error cancelling task",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Task Queue</h2>
          <p className="text-muted-foreground">
            Monitor and manage incoming tasks
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="voice">Voice</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="callback">Callback</SelectItem>
            <SelectItem value="support">Support</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
          <CardDescription>
            View and manage all tasks in the queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(task.attributes.type)}
                      <span className="capitalize">{task.attributes.type || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {task.attributes.customer_name || "Unknown Customer"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {task.attributes.customer_phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {task.attributes.department || "Unassigned"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(task.attributes.priority)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(task.assignmentStatus)}
                  </TableCell>
                  <TableCell>
                    {task.worker ? (
                      <div>
                        <div className="font-medium">{task.worker.friendlyName}</div>
                        <div className="text-sm text-muted-foreground">{task.worker.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {getAge(task.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(task)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {task.assignmentStatus === "PENDING" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelTask(task.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View detailed information about this task
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Task ID</label>
                  <p className="text-sm">{selectedTask.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm capitalize">{selectedTask.attributes.type || "Unknown"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <div className="mt-1">
                    {getPriorityBadge(selectedTask.attributes.priority)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTask.assignmentStatus)}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-medium mb-2">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{selectedTask.attributes.customer_name || "Unknown"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm">{selectedTask.attributes.customer_phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Department</label>
                    <p className="text-sm">{selectedTask.attributes.department || "Unassigned"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Project Coordinator</label>
                    <p className="text-sm">{selectedTask.attributes.project_coordinator || "Not assigned"}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              {(selectedTask.attributes.transcription || selectedTask.attributes.notes) && (
                <div>
                  <h4 className="font-medium mb-2">Content</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedTask.attributes.transcription || selectedTask.attributes.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Keywords */}
              {selectedTask.attributes.keywords && selectedTask.attributes.keywords.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Detected Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.attributes.keywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment Info */}
              {selectedTask.worker && (
                <div>
                  <h4 className="font-medium mb-2">Assigned Worker</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">{selectedTask.worker.friendlyName}</p>
                    <p className="text-sm text-muted-foreground">{selectedTask.worker.user.email}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{new Date(selectedTask.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
