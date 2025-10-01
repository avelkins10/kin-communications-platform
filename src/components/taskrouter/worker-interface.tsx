"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  MessageSquare, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  LogOut,
  Settings,
  Activity
} from "lucide-react";

interface WorkerActivity {
  sid: string;
  friendlyName: string;
  available: boolean;
}

interface Task {
  id: string;
  twilioTaskSid: string;
  attributes: {
    type?: "voice" | "sms" | "callback" | "support";
    priority?: "low" | "normal" | "high" | "urgent";
    customer_phone?: string;
    customer_name?: string;
    department?: string;
    transcription?: string;
  };
  priority: number;
  assignmentStatus: "PENDING" | "ASSIGNED" | "RESERVED" | "ACCEPTED" | "COMPLETED" | "CANCELED" | "TIMEOUT";
  createdAt: string;
}

interface WorkerInterfaceProps {
  workerSid: string;
  workerName: string;
  currentActivity: string;
  activities: WorkerActivity[];
  tasks: Task[];
  onActivityChange: (activitySid: string) => void;
  onTaskAccept: (taskSid: string) => void;
  onTaskReject: (taskSid: string) => void;
  onTaskComplete: (taskSid: string) => void;
}

export function WorkerInterface({
  workerSid,
  workerName,
  currentActivity,
  activities,
  tasks,
  onActivityChange,
  onTaskAccept,
  onTaskReject,
  onTaskComplete,
}: WorkerInterfaceProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskRouter, setTaskRouter] = useState<any>(null);
  const { toast } = useToast();

  // Initialize TaskRouter connection using SDK v2
  useEffect(() => {
    const initializeTaskRouter = async () => {
      try {
        // Get worker token
        const tokenResponse = await fetch(`/api/taskrouter/workers/${workerSid}/token`, {
          method: "POST",
        });

        if (!tokenResponse.ok) {
          throw new Error("Failed to get worker token");
        }

        const { token } = await tokenResponse.json();

        // Initialize TaskRouter SDK v2 with proper error handling
        let taskRouterModule;
        try {
          taskRouterModule = await import("twilio-taskrouter");
        } catch (importError) {
          console.error("Failed to import TaskRouter SDK:", importError);
          throw new Error("TaskRouter SDK is not available. Please check your internet connection and try again.");
        }
        
        if (!taskRouterModule || !taskRouterModule.Worker) {
          throw new Error("Failed to load TaskRouter SDK - Worker class not found");
        }
        const worker = new taskRouterModule.Worker(token);

        // Set up event listeners using v2 syntax
        worker.on("ready", () => {
          console.log("TaskRouter Worker ready");
          setIsConnected(true);
          setTaskRouter(worker);
          toast({
            title: "Connected",
            description: "Successfully connected to TaskRouter",
          });
        });

        worker.on("activityUpdated", (worker) => {
          console.log("Activity updated:", worker.activity.name);
          onActivityChange(worker.activity.sid);
        });

        worker.on("reservationCreated", (reservation) => {
          console.log("New reservation:", reservation);
          
          // Set up reservation event handlers (v2 requirement)
          reservation.on("accepted", (reservation) => {
            console.log("Reservation accepted:", reservation);
            setCurrentTask(reservation.task);
            toast({
              title: "Task Accepted",
              description: "You have accepted the task",
            });
          });

          reservation.on("rejected", (reservation) => {
            console.log("Reservation rejected:", reservation);
            toast({
              title: "Task Rejected",
              description: "You have rejected the task",
            });
          });

          reservation.on("completed", (reservation) => {
            console.log("Reservation completed:", reservation);
            setCurrentTask(null);
            toast({
              title: "Task Completed",
              description: "You have completed the task",
            });
          });

          reservation.on("canceled", (reservation) => {
            console.log("Reservation canceled:", reservation);
            setCurrentTask(null);
          });

          reservation.on("rescinded", (reservation) => {
            console.log("Reservation rescinded:", reservation);
            setCurrentTask(null);
          });

          reservation.on("timeout", (reservation) => {
            console.log("Reservation timeout:", reservation);
            setCurrentTask(null);
          });
        });

        worker.on("error", (error) => {
          console.error("TaskRouter error:", error);
          toast({
            title: "TaskRouter Error",
            description: error.message,
            variant: "destructive",
          });
        });

        // Connect to TaskRouter
        worker.connect();

        return () => {
          worker.disconnect();
        };
      } catch (error) {
        console.error("Failed to initialize TaskRouter:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to TaskRouter",
          variant: "destructive",
        });
      }
    };

    initializeTaskRouter();
  }, [workerSid, onActivityChange, toast]);

  const handleActivityChange = async (activitySid: string) => {
    try {
      if (taskRouter) {
        // Use SDK v2 method to update activity
        const activity = taskRouter.activities.find((act: any) => act.sid === activitySid);
        if (activity) {
          await activity.setAsCurrent();
          onActivityChange(activitySid);
          toast({
            title: "Activity Updated",
            description: "Your activity status has been updated",
          });
        } else {
          throw new Error("Activity not found");
        }
      } else {
        // Fallback to API call if SDK not available
        const response = await fetch(`/api/taskrouter/workers/${workerSid}/activity`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activitySid }),
        });

        if (response.ok) {
          onActivityChange(activitySid);
          toast({
            title: "Activity Updated",
            description: "Your activity status has been updated",
          });
        } else {
          throw new Error("Failed to update activity");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update activity status",
        variant: "destructive",
      });
    }
  };

  const handleTaskAccept = async (taskSid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${taskSid}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        onTaskAccept(taskSid);
        toast({
          title: "Task Accepted",
          description: "You have accepted the task",
        });
      } else {
        throw new Error("Failed to accept task");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept task",
        variant: "destructive",
      });
    }
  };

  const handleTaskReject = async (taskSid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${taskSid}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        onTaskReject(taskSid);
        toast({
          title: "Task Rejected",
          description: "You have rejected the task",
        });
      } else {
        throw new Error("Failed to reject task");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject task",
        variant: "destructive",
      });
    }
  };

  const handleTaskComplete = async (taskSid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${taskSid}/complete`, {
        method: "POST",
      });

      if (response.ok) {
        onTaskComplete(taskSid);
        toast({
          title: "Task Completed",
          description: "You have completed the task",
        });
      } else {
        throw new Error("Failed to complete task");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    }
  };

  const getActivityStatus = (activitySid: string) => {
    const activity = activities.find(a => a.sid === activitySid);
    return activity?.available ? "Available" : "Offline";
  };

  const getTaskTypeIcon = (type?: string) => {
    switch (type) {
      case "voice":
        return <Phone className="h-5 w-5 text-blue-600" />;
      case "sms":
        return <MessageSquare className="h-5 w-5 text-green-600" />;
      case "callback":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "support":
        return <User className="h-5 w-5 text-purple-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "normal":
        return "text-blue-600 bg-blue-100";
      case "low":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  const pendingTasks = tasks.filter(t => t.assignmentStatus === "PENDING");
  const activeTasks = tasks.filter(t => ["ASSIGNED", "RESERVED", "ACCEPTED"].includes(t.assignmentStatus));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Worker Interface</h2>
          <p className="text-muted-foreground">
            Welcome back, {workerName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            <Activity className="mr-1 h-3 w-3" />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Activity Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Activity Status</span>
          </CardTitle>
          <CardDescription>
            Update your current activity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={currentActivity} onValueChange={handleActivityChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.sid} value={activity.sid}>
                      <div className="flex items-center space-x-2">
                        {activity.available ? (
                          <Play className="h-4 w-4 text-green-600" />
                        ) : (
                          <Pause className="h-4 w-4 text-red-600" />
                        )}
                        <span>{activity.friendlyName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Current: {getActivityStatus(currentActivity)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Task */}
      {currentTask && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getTaskTypeIcon(currentTask.attributes.type)}
              <span>Current Task</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{currentTask.attributes.customer_name || "Unknown Customer"}</h3>
                  <p className="text-sm text-muted-foreground">{currentTask.attributes.customer_phone}</p>
                </div>
                <Badge className={getPriorityColor(currentTask.attributes.priority)}>
                  {currentTask.attributes.priority?.toUpperCase() || "NORMAL"}
                </Badge>
              </div>
              
              {currentTask.attributes.transcription && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{currentTask.attributes.transcription}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleTaskComplete(currentTask.twilioTaskSid)}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Task
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleTaskReject(currentTask.twilioTaskSid)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Pending Tasks ({pendingTasks.length})</span>
            </CardTitle>
            <CardDescription>
              New tasks waiting for your response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    {getTaskTypeIcon(task.attributes.type)}
                    <div>
                      <h4 className="font-medium">{task.attributes.customer_name || "Unknown Customer"}</h4>
                      <p className="text-sm text-muted-foreground">{task.attributes.customer_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(task.attributes.priority)}>
                      {task.attributes.priority?.toUpperCase() || "NORMAL"}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleTaskAccept(task.twilioTaskSid)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTaskReject(task.twilioTaskSid)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Active Tasks ({activeTasks.length})</span>
            </CardTitle>
            <CardDescription>
              Tasks currently in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    {getTaskTypeIcon(task.attributes.type)}
                    <div>
                      <h4 className="font-medium">{task.attributes.customer_name || "Unknown Customer"}</h4>
                      <p className="text-sm text-muted-foreground">{task.attributes.customer_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(task.attributes.priority)}>
                      {task.attributes.priority?.toUpperCase() || "NORMAL"}
                    </Badge>
                    <Badge variant="secondary">
                      {task.assignmentStatus}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleTaskComplete(task.twilioTaskSid)}
                    >
                      Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Tasks State */}
      {pendingTasks.length === 0 && activeTasks.length === 0 && !currentTask && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Tasks</h3>
            <p className="text-muted-foreground text-center">
              You're all caught up! New tasks will appear here when they're assigned to you.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
