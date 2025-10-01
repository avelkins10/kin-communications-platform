"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskRouterDashboard } from "@/components/taskrouter/taskrouter-dashboard";
import { WorkerManagement } from "@/components/taskrouter/worker-management";
import { ActivityManagement } from "@/components/taskrouter/activity-management";
import { QueueManagement } from "@/components/taskrouter/queue-management";
import { WorkflowManagement } from "@/components/taskrouter/workflow-management";
import { TaskManagement } from "@/components/taskrouter/task-management";
import { LayoutDashboard, Users, Activity, Layers, Workflow, Phone } from "lucide-react";

interface Worker {
  id: string;
  twilioWorkerSid: string;
  friendlyName: string;
  attributes: {
    skills?: string[];
    department?: string;
    languages?: string[];
    timezone?: string;
    contact_uri?: string;
    name?: string;
    email?: string;
  };
  activitySid?: string;
  available: boolean;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  tasks: Array<{
    id: string;
    assignmentStatus: string;
    priority: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  twilioActivitySid: string;
  friendlyName: string;
  available: boolean;
}

interface TaskQueue {
  id: string;
  twilioTaskQueueSid: string;
  friendlyName: string;
  targetWorkers: string | null;
  maxReservedWorkers: number;
  taskOrder: "FIFO" | "LIFO";
}

interface Workflow {
  id: string;
  twilioWorkflowSid: string;
  friendlyName: string;
  configuration: any;
  taskTimeout: number;
  createdAt: string;
  updatedAt: string;
}

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

export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [queues, setQueues] = useState<TaskQueue[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/taskrouter/workers");
      if (response.ok) {
        const data = await response.json();
        setWorkers(data);
      }
    } catch (error) {
      console.error("Error fetching workers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/taskrouter/activities");
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchQueues = async () => {
    try {
      const response = await fetch("/api/taskrouter/queues");
      if (response.ok) {
        const data = await response.json();
        setQueues(data);
      }
    } catch (error) {
      console.error("Error fetching queues:", error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("/api/taskrouter/workflows");
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/taskrouter/tasks");
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchActivities();
    fetchQueues();
    fetchWorkflows();
    fetchTasks();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Tabs defaultValue="dashboard" className="space-y-4">
      <TabsList>
        <TabsTrigger value="dashboard" className="flex items-center space-x-2">
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard</span>
        </TabsTrigger>
        <TabsTrigger value="workers" className="flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Team Members</span>
        </TabsTrigger>
        <TabsTrigger value="activities" className="flex items-center space-x-2">
          <Activity className="h-4 w-4" />
          <span>Statuses</span>
        </TabsTrigger>
        <TabsTrigger value="queues" className="flex items-center space-x-2">
          <Layers className="h-4 w-4" />
          <span>Teams</span>
        </TabsTrigger>
        <TabsTrigger value="workflows" className="flex items-center space-x-2">
          <Workflow className="h-4 w-4" />
          <span>Routing Rules</span>
        </TabsTrigger>
        <TabsTrigger value="tasks" className="flex items-center space-x-2">
          <Phone className="h-4 w-4" />
          <span>Call Queue</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-4">
        <TaskRouterDashboard key={`dashboard-${refreshKey}`} onRefresh={handleRefresh} />
      </TabsContent>

      <TabsContent value="workers" className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <WorkerManagement
            key={`workers-${refreshKey}`}
            workers={workers}
            onRefresh={handleRefresh}
          />
        )}
      </TabsContent>

      <TabsContent value="activities" className="space-y-4">
        <ActivityManagement
          key={`activities-${refreshKey}`}
          activities={activities}
          onRefresh={handleRefresh}
        />
      </TabsContent>

      <TabsContent value="queues" className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <QueueManagement
            key={`queues-${refreshKey}`}
            queues={queues}
            onRefresh={handleRefresh}
          />
        )}
      </TabsContent>

      <TabsContent value="workflows" className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <WorkflowManagement
            key={`workflows-${refreshKey}`}
            workflows={workflows}
            onRefresh={handleRefresh}
          />
        )}
      </TabsContent>

      <TabsContent value="tasks" className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <TaskManagement
            key={`tasks-${refreshKey}`}
            tasks={tasks}
            onRefresh={handleRefresh}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}