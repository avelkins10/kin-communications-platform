"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from '@/components/socket-provider';
import { 
  TaskAssignedPayload, 
  TaskAcceptedPayload, 
  TaskRejectedPayload, 
  TaskCompletedPayload,
  WorkerStatusChangedPayload,
  WorkerActivityChangedPayload
} from '@/types/socket';

interface TaskRouterConfig {
  workspaceSid: string;
  workerSid: string;
  token: string;
}

interface Worker {
  id: string;
  twilioWorkerSid: string;
  friendlyName: string;
  available: boolean;
  activitySid?: string;
  attributes: Record<string, any>;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

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
    department?: string;
    transcription?: string;
  };
  priority: number;
  assignmentStatus: "PENDING" | "ASSIGNED" | "RESERVED" | "ACCEPTED" | "COMPLETED" | "CANCELED" | "TIMEOUT";
  worker?: Worker;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  sid: string;
  friendlyName: string;
  available: boolean;
}

interface TaskRouterStats {
  totalWorkers: number;
  availableWorkers: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  averageWaitTime: number;
}

export function useTaskRouter() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskRouterStats>({
    totalWorkers: 0,
    availableWorkers: 0,
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    averageWaitTime: 0,
  });
  const [taskRouter, setTaskRouter] = useState<any>(null);
  const { toast } = useToast();
  const { subscribe } = useSocket();

  // Initialize TaskRouter connection
  const connect = useCallback(async (workerSid: string) => {
    if (isConnecting || isConnected) return;

    try {
      setIsConnecting(true);

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

      // Set up event listeners
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
        setCurrentActivity(worker.activity.sid);
        toast({
          title: "Activity Updated",
          description: `Activity changed to ${worker.activity.name}`,
        });
      });

      worker.on("reservationCreated", (reservation) => {
        console.log("New reservation:", reservation);
        toast({
          title: "New Task",
          description: "You have a new task assignment",
        });
        
        // Set up reservation event handlers (v2 requirement)
        reservation.on("accepted", (reservation) => {
          console.log("Reservation accepted:", reservation);
          toast({
            title: "Task Accepted",
            description: "You have accepted the task",
          });
          fetchTasks();
        });

        reservation.on("rejected", (reservation) => {
          console.log("Reservation rejected:", reservation);
          toast({
            title: "Task Rejected",
            description: "You have rejected the task",
          });
          fetchTasks();
        });

        reservation.on("completed", (reservation) => {
          console.log("Reservation completed:", reservation);
          toast({
            title: "Task Completed",
            description: "You have completed the task",
          });
          fetchTasks();
        });

        reservation.on("canceled", (reservation) => {
          console.log("Reservation canceled:", reservation);
          fetchTasks();
        });

        reservation.on("rescinded", (reservation) => {
          console.log("Reservation rescinded:", reservation);
          fetchTasks();
        });

        reservation.on("timeout", (reservation) => {
          console.log("Reservation timeout:", reservation);
          fetchTasks();
        });
      });

      worker.on("error", (error: any) => {
        console.error("TaskRouter error:", error);
        toast({
          title: "TaskRouter Error",
          description: error.message,
          variant: "destructive",
        });
      });

      // Connect to TaskRouter
      worker.connect();

    } catch (error) {
      console.error("Failed to connect to TaskRouter:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to TaskRouter",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, toast]);

  // Disconnect from TaskRouter
  const disconnect = useCallback(() => {
    if (taskRouter) {
      taskRouter.disconnect();
      setTaskRouter(null);
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Disconnected from TaskRouter",
      });
    }
  }, [taskRouter, toast]);

  // Fetch worker information
  const fetchWorker = useCallback(async (workerSid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/workers/${workerSid}`);
      if (response.ok) {
        const workerData = await response.json();
        setWorker(workerData);
        return workerData;
      }
    } catch (error) {
      console.error("Error fetching worker:", error);
    }
  }, []);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      const response = await fetch("/api/taskrouter/activities");
      if (response.ok) {
        const activitiesData = await response.json();
        setActivities(activitiesData);
        return activitiesData;
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async (filters?: {
    status?: string;
    workerSid?: string;
    queueSid?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.workerSid) params.append("workerSid", filters.workerSid);
      if (filters?.queueSid) params.append("queueSid", filters.queueSid);

      const response = await fetch(`/api/taskrouter/tasks?${params.toString()}`);
      if (response.ok) {
        const tasksData = await response.json();
        setTasks(tasksData);
        return tasksData;
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, []);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
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
      
      const newStats = {
        totalWorkers,
        availableWorkers,
        totalTasks,
        pendingTasks,
        completedTasks,
        averageWaitTime,
      };
      
      setStats(newStats);
      return newStats;
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Update worker activity
  const updateActivity = useCallback(async (workerSid: string, activitySid: string) => {
    try {
      if (taskRouter) {
        // Use SDK v2 method to update activity
        const activity = taskRouter.activities.find((act: any) => act.sid === activitySid);
        if (activity) {
          await activity.setAsCurrent();
          setCurrentActivity(activitySid);
          toast({
            title: "Activity Updated",
            description: "Your activity status has been updated",
          });
          return true;
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
          const updatedWorker = await response.json();
          setWorker(updatedWorker);
          setCurrentActivity(activitySid);
          toast({
            title: "Activity Updated",
            description: "Your activity status has been updated",
          });
          return updatedWorker;
        } else {
          throw new Error("Failed to update activity");
        }
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      toast({
        title: "Error",
        description: "Failed to update activity status",
        variant: "destructive",
      });
    }
  }, [taskRouter, toast]);

  // Accept task
  const acceptTask = useCallback(async (taskSid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${taskSid}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Task Accepted",
          description: "You have accepted the task",
        });
        fetchTasks();
        return true;
      } else {
        throw new Error("Failed to accept task");
      }
    } catch (error) {
      console.error("Error accepting task:", error);
      toast({
        title: "Error",
        description: "Failed to accept task",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, fetchTasks]);

  // Reject task
  const rejectTask = useCallback(async (taskSid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${taskSid}/reject`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Task Rejected",
          description: "You have rejected the task",
        });
        fetchTasks();
        return true;
      } else {
        throw new Error("Failed to reject task");
      }
    } catch (error) {
      console.error("Error rejecting task:", error);
      toast({
        title: "Error",
        description: "Failed to reject task",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, fetchTasks]);

  // Complete task
  const completeTask = useCallback(async (taskSid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${taskSid}/complete`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Task Completed",
          description: "You have completed the task",
        });
        fetchTasks();
        return true;
      } else {
        throw new Error("Failed to complete task");
      }
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
      return false;
    }
  }, [toast, fetchTasks]);

  // Real-time TaskRouter updates
  useEffect(() => {
    const handleTaskAssigned = (payload: TaskAssignedPayload) => {
      // Add new task to the list
      const newTask: Task = {
        id: payload.id,
        twilioTaskSid: payload.taskSid,
        taskQueueSid: payload.taskQueueSid,
        attributes: payload.attributes,
        priority: payload.priority,
        assignmentStatus: payload.assignmentStatus.toUpperCase() as any,
        worker: payload.workerSid ? {
          id: payload.workerSid,
          twilioWorkerSid: payload.workerSid,
          friendlyName: payload.workerName || 'Unknown Worker',
          available: true,
          attributes: {},
          user: {
            id: payload.workerSid,
            name: payload.workerName,
            email: ''
          }
        } : undefined,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt
      };
      
      setTasks(prev => [newTask, ...prev]);
      
      toast({
        title: "New Task Assigned",
        description: `Task assigned to ${payload.taskQueueName}`,
      });
    };

    const handleTaskAccepted = (payload: TaskAcceptedPayload) => {
      setTasks(prev => prev.map(task => {
        if (task.id === payload.id) {
          return {
            ...task,
            assignmentStatus: 'ACCEPTED',
            updatedAt: payload.updatedAt
          };
        }
        return task;
      }));
    };

    const handleTaskRejected = (payload: TaskRejectedPayload) => {
      setTasks(prev => prev.map(task => {
        if (task.id === payload.id) {
          return {
            ...task,
            assignmentStatus: 'REJECTED',
            updatedAt: payload.updatedAt
          };
        }
        return task;
      }));
    };

    const handleTaskCompleted = (payload: TaskCompletedPayload) => {
      setTasks(prev => prev.map(task => {
        if (task.id === payload.id) {
          return {
            ...task,
            assignmentStatus: 'COMPLETED',
            updatedAt: payload.updatedAt
          };
        }
        return task;
      }));
    };

    const handleWorkerStatusChanged = (payload: WorkerStatusChangedPayload) => {
      if (worker && worker.twilioWorkerSid === payload.workerSid) {
        setWorker(prev => prev ? {
          ...prev,
          available: payload.available,
          activitySid: payload.activitySid
        } : null);
      }
    };

    const handleWorkerActivityChanged = (payload: WorkerActivityChangedPayload) => {
      if (worker && worker.twilioWorkerSid === payload.workerSid) {
        setWorker(prev => prev ? {
          ...prev,
          available: payload.available,
          activitySid: payload.activitySid
        } : null);
        setCurrentActivity(payload.activityName);
      }
    };

    const unsubscribeTaskAssigned = subscribe('task_assigned', handleTaskAssigned);
    const unsubscribeTaskAccepted = subscribe('task_accepted', handleTaskAccepted);
    const unsubscribeTaskRejected = subscribe('task_rejected', handleTaskRejected);
    const unsubscribeTaskCompleted = subscribe('task_completed', handleTaskCompleted);
    const unsubscribeWorkerStatusChanged = subscribe('worker_status_changed', handleWorkerStatusChanged);
    const unsubscribeWorkerActivityChanged = subscribe('worker_activity_changed', handleWorkerActivityChanged);

    return () => {
      unsubscribeTaskAssigned();
      unsubscribeTaskAccepted();
      unsubscribeTaskRejected();
      unsubscribeTaskCompleted();
      unsubscribeWorkerStatusChanged();
      unsubscribeWorkerActivityChanged();
    };
  }, [subscribe, worker, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (taskRouter) {
        taskRouter.disconnect();
      }
    };
  }, [taskRouter]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    taskRouter,
    
    // Data
    worker,
    activities,
    currentActivity,
    tasks,
    stats,
    
    // Actions
    connect,
    disconnect,
    fetchWorker,
    fetchActivities,
    fetchTasks,
    fetchStats,
    updateActivity,
    acceptTask,
    rejectTask,
    completeTask,
  };
}
