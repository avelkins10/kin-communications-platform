import { db } from "@/lib/db";
import { getTwilioClient } from "@/lib/twilio/client";
import { quickbaseService } from "@/lib/quickbase/service";
import { withRateLimit } from "@/lib/api/rate-limiter";
import {
  WorkerCreateParams,
  WorkerUpdateParams,
  TaskCreateParams,
  TaskAttributes,
  WorkerAttributes,
  TaskRouterStats,
  WorkerStats,
  TaskQueueStats,
  WorkflowStats,
  ReservationAcceptParams,
  ReservationRejectParams,
  ReservationCompleteParams,
  KeywordDetectionResult,
  QuickbaseRoutingResult,
  TimeBasedRoutingResult,
  SkillsBasedRoutingResult,
} from "@/types/twilio";
import type { Prisma } from "@prisma/client";

export class TaskRouterService {
  private client: any;
  private workspaceSid: string;

  constructor() {
    this.client = getTwilioClient();
    this.workspaceSid = process.env.TWILIO_WORKSPACE_SID!;
    
    // Validate all required environment variables
    if (!this.workspaceSid) {
      throw new Error("TWILIO_WORKSPACE_SID environment variable is required");
    }
    if (!process.env.TWILIO_ACCOUNT_SID) {
      throw new Error("TWILIO_ACCOUNT_SID environment variable is required");
    }
    if (!process.env.TWILIO_AUTH_TOKEN) {
      throw new Error("TWILIO_AUTH_TOKEN environment variable is required");
    }
  }

  // Worker Management
  async createWorker(params: WorkerCreateParams, userId: string) {
    try {
      // Create worker in Twilio
      const twilioWorker = await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .workers.create({
          friendlyName: params.friendlyName,
          attributes: JSON.stringify(params.attributes),
          activitySid: params.activitySid,
        });

      // Create worker in database
      const worker = await db.worker.create({
        data: {
          twilioWorkerSid: twilioWorker.sid,
          userId,
          friendlyName: params.friendlyName,
          attributes: params.attributes as Prisma.JsonObject,
          activitySid: params.activitySid,
        },
        include: {
          User: true,
          activity: true,
        },
      });

      // Update user with worker SID
      await db.user.update({
        where: { id: userId },
        data: { twilioWorkerSid: twilioWorker.sid },
      });

      return worker;
    } catch (error) {
      console.error("Error creating worker:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to create worker: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to create worker");
    }
  }

  async updateWorker(workerId: string, params: WorkerUpdateParams) {
    try {
      const worker = await db.worker.findUnique({
        where: { id: workerId },
      });

      if (!worker) {
        throw new Error("Worker not found");
      }

      // Update worker in Twilio
      const updateData: any = {};
      if (params.friendlyName) updateData.friendlyName = params.friendlyName;
      if (params.attributes) updateData.attributes = JSON.stringify(params.attributes);
      if (params.activitySid) updateData.activitySid = params.activitySid;

      await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .workers(worker.twilioWorkerSid)
        .update(updateData);

      // Update worker in database
      const updatedWorker = await db.worker.update({
        where: { id: workerId },
        data: {
          friendlyName: params.friendlyName,
          attributes: params.attributes as Prisma.JsonObject,
          activitySid: params.activitySid,
        },
        include: {
          User: true,
          activity: true,
        },
      });

      return updatedWorker;
    } catch (error) {
      console.error("Error updating worker:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to update worker: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to update worker");
    }
  }

