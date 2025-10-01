import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { taskRouterService } from '../../src/lib/twilio/taskrouter';
import { db } from '../../src/lib/db';
import { Prisma } from '@prisma/client';

// Skip tests if not in test environment or if Twilio credentials are not available
const shouldSkipTests = !process.env.TWILIO_ACCOUNT_SID || 
                       !process.env.TWILIO_AUTH_TOKEN || 
                       !process.env.TWILIO_WORKSPACE_SID ||
                       process.env.NODE_ENV !== 'test';

describe.skipIf(shouldSkipTests)('TaskRouter Integration Tests', () => {
  let testUserId: string;
  let testWorkerId: string;
  let testActivityId: string;
  let testQueueId: string;
  let testWorkflowId: string;
  let testTaskId: string;
  let testReservationId: string;

  beforeAll(async () => {
    // Create a test user
    const testUser = await db.user.create({
      data: {
        email: 'test-worker@example.com',
        name: 'Test Worker',
        role: 'user',
        department: 'test',
      }
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testReservationId) {
      try {
        await db.reservation.delete({ where: { id: testReservationId } });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (testTaskId) {
      try {
        await db.task.delete({ where: { id: testTaskId } });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (testWorkerId) {
      try {
        await taskRouterService.deleteWorker(testWorkerId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (testActivityId) {
      try {
        await taskRouterService.deleteActivity(testActivityId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (testQueueId) {
      try {
        await taskRouterService.deleteTaskQueue(testQueueId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (testWorkflowId) {
      try {
        await taskRouterService.deleteWorkflow(testWorkflowId);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (testUserId) {
      try {
        await db.user.delete({ where: { id: testUserId } });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('Activity Management', () => {
    it('should create, read, update, and delete activities', async () => {
      // Create activity
      const activity = await taskRouterService.createActivity({
        friendlyName: 'Test Activity',
        available: true,
      });
      testActivityId = activity.id;
      
      expect(activity).toBeDefined();
      expect(activity.friendlyName).toBe('Test Activity');
      expect(activity.available).toBe(true);
      expect(activity.twilioActivitySid).toBeDefined();

      // Get activity
      const retrievedActivity = await db.activity.findUnique({
        where: { id: activity.id }
      });
      expect(retrievedActivity).toBeDefined();
      expect(retrievedActivity?.friendlyName).toBe('Test Activity');

      // Update activity
      const updatedActivity = await taskRouterService.updateActivity(activity.id, {
        friendlyName: 'Updated Test Activity',
      });
      expect(updatedActivity.friendlyName).toBe('Updated Test Activity');

      // Get all activities
      const activities = await taskRouterService.getActivities();
      expect(activities).toBeInstanceOf(Array);
      expect(activities.length).toBeGreaterThan(0);
    });

    it('should delete activity', async () => {
      if (!testActivityId) return;
      
      const result = await taskRouterService.deleteActivity(testActivityId);
      expect(result.success).toBe(true);
      testActivityId = '';
    });
  });

  describe('Task Queue Management', () => {
    it('should create, read, update, and delete task queues', async () => {
      // Create task queue
      const queue = await taskRouterService.createTaskQueue({
        friendlyName: 'Test Queue',
        targetWorkers: '1==1',
        maxReservedWorkers: 1,
        taskOrder: 'FIFO',
      });
      testQueueId = queue.id;
      
      expect(queue).toBeDefined();
      expect(queue.friendlyName).toBe('Test Queue');
      expect(queue.targetWorkers).toBe('1==1');
      expect(queue.maxReservedWorkers).toBe(1);
      expect(queue.taskOrder).toBe('FIFO');
      expect(queue.twilioTaskQueueSid).toBeDefined();

      // Get queue
      const retrievedQueue = await db.taskQueue.findUnique({
        where: { id: queue.id }
      });
      expect(retrievedQueue).toBeDefined();
      expect(retrievedQueue?.friendlyName).toBe('Test Queue');

      // Update queue
      const updatedQueue = await taskRouterService.updateTaskQueue(queue.id, {
        friendlyName: 'Updated Test Queue',
        maxReservedWorkers: 2,
      });
      expect(updatedQueue.friendlyName).toBe('Updated Test Queue');
      expect(updatedQueue.maxReservedWorkers).toBe(2);

      // Get all queues
      const queues = await taskRouterService.getTaskQueues();
      expect(queues).toBeInstanceOf(Array);
      expect(queues.length).toBeGreaterThan(0);
    });

    it('should delete task queue', async () => {
      if (!testQueueId) return;
      
      const result = await taskRouterService.deleteTaskQueue(testQueueId);
      expect(result.success).toBe(true);
      testQueueId = '';
    });
  });

  describe('Workflow Management', () => {
    it('should create, read, update, and delete workflows', async () => {
      // Create workflow
      const workflow = await taskRouterService.createWorkflow({
        friendlyName: 'Test Workflow',
        configuration: {
          task_routing: {
            filters: [],
            default_filter: {
              queue: 'default'
            }
          }
        },
        taskTimeout: 300,
      });
      testWorkflowId = workflow.id;
      
      expect(workflow).toBeDefined();
      expect(workflow.friendlyName).toBe('Test Workflow');
      expect(workflow.taskTimeout).toBe(300);
      expect(workflow.twilioWorkflowSid).toBeDefined();

      // Get workflow
      const retrievedWorkflow = await db.workflow.findUnique({
        where: { id: workflow.id }
      });
      expect(retrievedWorkflow).toBeDefined();
      expect(retrievedWorkflow?.friendlyName).toBe('Test Workflow');

      // Update workflow
      const updatedWorkflow = await taskRouterService.updateWorkflow(workflow.id, {
        friendlyName: 'Updated Test Workflow',
        taskTimeout: 600,
      });
      expect(updatedWorkflow.friendlyName).toBe('Updated Test Workflow');
      expect(updatedWorkflow.taskTimeout).toBe(600);

      // Get all workflows
      const workflows = await taskRouterService.getWorkflows();
      expect(workflows).toBeInstanceOf(Array);
      expect(workflows.length).toBeGreaterThan(0);
    });

    it('should delete workflow', async () => {
      if (!testWorkflowId) return;
      
      const result = await taskRouterService.deleteWorkflow(testWorkflowId);
      expect(result.success).toBe(true);
      testWorkflowId = '';
    });
  });

  describe('Worker Management', () => {
    it('should create, read, update, and delete workers', async () => {
      // First create an activity for the worker
      const activity = await taskRouterService.createActivity({
        friendlyName: 'Test Worker Activity',
        available: true,
      });

      // Create worker
      const worker = await taskRouterService.createWorker({
        friendlyName: 'Test Worker',
        attributes: {
          skills: ['test'],
          department: 'test',
        },
        activitySid: activity.twilioActivitySid,
      }, testUserId);
      testWorkerId = worker.id;
      
      expect(worker).toBeDefined();
      expect(worker.friendlyName).toBe('Test Worker');
      expect(worker.userId).toBe(testUserId);
      expect(worker.activitySid).toBe(activity.twilioActivitySid);
      expect(worker.twilioWorkerSid).toBeDefined();
      expect(worker.User).toBeDefined();
      expect(worker.activity).toBeDefined();

      // Get worker
      const retrievedWorker = await taskRouterService.getWorker(worker.id);
      expect(retrievedWorker).toBeDefined();
      expect(retrievedWorker.friendlyName).toBe('Test Worker');
      expect(retrievedWorker.User).toBeDefined();
      expect(retrievedWorker.activity).toBeDefined();

      // Get worker by Twilio SID
      const workerBySid = await taskRouterService.getWorkerByTwilioSid(worker.twilioWorkerSid);
      expect(workerBySid).toBeDefined();
      expect(workerBySid.friendlyName).toBe('Test Worker');

      // Update worker
      const updatedWorker = await taskRouterService.updateWorker(worker.id, {
        friendlyName: 'Updated Test Worker',
        attributes: {
          skills: ['test', 'updated'],
          department: 'test',
        },
      });
      expect(updatedWorker.friendlyName).toBe('Updated Test Worker');

      // Get all workers
      const workers = await taskRouterService.getWorkers();
      expect(workers).toBeInstanceOf(Array);
      expect(workers.length).toBeGreaterThan(0);

      // Test worker filtering
      const testWorkers = await taskRouterService.getWorkers({
        department: 'test',
        available: true,
      });
      expect(testWorkers).toBeInstanceOf(Array);

      // Clean up activity
      await taskRouterService.deleteActivity(activity.id);
    });

    it('should delete worker', async () => {
      if (!testWorkerId) return;
      
      const result = await taskRouterService.deleteWorker(testWorkerId);
      expect(result.success).toBe(true);
      testWorkerId = '';
    });
  });

  describe('Task Management', () => {
    it('should create, read, update, and cancel tasks', async () => {
      // First create required resources
      const activity = await taskRouterService.createActivity({
        friendlyName: 'Test Task Activity',
        available: true,
      });

      const queue = await taskRouterService.createTaskQueue({
        friendlyName: 'Test Task Queue',
        targetWorkers: '1==1',
        maxReservedWorkers: 1,
        taskOrder: 'FIFO',
      });

      const workflow = await taskRouterService.createWorkflow({
        friendlyName: 'Test Task Workflow',
        configuration: {
          task_routing: {
            filters: [],
            default_filter: {
              queue: queue.twilioTaskQueueSid
            }
          }
        },
        taskTimeout: 300,
      });

      const worker = await taskRouterService.createWorker({
        friendlyName: 'Test Task Worker',
        attributes: {
          skills: ['test'],
          department: 'test',
        },
        activitySid: activity.twilioActivitySid,
      }, testUserId);

      // Create task
      const task = await taskRouterService.createTask({
        taskQueueSid: queue.twilioTaskQueueSid,
        workflowSid: workflow.twilioWorkflowSid,
        attributes: {
          type: 'test',
          priority: 'normal',
        },
        priority: 50,
        timeout: 3600,
        taskChannel: 'default',
      });
      testTaskId = task.id;
      
      expect(task).toBeDefined();
      expect(task.taskQueueSid).toBe(queue.twilioTaskQueueSid);
      expect(task.workflowSid).toBe(workflow.twilioWorkflowSid);
      expect(task.priority).toBe(50);
      expect(task.twilioTaskSid).toBeDefined();
      expect(task.taskQueue).toBeDefined();

      // Get task
      const retrievedTask = await taskRouterService.getTask(task.id);
      expect(retrievedTask).toBeDefined();
      expect(retrievedTask.taskQueueSid).toBe(queue.twilioTaskQueueSid);

      // Update task
      const updatedTask = await taskRouterService.updateTask(task.id, {
        priority: 75,
        attributes: {
          type: 'test',
          priority: 'high',
        },
      });
      expect(updatedTask.priority).toBe(75);

      // Get all tasks
      const tasks = await taskRouterService.getTasks();
      expect(tasks).toBeInstanceOf(Array);
      expect(tasks.length).toBeGreaterThan(0);

      // Test task filtering
      const testTasks = await taskRouterService.getTasks({
        status: 'PENDING',
        priority: '75',
      });
      expect(testTasks).toBeInstanceOf(Array);

      // Cancel task
      const canceledTask = await taskRouterService.cancelTask(task.id, 'Test cancellation');
      expect(canceledTask.assignmentStatus).toBe('CANCELED');

      // Clean up resources
      await taskRouterService.deleteWorker(worker.id);
      await taskRouterService.deleteWorkflow(workflow.id);
      await taskRouterService.deleteTaskQueue(queue.id);
      await taskRouterService.deleteActivity(activity.id);
    });
  });

  describe('Statistics', () => {
    it('should get TaskRouter statistics', async () => {
      const stats = await taskRouterService.getTaskRouterStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.activeWorkers).toBe('number');
      expect(typeof stats.availableWorkers).toBe('number');
      expect(typeof stats.busyWorkers).toBe('number');
      expect(typeof stats.offlineWorkers).toBe('number');
      expect(typeof stats.pendingTasks).toBe('number');
      expect(typeof stats.assignedTasks).toBe('number');
      expect(typeof stats.completedTasks).toBe('number');
      expect(typeof stats.averageWaitTime).toBe('number');
      expect(typeof stats.averageHandleTime).toBe('number');
    });

    it('should get worker statistics', async () => {
      // Create a test worker first
      const activity = await taskRouterService.createActivity({
        friendlyName: 'Test Stats Activity',
        available: true,
      });

      const worker = await taskRouterService.createWorker({
        friendlyName: 'Test Stats Worker',
        attributes: {
          skills: ['test'],
          department: 'test',
        },
        activitySid: activity.twilioActivitySid,
      }, testUserId);

      const stats = await taskRouterService.getWorkerStats(worker.id);
      
      expect(stats).toBeDefined();
      expect(stats.workerSid).toBe(worker.twilioWorkerSid);
      expect(typeof stats.tasksCompleted).toBe('number');
      expect(typeof stats.tasksAccepted).toBe('number');
      expect(typeof stats.tasksRejected).toBe('number');
      expect(typeof stats.averageHandleTime).toBe('number');
      expect(typeof stats.totalTalkTime).toBe('number');
      expect(typeof stats.totalIdleTime).toBe('number');
      expect(stats.lastActivityChange).toBeInstanceOf(Date);

      // Clean up
      await taskRouterService.deleteWorker(worker.id);
      await taskRouterService.deleteActivity(activity.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid worker ID gracefully', async () => {
      await expect(taskRouterService.getWorker('invalid-id')).rejects.toThrow('Worker not found');
    });

    it('should handle invalid task ID gracefully', async () => {
      await expect(taskRouterService.getTask('invalid-id')).rejects.toThrow('Task not found');
    });

    it('should handle invalid activity ID gracefully', async () => {
      await expect(taskRouterService.updateActivity('invalid-id', {})).rejects.toThrow('Activity not found');
    });

    it('should handle invalid queue ID gracefully', async () => {
      await expect(taskRouterService.updateTaskQueue('invalid-id', {})).rejects.toThrow('Task queue not found');
    });

    it('should handle invalid workflow ID gracefully', async () => {
      await expect(taskRouterService.updateWorkflow('invalid-id', {})).rejects.toThrow('Workflow not found');
    });
  });
});

