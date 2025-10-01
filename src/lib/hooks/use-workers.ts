"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface Worker {
  id: string;
  twilioWorkerSid: string;
  friendlyName: string;
  available: boolean;
  activitySid?: string;
  attributes: {
    skills?: string[];
    department?: string;
    languages?: string[];
    timezone?: string;
    contact_uri?: string;
    name?: string;
    email?: string;
  };
  user: {
    id: string;
    name?: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface WorkerFilters {
  activitySid?: string;
  available?: boolean;
  skills?: string[];
  department?: string;
}

interface CreateWorkerData {
  friendlyName: string;
  attributes?: Record<string, any>;
  activitySid?: string;
  userId?: string;
}

interface UpdateWorkerData {
  friendlyName?: string;
  attributes?: Record<string, any>;
  activitySid?: string;
  available?: boolean;
}

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Fetch all workers
  const fetchWorkers = useCallback(async (filters?: WorkerFilters) => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (filters?.activitySid) params.append("activitySid", filters.activitySid);
      if (filters?.available !== undefined) params.append("available", filters.available.toString());
      if (filters?.skills) params.append("skills", filters.skills.join(","));
      if (filters?.department) params.append("department", filters.department);

      const response = await fetch(`/api/taskrouter/workers?${params.toString()}`);
      
      if (response.ok) {
        const workersData = await response.json();
        setWorkers(workersData);
        return workersData;
      } else {
        throw new Error("Failed to fetch workers");
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
      toast({
        title: "Error",
        description: "Failed to load workers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch a single worker
  const fetchWorker = useCallback(async (workerSid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/workers/${workerSid}`);
      
      if (response.ok) {
        const workerData = await response.json();
        return workerData;
      } else {
        throw new Error("Failed to fetch worker");
      }
    } catch (error) {
      console.error("Error fetching worker:", error);
      toast({
        title: "Error",
        description: "Failed to load worker details",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Create a new worker
  const createWorker = useCallback(async (workerData: CreateWorkerData) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/taskrouter/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workerData),
      });

      if (response.ok) {
        const newWorker = await response.json();
        setWorkers(prev => [...prev, newWorker]);
        toast({
          title: "Worker Created",
          description: "Worker has been created successfully",
        });
        return newWorker;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create worker");
      }
    } catch (error) {
      console.error("Error creating worker:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create worker",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }, [toast]);

  // Update a worker
  const updateWorker = useCallback(async (workerSid: string, updates: UpdateWorkerData) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/taskrouter/workers/${workerSid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedWorker = await response.json();
        setWorkers(prev => prev.map(worker => 
          worker.twilioWorkerSid === workerSid ? updatedWorker : worker
        ));
        toast({
          title: "Worker Updated",
          description: "Worker has been updated successfully",
        });
        return updatedWorker;
      } else {
        throw new Error("Failed to update worker");
      }
    } catch (error) {
      console.error("Error updating worker:", error);
      toast({
        title: "Error",
        description: "Failed to update worker",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);

  // Delete a worker
  const deleteWorker = useCallback(async (workerSid: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/taskrouter/workers/${workerSid}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWorkers(prev => prev.filter(worker => worker.twilioWorkerSid !== workerSid));
        toast({
          title: "Worker Deleted",
          description: "Worker has been deleted successfully",
        });
        return true;
      } else {
        throw new Error("Failed to delete worker");
      }
    } catch (error) {
      console.error("Error deleting worker:", error);
      toast({
        title: "Error",
        description: "Failed to delete worker",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [toast]);

  // Update worker activity
  const updateWorkerActivity = useCallback(async (workerSid: string, activitySid: string) => {
    try {
      const response = await fetch(`/api/taskrouter/workers/${workerSid}/activity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activitySid }),
      });

      if (response.ok) {
        const updatedWorker = await response.json();
        setWorkers(prev => prev.map(worker => 
          worker.twilioWorkerSid === workerSid ? updatedWorker : worker
        ));
        toast({
          title: "Activity Updated",
          description: "Worker activity has been updated successfully",
        });
        return updatedWorker;
      } else {
        throw new Error("Failed to update worker activity");
      }
    } catch (error) {
      console.error("Error updating worker activity:", error);
      toast({
        title: "Error",
        description: "Failed to update worker activity",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Get worker by ID
  const getWorker = useCallback((workerSid: string) => {
    return workers.find(worker => worker.twilioWorkerSid === workerSid);
  }, [workers]);

  // Get worker by user ID
  const getWorkerByUserId = useCallback((userId: string) => {
    return workers.find(worker => worker.user.id === userId);
  }, [workers]);

  // Get available workers
  const getAvailableWorkers = useCallback(() => {
    return workers.filter(worker => worker.available);
  }, [workers]);

  // Get workers by department
  const getWorkersByDepartment = useCallback((department: string) => {
    return workers.filter(worker => worker.attributes.department === department);
  }, [workers]);

  // Get workers by skills
  const getWorkersBySkills = useCallback((requiredSkills: string[]) => {
    return workers.filter(worker => {
      const workerSkills = worker.attributes.skills || [];
      return requiredSkills.every(skill => workerSkills.includes(skill));
    });
  }, [workers]);

  // Get workers by activity
  const getWorkersByActivity = useCallback((activitySid: string) => {
    return workers.filter(worker => worker.activitySid === activitySid);
  }, [workers]);

  // Get worker statistics
  const getWorkerStats = useCallback(() => {
    const total = workers.length;
    const available = workers.filter(w => w.available).length;
    const offline = workers.filter(w => !w.available).length;
    
    const departments = workers.reduce((acc, worker) => {
      const dept = worker.attributes.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const skills = workers.reduce((acc, worker) => {
      const workerSkills = worker.attributes.skills || [];
      workerSkills.forEach(skill => {
        acc[skill] = (acc[skill] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      available,
      offline,
      departments,
      skills,
    };
  }, [workers]);

  // Refresh workers data
  const refreshWorkers = useCallback(() => {
    return fetchWorkers();
  }, [fetchWorkers]);

  // Load workers on mount
  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return {
    // Data
    workers,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Actions
    fetchWorkers,
    fetchWorker,
    createWorker,
    updateWorker,
    deleteWorker,
    updateWorkerActivity,
    refreshWorkers,
    
    // Utilities
    getWorker,
    getWorkerByUserId,
    getAvailableWorkers,
    getWorkersByDepartment,
    getWorkersBySkills,
    getWorkersByActivity,
    getWorkerStats,
  };
}