  async deleteWorker(workerId: string) {
    try {
      const worker = await db.worker.findUnique({
        where: { id: workerId },
      });

      if (!worker) {
        throw new Error("Worker not found");
      }

      // Delete worker from Twilio
      await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .workers(worker.twilioWorkerSid)
        .remove();

      // Delete worker from database
      await db.worker.delete({
        where: { id: workerId },
      });

      // Update user to remove worker SID
      await db.user.update({
        where: { id: worker.userId },
        data: { twilioWorkerSid: null },
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting worker:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to delete worker: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to delete worker");
    }
  }

  async getWorkers(filters?: {
    activity?: string;
    available?: boolean;
    skills?: string[];
    department?: string;
  }) {
    try {
      const where: Prisma.WorkerWhereInput = {};

      if (filters?.activity) {
        where.activitySid = filters.activity;
      }

      if (filters?.available !== undefined) {
        where.available = filters.available;
      }

      // Combine JSONB conditions for skills and department
      const jsonbConditions: any[] = [];
      
      if (filters?.skills && filters.skills.length > 0) {
        jsonbConditions.push({
          path: ["skills"],
          array_contains: filters.skills,
        });
      }

      if (filters?.department) {
        jsonbConditions.push({
          path: ["department"],
          equals: filters.department,
        });
      }

      if (jsonbConditions.length > 0) {
        if (jsonbConditions.length === 1) {
          where.attributes = jsonbConditions[0];
        } else {
          where.attributes = {
            AND: jsonbConditions,
          };
        }
      }

      console.log("getWorkers called with filters:", JSON.stringify(filters));
      console.log("Built where clause:", JSON.stringify(where));

      // Debug: Check total count
      const totalCount = await db.worker.count();
      console.log(`Total workers in DB (count): ${totalCount}`);

      const workers = await db.worker.findMany({
        where,
        include: {
          User: true,
          activity: true,
          Task: {
            where: {
              assignmentStatus: {
                in: ["PENDING", "ASSIGNED", "RESERVED", "ACCEPTED"],
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      console.log(`Found ${workers.length} workers - First: ${workers[0]?.friendlyName || "no name"}`);

      return workers;
    } catch (error) {
      console.error("Error fetching workers - full error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;  // Throw original error instead of wrapping it
    }
  }

  async getWorker(workerId: string) {
    try {
      const worker = await db.worker.findUnique({
        where: { id: workerId },
        include: {
          User: true,
          activity: true,
          Task: {
            where: {
              assignmentStatus: {
                in: ["PENDING", "ASSIGNED", "RESERVED", "ACCEPTED"],
              },
            },
          },
          Reservation: {
            where: {
              status: "PENDING",
            },
          },
        },
      });

      if (!worker) {
        throw new Error("Worker not found");
      }

      return worker;
    } catch (error) {
      console.error("Error fetching worker:", error);
      throw new Error("Failed to fetch worker");
    }
  }

  async getWorkerByTwilioSid(twilioWorkerSid: string) {
    try {
      const worker = await db.worker.findUnique({
        where: { twilioWorkerSid },
        include: {
          User: true,
          activity: true,
          Task: {
            where: {
              assignmentStatus: {
                in: ["PENDING", "ASSIGNED", "RESERVED", "ACCEPTED"],
              },
            },
          },
          Reservation: {
            where: {
              status: "PENDING",
            },
          },
        },
      });

      if (!worker) {
        throw new Error("Worker not found");
      }

      return worker;
    } catch (error) {
      console.error("Error fetching worker by Twilio SID:", error);
      throw new Error("Failed to fetch worker");
    }
  }

  // Task Management
  async createTask(params: TaskCreateParams, relatedEntity?: {
    callId?: string;
    messageId?: string;
  }) {
    try {
      // Create task in Twilio with rate limiting
      const twilioTask = await withRateLimit('twilio', 'taskrouter', async () => {
        return await this.client.taskrouter.v1
          .workspaces(this.workspaceSid)
          .tasks.create({
            workflowSid: params.workflowSid,
            attributes: JSON.stringify(params.attributes),
            priority: params.priority,
            timeout: params.timeout,
            taskChannel: params.taskChannel,
          });
      });

      // Create task in database
      const task = await db.task.create({
        data: {
          twilioTaskSid: twilioTask.sid,
          taskQueueSid: params.taskQueueSid,
          workflowSid: params.workflowSid,
          attributes: params.attributes as Prisma.JsonObject,
          priority: params.priority || 0,
          callId: relatedEntity?.callId,
          messageId: relatedEntity?.messageId,
        },
        include: {
          call: true,
          message: true,
          worker: {
            include: {
              User: true,
            },
          },
          taskQueue: true,
        },
      });

      return task;
    } catch (error) {
      console.error("Error creating task:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to create task: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to create task");
    }
  }

  async getTasks(filters?: {
    status?: string;
    workerId?: string;
    queueId?: string;
    type?: string;
    priority?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    try {
      const where: Prisma.TaskWhereInput = {};

      if (filters?.status) {
        where.assignmentStatus = filters.status as any;
      }

      if (filters?.workerId) {
        where.workerId = filters.workerId;
      }

      if (filters?.queueId) {
        where.taskQueueSid = filters.queueId;
      }

      if (filters?.type) {
        where.attributes = {
          path: ["type"],
          equals: filters.type,
        };
      }

      if (filters?.priority) {
        where.attributes = {
          path: ["priority"],
          equals: filters.priority,
        };
      }

      if (filters?.dateFrom || filters?.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) where.createdAt.lte = filters.dateTo;
      }

      const tasks = await db.task.findMany({
        where,
        include: {
          worker: {
            include: {
              User: true,
            },
          },
          call: true,
          message: true,
          reservations: true,
          taskQueue: true,
        },
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" },
        ],
      });

      return tasks;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw new Error("Failed to fetch tasks");
    }
  }

  async getTask(taskId: string) {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
          worker: {
            include: {
              User: true,
            },
          },
          call: true,
          message: true,
          reservations: true,
          taskQueue: true,
        },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      return task;
    } catch (error) {
      console.error("Error fetching task:", error);
      throw new Error("Failed to fetch task");
    }
  }

  async updateTask(taskId: string, updates: {
    attributes?: TaskAttributes;
    priority?: number;
    assignmentStatus?: string;
  }) {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      // Update task in Twilio
      const updateData: any = {};
      if (updates.attributes) {
        updateData.attributes = JSON.stringify(updates.attributes);
      }
      if (updates.priority !== undefined) {
        updateData.priority = updates.priority;
      }

      await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .tasks(task.twilioTaskSid)
        .update(updateData);

      // Update task in database
      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: {
          attributes: updates.attributes as Prisma.JsonObject,
          priority: updates.priority,
          assignmentStatus: updates.assignmentStatus as any,
        },
        include: {
          worker: {
            include: {
              User: true,
            },
          },
          call: true,
          message: true,
          reservations: true,
          taskQueue: true,
        },
      });

      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to update task: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to update task");
    }
  }

  async cancelTask(taskId: string, reason?: string) {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      // Cancel task in Twilio
      await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .tasks(task.twilioTaskSid)
        .update({
          assignmentStatus: "canceled",
          reason: reason,
        });

      // Update task in database
      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: {
          assignmentStatus: "CANCELED",
        },
      });

      return updatedTask;
    } catch (error) {
      console.error("Error canceling task:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to cancel task: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to cancel task");
    }
  }

