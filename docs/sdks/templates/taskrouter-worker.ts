/**
 * TaskRouter Worker Management Template for Phase 7
 * KIN Communications Platform
 * 
 * This template provides comprehensive TaskRouter worker management
 * including initialization, task handling, and real-time event processing.
 */

import { EventEmitter } from 'events';

// Types
interface WorkerOptions {
  edge?: string;
  region?: string;
  closeExistingSessions?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

interface TaskAttributes {
  [key: string]: any;
  type?: string;
  priority?: number;
  customer_id?: string;
  department?: string;
  skills?: string[];
}

interface WorkerAttributes {
  [key: string]: any;
  name?: string;
  email?: string;
  skills?: string[];
  department?: string;
  languages?: string[];
  max_concurrent_tasks?: number;
}

interface ReservationOptions {
  timeout?: number;
  instruction?: string;
  dequeueFrom?: string;
  dequeueStatusCallbackUrl?: string;
  dequeueStatusCallbackEvent?: string[];
}

// TaskRouter Worker Manager
export class TaskRouterWorkerManager extends EventEmitter {
  private worker: any;
  private token: string;
  private options: WorkerOptions;
  private isConnected: boolean = false;
  private currentActivity: string | null = null;
  private reservations: Map<string, any> = new Map();

  constructor(token: string, options: WorkerOptions = {}) {
    super();
    this.token = token;
    this.options = {
      edge: 'ashburn',
      region: 'us1',
      closeExistingSessions: true,
      logLevel: 'info',
      ...options
    };
  }

