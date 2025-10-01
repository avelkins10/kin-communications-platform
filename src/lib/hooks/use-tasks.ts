"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

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
    twilioWorkerSid: string;
    friendlyName: string;
    user: {
      id: string;
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
  endedAt?: string;
}

interface TaskFilters {
  status?: string;
  workerSid?: string;
  queueSid?: string;
  dateAfter?: Date;
  dateBefore?: Date;
  type?: string;
  priority?: string;
  department?: string;
}

interface CreateTaskData {
  taskQueueSid: string;
  workflowSid?: string;
  attributes?: Record<string, any>;
  priority?: number;
  timeout?: number;
  taskChannel?: string;
  callId?: string;
  messageId?: string;
}

interface UpdateTaskData {
  attributes?: Record<string, any>;
  priority?: number;
  assignmentStatus?: string;
  reason?: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Fetch all tasks
  const fetchTasks = useCallback(async (filters?: TaskFilters) => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.workerSid) params.append("workerSid", filters.workerSid);
      if (filters?.queueSid) params.append("queueSid", filters.queueSid);
      if (filters?.dateAfter) params.append("dateAfter", filters.dateAfter.toISOString());
      if (filters?.dateBefore) params.append("dateBefore", filters.dateBefore.toISOString());
      if (filters?.type) params.append("type", filters.type);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.department) params.append("department", filters.department);

      const response = await fetch(`/api/taskrouter/tasks?${params.toString()}`);
      
      if (response.ok) {
        const tasksData = await response.json();
        setTasks(tasksData);
        return tasksData;
      } else {
        throw new Error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch a single task
  const fetchTask = useCallback(async (taskSid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/tasks/${taskSid}`);
      
      if (response.ok) {
        const taskData = await response.json();
        return taskData;
      } else {
        throw new Error("Failed to fetch task");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Create a new task
  const createTask = useCallback(async (taskData: CreateTaskData) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/taskrouter/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks(prev => [newTask, ...prev]);
        toast({
          title: "Task Created",
          description: "Task has been created successfully",
        });
        return newTask;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create task",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [toast]);

  // Update a task
  const updateTask = useCallback(async (taskSid: string, updates: UpdateTaskData) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/taskrouter/tasks/${taskSid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(task => 
          task.twilioTaskSid === taskSid ? updatedTask : task
        ));
        toast({
          title: "Task Updated",
          description: "Task has been updated successfully",
        });
        return updatedTask;
      } else {
        throw new Error("Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);

  // Delete a task
  const deleteTask = useCallback(async (taskSid: string, reason?: string) => {
    try {
      setIsDeleting(true);
      const params = new URLSearchParams();
      if (reason) params.append("reason", reason);

      const response = await fetch(`/api/taskrouter/tasks/${taskSid}?${params.toString()}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.twilioTaskSid !== taskSid));
        toast({
          title: "Task Deleted",
          description: "Task has been deleted successfully",
        });
        return true;
      } else {
        throw new Error("Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [toast]);

  // Accept a task
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
        // Refresh tasks to get updated status
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

  // Reject a task
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
        // Refresh tasks to get updated status
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

  // Complete a task
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
        // Refresh tasks to get updated status
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

  // Get task by ID
  const getTask = useCallback((taskSid: string) => {
    return tasks.find(task => task.twilioTaskSid === taskSid);
  }, [tasks]);

  // Get tasks by status
  const getTasksByStatus = useCallback((status: string) => {
    return tasks.filter(task => task.assignmentStatus === status);
  }, [tasks]);

  // Get tasks by worker
  const getTasksByWorker = useCallback((workerSid: string) => {
    return tasks.filter(task => task.worker?.twilioWorkerSid === workerSid);
  }, [tasks]);

  // Get tasks by type
  const getTasksByType = useCallback((type: string) => {
    return tasks.filter(task => task.attributes.type === type);
  }, [tasks]);

  // Get tasks by priority
  const getTasksByPriority = useCallback((priority: string) => {
    return tasks.filter(task => task.attributes.priority === priority);
  }, [tasks]);

  // Get tasks by department
  const getTasksByDepartment = useCallback((department: string) => {
    return tasks.filter(task => task.attributes.department === department);
  }, [tasks]);

  // Get pending tasks
  const getPendingTasks = useCallback(() => {
    return tasks.filter(task => task.assignmentStatus === "PENDING");
  }, [tasks]);

  // Get active tasks (assigned, reserved, accepted)
  const getActiveTasks = useCallback(() => {
    return tasks.filter(task => 
      ["ASSIGNED", "RESERVED", "ACCEPTED"].includes(task.assignmentStatus)
    );
  }, [tasks]);

  // Get completed tasks
  const getCompletedTasks = useCallback(() => {
    return tasks.filter(task => task.assignmentStatus === "COMPLETED");
  }, [tasks]);

  // Get task statistics
  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.assignmentStatus === "PENDING").length;
    const active = tasks.filter(t => ["ASSIGNED", "RESERVED", "ACCEPTED"].includes(t.assignmentStatus)).length;
    const completed = tasks.filter(t => t.assignmentStatus === "COMPLETED").length;
    const canceled = tasks.filter(t => t.assignmentStatus === "CANCELED").length;
    
    const types = tasks.reduce((acc, task) => {
      const type = task.attributes.type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorities = tasks.reduce((acc, task) => {
      const priority = task.attributes.priority || "normal";
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departments = tasks.reduce((acc, task) => {
      const dept = task.attributes.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average wait time
    const pendingTasks = tasks.filter(t => t.assignmentStatus === "PENDING");
    const totalWaitTime = pendingTasks.reduce((sum, task) => {
      const waitTime = new Date().getTime() - new Date(task.createdAt).getTime();
      return sum + waitTime;
    }, 0);
    const averageWaitTime = pendingTasks.length > 0 
      ? Math.round(totalWaitTime / pendingTasks.length / 1000 / 60) // minutes
      : 0;

    return {
      total,
      pending,
      active,
      completed,
      canceled,
      types,
      priorities,
      departments,
      averageWaitTime,
    };
  }, [tasks]);

  // Refresh tasks data
  const refreshTasks = useCallback(() => {
    return fetchTasks();
  }, [fetchTasks]);

  // Load tasks on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    // Data
    tasks,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Actions
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    acceptTask,
    rejectTask,
    completeTask,
    refreshTasks,
    
    // Utilities
    getTask,
    getTasksByStatus,
    getTasksByWorker,
    getTasksByType,
    getTasksByPriority,
    getTasksByDepartment,
    getPendingTasks,
    getActiveTasks,
    getCompletedTasks,
    getTaskStats,
  };
}