  // Reservation Management
  async acceptReservation(reservationId: string, params: ReservationAcceptParams) {
    try {
      const reservation = await db.reservation.findUnique({
        where: { id: reservationId },
        include: {
          task: true,
          worker: true,
        },
      });

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      // Accept reservation in Twilio
      await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .tasks(reservation.task.twilioTaskSid)
        .reservations(reservation.twilioReservationSid)
        .update({
          reservationStatus: "accepted",
          ...params,
        });

      // Update reservation in database
      const updatedReservation = await db.reservation.update({
        where: { id: reservationId },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      // Update task status
      await db.task.update({
        where: { id: reservation.taskId },
        data: {
          assignmentStatus: "ACCEPTED",
          workerId: reservation.workerId,
        },
      });

      return updatedReservation;
    } catch (error) {
      console.error("Error accepting reservation:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to accept reservation: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to accept reservation");
    }
  }

  async rejectReservation(reservationId: string, params: ReservationRejectParams) {
    try {
      const reservation = await db.reservation.findUnique({
        where: { id: reservationId },
        include: {
          task: true,
        },
      });

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      // Reject reservation in Twilio
      await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .tasks(reservation.task.twilioTaskSid)
        .reservations(reservation.twilioReservationSid)
        .update({
          reservationStatus: "rejected",
          reason: params.reason,
        });

      // Update reservation in database
      const updatedReservation = await db.reservation.update({
        where: { id: reservationId },
        data: {
          status: "REJECTED",
          rejectedAt: new Date(),
        },
      });

      return updatedReservation;
    } catch (error) {
      console.error("Error rejecting reservation:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to reject reservation: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to reject reservation");
    }
  }

  async completeReservation(reservationId: string, params: ReservationCompleteParams) {
    try {
      const reservation = await db.reservation.findUnique({
        where: { id: reservationId },
        include: {
          task: true,
        },
      });

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      // Complete reservation in Twilio
      await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .tasks(reservation.task.twilioTaskSid)
        .reservations(reservation.twilioReservationSid)
        .update({
          reservationStatus: "completed",
          instruction: params.instruction,
        });

      // Update reservation in database
      const updatedReservation = await db.reservation.update({
        where: { id: reservationId },
        data: {
          status: "COMPLETED",
        },
      });

      // Update task status
      await db.task.update({
        where: { id: reservation.taskId },
        data: {
          assignmentStatus: "COMPLETED",
        },
      });

      return updatedReservation;
    } catch (error) {
      console.error("Error completing reservation:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to complete reservation: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to complete reservation");
    }
  }

  // Statistics
  async getTaskRouterStats(): Promise<TaskRouterStats> {
    try {
      // Get all workers with their activities to calculate proper stats
      const workers = await db.worker.findMany({
        include: {
          User: true,
          activity: true,
        },
      });

      // Get all activities to determine availability
      const activities = await db.activity.findMany();

      // Create activity lookup map
      const activityMap = new Map(activities.map(a => [a.twilioActivitySid, a]));

      // Calculate worker stats based on activity availability
      let activeWorkers = 0;
      let availableWorkers = 0;
      let busyWorkers = 0;
      let offlineWorkers = 0;

      for (const worker of workers) {
        if (worker.activity) {
          if (worker.activity.available) {
            availableWorkers++;
            activeWorkers++;
          } else {
            busyWorkers++;
            activeWorkers++;
          }
        } else {
          offlineWorkers++;
        }
      }

      const [
        pendingTasks,
        assignedTasks,
        completedTasks,
      ] = await Promise.all([
        db.task.count({ where: { assignmentStatus: "PENDING" } }),
        db.task.count({ where: { assignmentStatus: { in: ["ASSIGNED", "RESERVED", "ACCEPTED"] } } }),
        db.task.count({ where: { assignmentStatus: "COMPLETED" } }),
      ]);

      // Calculate average wait time and handle time
      const completedTasksWithTimes = await db.task.findMany({
        where: {
          assignmentStatus: "COMPLETED",
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      });

      const averageWaitTime = completedTasksWithTimes.length > 0
        ? completedTasksWithTimes.reduce((sum, task) => {
            const waitTime = task.updatedAt.getTime() - task.createdAt.getTime();
            return sum + waitTime;
          }, 0) / completedTasksWithTimes.length / 1000 // Convert to seconds
        : 0;

      const averageHandleTime = averageWaitTime; // Simplified for now

      return {
        activeWorkers,
        availableWorkers,
        busyWorkers,
        offlineWorkers,
        pendingTasks,
        assignedTasks,
        completedTasks,
        averageWaitTime,
        averageHandleTime,
      };
    } catch (error) {
      console.error("Error fetching TaskRouter stats:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to fetch TaskRouter statistics: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to fetch TaskRouter statistics");
    }
  }

  async getWorkerStats(workerId: string): Promise<WorkerStats> {
    try {
      const worker = await db.worker.findUnique({
        where: { id: workerId },
        include: {
          Task: {
            where: {
              assignmentStatus: "COMPLETED",
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
          Reservation: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      });

      if (!worker) {
        throw new Error("Worker not found");
      }

      const tasksCompleted = worker.Task.length;
      const tasksAccepted = worker.Reservation.filter(r => r.status === "ACCEPTED").length;
      const tasksRejected = worker.Reservation.filter(r => r.status === "REJECTED").length;

      const averageHandleTime = tasksCompleted > 0
        ? worker.Task.reduce((sum, task) => {
            const handleTime = task.updatedAt.getTime() - task.createdAt.getTime();
            return sum + handleTime;
          }, 0) / tasksCompleted / 1000 // Convert to seconds
        : 0;

      return {
        workerSid: worker.twilioWorkerSid,
        tasksCompleted,
        tasksAccepted,
        tasksRejected,
        averageHandleTime,
        totalTalkTime: 0, // Would need call duration data
        totalIdleTime: 0, // Would need activity tracking
        lastActivityChange: worker.updatedAt,
      };
    } catch (error) {
      console.error("Error fetching worker stats:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to fetch worker statistics: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to fetch worker statistics");
    }
  }

  // ===== Activity Management =====

  async getActivities() {
    try {
      console.log("Fetching activities from Twilio...");
      console.log("Workspace SID:", this.workspaceSid);

      // Fetch from Twilio
      const twilioActivities = await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .activities.list();

      console.log(`Found ${twilioActivities.length} activities in Twilio`);

      // Sync to database
      for (const twilioActivity of twilioActivities) {
        await db.activity.upsert({
          where: { twilioActivitySid: twilioActivity.sid },
          update: {
            friendlyName: twilioActivity.friendlyName,
            available: twilioActivity.available,
            updatedAt: new Date(),
          },
          create: {
            twilioActivitySid: twilioActivity.sid,
            friendlyName: twilioActivity.friendlyName,
            available: twilioActivity.available,
            updatedAt: new Date(),
          },
        });
      }

      // Return from database
      const activities = await db.activity.findMany({
        orderBy: { friendlyName: "asc" },
      });

      console.log(`Returning ${activities.length} activities from database`);
      return activities;
    } catch (error) {
      console.error("Error fetching activities:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to fetch activities: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw error;
    }
  }

  async createActivity(params: { friendlyName: string; available: boolean }) {
    try {
      // Create in Twilio
      const twilioActivity = await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .activities.create({
          friendlyName: params.friendlyName,
          available: params.available,
        });

      // Create in database
      const activity = await db.activity.create({
        data: {
          twilioActivitySid: twilioActivity.sid,
          friendlyName: twilioActivity.friendlyName,
          available: twilioActivity.available,
        },
      });

      return activity;
    } catch (error) {
      console.error("Error creating activity:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to create activity: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to create activity");
    }
  }

  async updateActivity(
    activityId: string,
    params: { friendlyName?: string }
  ) {
    try {
      // Get from database
      const activity = await db.activity.findUnique({
        where: { id: activityId },
      });

      if (!activity) {
        throw new Error("Activity not found");
      }

      // Update in Twilio
      const twilioActivity = await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .activities(activity.twilioActivitySid)
        .update({
          friendlyName: params.friendlyName,
        });

      // Update in database
      const updatedActivity = await db.activity.update({
        where: { id: activityId },
        data: {
          friendlyName: twilioActivity.friendlyName,
        },
      });

      return updatedActivity;
    } catch (error) {
      console.error("Error updating activity:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to update activity: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to update activity");
    }
  }

  async deleteActivity(activityId: string) {
    try {
      // Get from database
      const activity = await db.activity.findUnique({
        where: { id: activityId },
      });

      if (!activity) {
        throw new Error("Activity not found");
      }

      // Delete from Twilio
      await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .activities(activity.twilioActivitySid)
        .remove();

      // Delete from database
      await db.activity.delete({
        where: { id: activityId },
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting activity:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to delete activity: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to delete activity");
    }
  }

  // ===== Task Queue Management =====

  async getTaskQueues() {
    try {
      // Fetch from Twilio
      const twilioQueues = await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .taskQueues.list();

      // Sync to database
      for (const twilioQueue of twilioQueues) {
        await db.taskQueue.upsert({
          where: { twilioTaskQueueSid: twilioQueue.sid },
          update: {
            friendlyName: twilioQueue.friendlyName,
            targetWorkers: twilioQueue.targetWorkers || null,
            maxReservedWorkers: twilioQueue.maxReservedWorkers,
            taskOrder: twilioQueue.taskOrder as "FIFO" | "LIFO",
            updatedAt: new Date(),
          },
          create: {
            twilioTaskQueueSid: twilioQueue.sid,
            friendlyName: twilioQueue.friendlyName,
            targetWorkers: twilioQueue.targetWorkers || null,
            maxReservedWorkers: twilioQueue.maxReservedWorkers,
            taskOrder: (twilioQueue.taskOrder as "FIFO" | "LIFO") || "FIFO",
            updatedAt: new Date(),
          },
        });
      }

      // Return from database
      const queues = await db.taskQueue.findMany({
        orderBy: { friendlyName: "asc" },
      });

      return queues;
    } catch (error) {
      console.error("Error fetching task queues:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to fetch task queues: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw error;
    }
  }

  async createTaskQueue(params: {
    friendlyName: string;
    targetWorkers?: string;
    maxReservedWorkers?: number;
    taskOrder?: "FIFO" | "LIFO";
  }) {
    try {
      // Create in Twilio
      const twilioQueue = await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .taskQueues.create({
          friendlyName: params.friendlyName,
          targetWorkers: params.targetWorkers || "1==1",
          maxReservedWorkers: params.maxReservedWorkers || 1,
          taskOrder: params.taskOrder || "FIFO",
        });

      // Create in database
      const queue = await db.taskQueue.create({
        data: {
          twilioTaskQueueSid: twilioQueue.sid,
          friendlyName: twilioQueue.friendlyName,
          targetWorkers: twilioQueue.targetWorkers || null,
          maxReservedWorkers: twilioQueue.maxReservedWorkers,
          taskOrder: (twilioQueue.taskOrder as "FIFO" | "LIFO") || "FIFO",
          updatedAt: new Date(),
        },
      });

      return queue;
    } catch (error) {
      console.error("Error creating task queue:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to create task queue: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to create task queue");
    }
  }

  async updateTaskQueue(
    queueId: string,
    params: {
      friendlyName?: string;
      targetWorkers?: string;
      maxReservedWorkers?: number;
      taskOrder?: "FIFO" | "LIFO";
    }
  ) {
    try {
      // Get from database
      const queue = await db.taskQueue.findUnique({
        where: { id: queueId },
      });

      if (!queue) {
        throw new Error("Task queue not found");
      }

      // Update in Twilio
      const twilioQueue = await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .taskQueues(queue.twilioTaskQueueSid)
        .update({
          friendlyName: params.friendlyName,
          targetWorkers: params.targetWorkers,
          maxReservedWorkers: params.maxReservedWorkers,
          taskOrder: params.taskOrder,
        });

      // Update in database
      const updatedQueue = await db.taskQueue.update({
        where: { id: queueId },
        data: {
          friendlyName: twilioQueue.friendlyName,
          targetWorkers: twilioQueue.targetWorkers || null,
          maxReservedWorkers: twilioQueue.maxReservedWorkers,
          taskOrder: (twilioQueue.taskOrder as "FIFO" | "LIFO") || "FIFO",
          updatedAt: new Date(),
        },
      });

      return updatedQueue;
    } catch (error) {
      console.error("Error updating task queue:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to update task queue: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to update task queue");
    }
  }

  async deleteTaskQueue(queueId: string) {
    try {
      // Get from database
      const queue = await db.taskQueue.findUnique({
        where: { id: queueId },
      });

      if (!queue) {
        throw new Error("Task queue not found");
      }

      // Delete from Twilio
      await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .taskQueues(queue.twilioTaskQueueSid)
        .remove();

      // Delete from database
      await db.taskQueue.delete({
        where: { id: queueId },
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting task queue:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to delete task queue: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to delete task queue");
    }
  }

  // ===== Workflow Management =====

  async getWorkflows() {
    try {
      // Fetch from Twilio
      const twilioWorkflows = await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .workflows.list();

      // Sync to database
      for (const twilioWorkflow of twilioWorkflows) {
        await db.workflow.upsert({
          where: { twilioWorkflowSid: twilioWorkflow.sid },
          update: {
            friendlyName: twilioWorkflow.friendlyName,
            configuration: twilioWorkflow.configuration as Prisma.JsonObject,
            taskTimeout: twilioWorkflow.taskReservationTimeout || 300,
            updatedAt: new Date(),
          },
          create: {
            twilioWorkflowSid: twilioWorkflow.sid,
            friendlyName: twilioWorkflow.friendlyName,
            configuration: twilioWorkflow.configuration as Prisma.JsonObject,
            taskTimeout: twilioWorkflow.taskReservationTimeout || 300,
            updatedAt: new Date(),
          },
        });
      }

      // Return from database
      const workflows = await db.workflow.findMany({
        orderBy: { friendlyName: "asc" },
      });

      return workflows;
    } catch (error) {
      console.error("Error fetching workflows:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to fetch workflows: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw error;
    }
  }

  async createWorkflow(params: {
    friendlyName: string;
    configuration: any;
    taskTimeout?: number;
  }) {
    try {
      // Create in Twilio
      const twilioWorkflow = await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .workflows.create({
          friendlyName: params.friendlyName,
          configuration: JSON.stringify(params.configuration),
          taskReservationTimeout: params.taskTimeout || 300,
        });

      // Create in database
      const workflow = await db.workflow.create({
        data: {
          twilioWorkflowSid: twilioWorkflow.sid,
          friendlyName: twilioWorkflow.friendlyName,
          configuration: params.configuration as Prisma.JsonObject,
          taskTimeout: params.taskTimeout || 300,
          updatedAt: new Date(),
        },
      });

      return workflow;
    } catch (error) {
      console.error("Error creating workflow:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to create workflow: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to create workflow");
    }
  }

  async updateWorkflow(
    workflowId: string,
    params: {
      friendlyName?: string;
      configuration?: any;
      taskTimeout?: number;
    }
  ) {
    try {
      // Get from database
      const workflow = await db.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        throw new Error("Workflow not found");
      }

      // Update in Twilio
      const updateData: any = {};
      if (params.friendlyName) updateData.friendlyName = params.friendlyName;
      if (params.configuration) updateData.configuration = JSON.stringify(params.configuration);
      if (params.taskTimeout) updateData.taskReservationTimeout = params.taskTimeout;

      const twilioWorkflow = await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .workflows(workflow.twilioWorkflowSid)
        .update(updateData);

      // Update in database
      const updatedWorkflow = await db.workflow.update({
        where: { id: workflowId },
        data: {
          friendlyName: params.friendlyName || workflow.friendlyName,
          configuration: (params.configuration as Prisma.JsonObject) || workflow.configuration,
          taskTimeout: params.taskTimeout || workflow.taskTimeout,
          updatedAt: new Date(),
        },
      });

      return updatedWorkflow;
    } catch (error) {
      console.error("Error updating workflow:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to update workflow: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to update workflow");
    }
  }

  async deleteWorkflow(workflowId: string) {
    try {
      // Get from database
      const workflow = await db.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        throw new Error("Workflow not found");
      }

      // Delete from Twilio
      await this.client.taskrouter
        .workspaces(this.workspaceSid)
        .workflows(workflow.twilioWorkflowSid)
        .remove();

      // Delete from database
      await db.workflow.delete({
        where: { id: workflowId },
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting workflow:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to delete workflow: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to delete workflow");
    }
  }

  // Token Generation
  async generateWorkerToken(workerSid: string, ttl: number = 3600) {
    try {
      const AccessToken = require('twilio').jwt.AccessToken;
      const TaskRouterGrant = AccessToken.TaskRouterGrant;

      const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_API_KEY!,
        process.env.TWILIO_API_SECRET!,
        { ttl }
      );

      const taskRouterGrant = new TaskRouterGrant({
        workspaceSid: this.workspaceSid,
        workerSid: workerSid,
        role: 'worker'
      });

      token.addGrant(taskRouterGrant);

      return {
        token: token.toJwt(),
        ttl,
        workerSid,
      };
    } catch (error) {
      console.error("Error generating worker token:", error);
      
      // Enhanced error handling with Twilio-specific details
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(`Failed to generate worker token: ${error.message || 'Unknown Twilio error'} (Code: ${error.code})`);
      }
      throw new Error("Failed to generate worker token");
    }
  }
}

export const taskRouterService = new TaskRouterService();

// Export individual functions for direct use
export const createTaskRouterWorker = (params: WorkerCreateParams, userId: string) => 
  taskRouterService.createWorker(params, userId);

export const updateTaskRouterWorker = (workerId: string, params: WorkerUpdateParams) => 
  taskRouterService.updateWorker(workerId, params);

export const deleteTaskRouterWorker = (workerId: string) => 
  taskRouterService.deleteWorker(workerId);