  /**
   * Initialize and connect the worker
   */
  async initialize(): Promise<boolean> {
    try {
      // Note: This would be used in a browser environment
      // The actual TaskRouter.Worker would be imported from twilio-taskrouter
      /*
      const TaskRouter = require('twilio-taskrouter');
      this.worker = new TaskRouter.Worker(this.token, this.options);

      this.setupEventListeners();
      await this.connect();

      return true;
      */
      console.log('TaskRouter Worker initialized (placeholder)');
      return true;
    } catch (error) {
      console.error('Error initializing TaskRouter worker:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Setup event listeners for the worker
   */
  private setupEventListeners(): void {
    if (!this.worker) return;

    // Worker events
    this.worker.on('ready', (worker: any) => {
      console.log(`Worker ${worker.sid} is ready for work`);
      this.isConnected = true;
      this.currentActivity = worker.activityName;
      this.emit('ready', worker);
    });

    this.worker.on('error', (error: any) => {
      console.error('Worker error:', error);
      this.emit('error', error);
    });

    this.worker.on('disconnected', () => {
      console.log('Worker disconnected');
      this.isConnected = false;
      this.emit('disconnected');
    });

    this.worker.on('tokenExpired', () => {
      console.log('Worker token expired');
      this.emit('tokenExpired');
    });

    this.worker.on('activityUpdated', (activity: any) => {
      console.log(`Worker activity updated: ${activity.activityName}`);
      this.currentActivity = activity.activityName;
      this.emit('activityUpdated', activity);
    });

    this.worker.on('attributesUpdated', (attributes: any) => {
      console.log('Worker attributes updated:', attributes);
      this.emit('attributesUpdated', attributes);
    });

    // Reservation events
    this.worker.on('reservationCreated', (reservation: any) => {
      console.log(`Reservation ${reservation.sid} created for task ${reservation.task.sid}`);
      this.reservations.set(reservation.sid, reservation);
      this.emit('reservationCreated', reservation);
      this.setupReservationListeners(reservation);
    });

    this.worker.on('reservationFailed', (reservation: any) => {
      console.log(`Reservation ${reservation.sid} failed`);
      this.reservations.delete(reservation.sid);
      this.emit('reservationFailed', reservation);
    });
  }

  /**
   * Setup event listeners for a reservation
   */
  private setupReservationListeners(reservation: any): void {
    reservation.on('accepted', (acceptedReservation: any) => {
      console.log(`Reservation ${acceptedReservation.sid} accepted`);
      this.emit('reservationAccepted', acceptedReservation);
    });

    reservation.on('rejected', (rejectedReservation: any) => {
      console.log(`Reservation ${rejectedReservation.sid} rejected`);
      this.reservations.delete(rejectedReservation.sid);
      this.emit('reservationRejected', rejectedReservation);
    });

    reservation.on('timeout', (timeoutReservation: any) => {
      console.log(`Reservation ${timeoutReservation.sid} timed out`);
      this.reservations.delete(timeoutReservation.sid);
      this.emit('reservationTimeout', timeoutReservation);
    });

    reservation.on('canceled', (canceledReservation: any) => {
      console.log(`Reservation ${canceledReservation.sid} canceled`);
      this.reservations.delete(canceledReservation.sid);
      this.emit('reservationCanceled', canceledReservation);
    });

    reservation.on('completed', (completedReservation: any) => {
      console.log(`Reservation ${completedReservation.sid} completed`);
      this.reservations.delete(completedReservation.sid);
      this.emit('reservationCompleted', completedReservation);
    });

    reservation.on('wrapup', (wrapupReservation: any) => {
      console.log(`Reservation ${wrapupReservation.sid} in wrap-up`);
      this.emit('reservationWrapup', wrapupReservation);
    });
  }

  /**
   * Connect the worker to TaskRouter
   */
  private async connect(): Promise<void> {
    if (!this.worker) return;

    try {
      await this.worker.connect();
      console.log('Worker connected to TaskRouter');
    } catch (error) {
      console.error('Error connecting worker:', error);
      throw error;
    }
  }

  /**
   * Disconnect the worker
   */
  async disconnect(): Promise<void> {
    if (!this.worker) return;

    try {
      await this.worker.disconnect();
      this.isConnected = false;
      console.log('Worker disconnected from TaskRouter');
    } catch (error) {
      console.error('Error disconnecting worker:', error);
      throw error;
    }
  }

  /**
   * Update worker attributes
   */
  async updateAttributes(attributes: WorkerAttributes): Promise<boolean> {
    if (!this.worker) return false;

    try {
      await this.worker.updateAttributes(attributes);
      console.log('Worker attributes updated:', attributes);
      return true;
    } catch (error) {
      console.error('Error updating worker attributes:', error);
      return false;
    }
  }

  /**
   * Update worker activity
   */
  async updateActivity(activitySid: string): Promise<boolean> {
    if (!this.worker) return false;

    try {
      await this.worker.updateActivity(activitySid);
      console.log(`Worker activity updated to: ${activitySid}`);
      return true;
    } catch (error) {
      console.error('Error updating worker activity:', error);
      return false;
    }
  }

  /**
   * Accept a reservation
   */
  async acceptReservation(reservationSid: string, options: ReservationOptions = {}): Promise<boolean> {
    const reservation = this.reservations.get(reservationSid);
    if (!reservation) {
      console.error(`Reservation ${reservationSid} not found`);
      return false;
    }

    try {
      await reservation.accept(options);
      console.log(`Reservation ${reservationSid} accepted`);
      return true;
    } catch (error) {
      console.error(`Error accepting reservation ${reservationSid}:`, error);
      return false;
    }
  }

  /**
   * Reject a reservation
   */
  async rejectReservation(reservationSid: string, reason?: string): Promise<boolean> {
    const reservation = this.reservations.get(reservationSid);
    if (!reservation) {
      console.error(`Reservation ${reservationSid} not found`);
      return false;
    }

    try {
      await reservation.reject(reason);
      console.log(`Reservation ${reservationSid} rejected`);
      return true;
    } catch (error) {
      console.error(`Error rejecting reservation ${reservationSid}:`, error);
      return false;
    }
  }

  /**
   * Complete a reservation
   */
  async completeReservation(reservationSid: string, attributes?: TaskAttributes): Promise<boolean> {
    const reservation = this.reservations.get(reservationSid);
    if (!reservation) {
      console.error(`Reservation ${reservationSid} not found`);
      return false;
    }

    try {
      await reservation.complete(attributes);
      console.log(`Reservation ${reservationSid} completed`);
      return true;
    } catch (error) {
      console.error(`Error completing reservation ${reservationSid}:`, error);
      return false;
    }
  }

  /**
   * Put reservation in wrap-up
   */
  async wrapupReservation(reservationSid: string, attributes?: TaskAttributes): Promise<boolean> {
    const reservation = this.reservations.get(reservationSid);
    if (!reservation) {
      console.error(`Reservation ${reservationSid} not found`);
      return false;
    }

    try {
      await reservation.wrapup(attributes);
      console.log(`Reservation ${reservationSid} in wrap-up`);
      return true;
    } catch (error) {
      console.error(`Error wrapping up reservation ${reservationSid}:`, error);
      return false;
    }
  }

  /**
   * Get worker status
   */
  getWorkerStatus(): any {
    if (!this.worker) return null;

    return {
      sid: this.worker.sid,
      friendlyName: this.worker.friendlyName,
      activityName: this.worker.activityName,
      activitySid: this.worker.activitySid,
      attributes: this.worker.attributes,
      available: this.worker.available,
      isConnected: this.isConnected,
      currentActivity: this.currentActivity,
      activeReservations: this.reservations.size
    };
  }

  /**
   * Get active reservations
   */
  getActiveReservations(): any[] {
    return Array.from(this.reservations.values()).map(reservation => ({
      sid: reservation.sid,
      taskSid: reservation.task.sid,
      taskAttributes: reservation.task.attributes,
      status: reservation.status,
      timeout: reservation.timeout
    }));
  }

  /**
   * Refresh worker token
   */
  async refreshToken(newToken: string): Promise<boolean> {
    if (!this.worker) return false;

    try {
      await this.worker.updateToken(newToken);
      this.token = newToken;
      console.log('Worker token refreshed');
      return true;
    } catch (error) {
      console.error('Error refreshing worker token:', error);
      return false;
    }
  }
}

// TaskRouter Server-side Manager
export class TaskRouterServerManager {
  private client: any;
  private workspaceSid: string;

  constructor(accountSid: string, authToken: string, workspaceSid: string) {
    const twilio = require('twilio');
    this.client = twilio(accountSid, authToken);
    this.workspaceSid = workspaceSid;
  }

  /**
   * Create a new task
   */
  async createTask(attributes: TaskAttributes, workflowSid: string, taskQueueSid?: string, priority: number = 0, timeout: number = 86400): Promise<any> {
    try {
      const task = await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .tasks
        .create({
          attributes: JSON.stringify(attributes),
          workflowSid: workflowSid,
          taskQueueSid: taskQueueSid,
          priority: priority,
          timeout: timeout
        });

      console.log(`Task ${task.sid} created`);
      return {
        success: true,
        task: {
          sid: task.sid,
          attributes: task.attributes,
          assignmentStatus: task.assignmentStatus,
          priority: task.priority,
          age: task.age,
          timeout: task.timeout,
          workflowSid: task.workflowSid,
          workflowFriendlyName: task.workflowFriendlyName,
          queueSid: task.queueSid,
          queueFriendlyName: task.queueFriendlyName
        }
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get task details
   */
  async getTask(taskSid: string): Promise<any> {
    try {
      const task = await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .tasks(taskSid)
        .fetch();

      return {
        success: true,
        task: {
          sid: task.sid,
          attributes: task.attributes,
          assignmentStatus: task.assignmentStatus,
          priority: task.priority,
          age: task.age,
          timeout: task.timeout,
          workflowSid: task.workflowSid,
          workflowFriendlyName: task.workflowFriendlyName,
          queueSid: task.queueSid,
          queueFriendlyName: task.queueFriendlyName,
          dateCreated: task.dateCreated,
          dateUpdated: task.dateUpdated
        }
      };
    } catch (error) {
      console.error('Error fetching task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update task attributes
   */
  async updateTask(taskSid: string, attributes: TaskAttributes): Promise<any> {
    try {
      const task = await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .tasks(taskSid)
        .update({
          attributes: JSON.stringify(attributes)
        });

      console.log(`Task ${task.sid} updated`);
      return {
        success: true,
        task: {
          sid: task.sid,
          attributes: task.attributes,
          assignmentStatus: task.assignmentStatus
        }
      };
    } catch (error) {
      console.error('Error updating task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel a task
   */
  async cancelTask(taskSid: string, reason?: string): Promise<any> {
    try {
      const task = await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .tasks(taskSid)
        .update({
          assignmentStatus: 'canceled',
          reason: reason
        });

      console.log(`Task ${task.sid} canceled`);
      return {
        success: true,
        task: {
          sid: task.sid,
          assignmentStatus: task.assignmentStatus,
          reason: task.reason
        }
      };
    } catch (error) {
      console.error('Error canceling task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get worker details
   */
  async getWorker(workerSid: string): Promise<any> {
    try {
      const worker = await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .workers(workerSid)
        .fetch();

      return {
        success: true,
        worker: {
          sid: worker.sid,
          friendlyName: worker.friendlyName,
          attributes: worker.attributes,
          activityName: worker.activityName,
          activitySid: worker.activitySid,
          available: worker.available,
          dateCreated: worker.dateCreated,
          dateUpdated: worker.dateUpdated
        }
      };
    } catch (error) {
      console.error('Error fetching worker:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update worker attributes
   */
  async updateWorker(workerSid: string, attributes: WorkerAttributes): Promise<any> {
    try {
      const worker = await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .workers(workerSid)
        .update({
          attributes: JSON.stringify(attributes)
        });

      console.log(`Worker ${worker.sid} updated`);
      return {
        success: true,
        worker: {
          sid: worker.sid,
          attributes: worker.attributes
        }
      };
    } catch (error) {
      console.error('Error updating worker:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update worker activity
   */
  async updateWorkerActivity(workerSid: string, activitySid: string): Promise<any> {
    try {
      const worker = await this.client.taskrouter.v1
        .workspaces(this.workspaceSid)
        .workers(workerSid)
        .update({
          activitySid: activitySid
        });

      console.log(`Worker ${worker.sid} activity updated to ${activitySid}`);
      return {
        success: true,
        worker: {
          sid: worker.sid,
          activityName: worker.activityName,
          activitySid: worker.activitySid
        }
      };
    } catch (error) {
      console.error('Error updating worker activity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Usage Examples
export const taskRouterExamples = {
  // Client-side worker setup
  async initializeWorker() {
    const token = 'your_worker_token_here';
    const workerManager = new TaskRouterWorkerManager(token, {
      edge: 'ashburn',
      logLevel: 'info'
    });

    // Setup event listeners
    workerManager.on('ready', (worker) => {
      console.log('Worker ready:', worker.sid);
    });

    workerManager.on('reservationCreated', (reservation) => {
      console.log('New reservation:', reservation.sid);
      
      // Auto-accept reservations for certain task types
      const taskAttributes = JSON.parse(reservation.task.attributes);
      if (taskAttributes.type === 'urgent') {
        workerManager.acceptReservation(reservation.sid);
      }
    });

    workerManager.on('error', (error) => {
      console.error('Worker error:', error);
    });

    // Initialize worker
    await workerManager.initialize();
    return workerManager;
  },

  // Server-side task creation
  async createTask() {
    const serverManager = new TaskRouterServerManager(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
      process.env.TWILIO_WORKSPACE_SID!
    );

    const result = await serverManager.createTask(
      {
        type: 'customer_support',
        priority: 10,
        customer_id: '12345',
        department: 'sales'
      },
      process.env.TWILIO_WORKFLOW_SID!,
      process.env.TWILIO_TASK_QUEUE_SID!,
      10,
      3600
    );

    if (result.success) {
      console.log('Task created:', result.task.sid);
    } else {
      console.error('Task creation failed:', result.error);
    }
  }
};

export default {
  TaskRouterWorkerManager,
  TaskRouterServerManager
};
