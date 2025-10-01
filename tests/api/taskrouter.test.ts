import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock Twilio TaskRouter API
const mockTaskRouterAPI = {
  workers: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  taskQueues: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  workflows: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  tasks: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
};

// Mock the TaskRouter service
vi.mock('@/lib/taskrouter', () => ({
  TaskRouterService: vi.fn().mockImplementation(() => mockTaskRouterAPI)
}));

describe('TaskRouter API Integration', () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('Worker Management', () => {
    it('should list all workers', async () => {
      const mockWorkers = [
        {
          sid: 'WK_test_worker_1',
          friendlyName: 'QA Agent',
          attributes: {
            skills: ['voice', 'sms', 'support'],
            level: 'agent',
            available: true
          }
        }
      ];

      mockTaskRouterAPI.workers.list.mockResolvedValue(mockWorkers);

      const response = await fetch('/api/taskrouter/workers');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject(mockWorkers[0]);
      expect(mockTaskRouterAPI.workers.list).toHaveBeenCalled();
    });

    it('should create new worker', async () => {
      const workerData = {
        friendlyName: 'New Agent',
        attributes: {
          skills: ['voice', 'sms'],
          level: 'agent',
          available: true
        }
      };

      const mockWorker = {
        sid: 'WK_new_worker',
        ...workerData
      };

      mockTaskRouterAPI.workers.create.mockResolvedValue(mockWorker);

      const response = await fetch('/api/taskrouter/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workerData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject(mockWorker);
      expect(mockTaskRouterAPI.workers.create).toHaveBeenCalledWith(workerData);
    });

    it('should update worker activity', async () => {
      const workerId = 'WK_test_worker_1';
      const activityData = { activitySid: 'WA_available' };

      mockTaskRouterAPI.workers.update.mockResolvedValue({
        sid: workerId,
        activitySid: 'WA_available'
      });

      const response = await fetch(`/api/taskrouter/workers/${workerId}/activity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.activitySid).toBe('WA_available');
      expect(mockTaskRouterAPI.workers.update).toHaveBeenCalledWith(workerId, activityData);
    });

    it('should generate worker token', async () => {
      const workerId = 'WK_test_worker_1';
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

      const response = await fetch(`/api/taskrouter/workers/${workerId}/token`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
    });
  });

  describe('Task Queue Management', () => {
    it('should list all task queues', async () => {
      const mockQueues = [
        {
          sid: 'WQ_test_queue_1',
          friendlyName: 'Support Queue',
          targetWorkers: 'skills HAS "support"',
          maxReservedWorkers: 5
        }
      ];

      mockTaskRouterAPI.taskQueues.list.mockResolvedValue(mockQueues);

      const response = await fetch('/api/taskrouter/task-queues');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject(mockQueues[0]);
      expect(mockTaskRouterAPI.taskQueues.list).toHaveBeenCalled();
    });

    it('should create new task queue', async () => {
      const queueData = {
        friendlyName: 'Sales Queue',
        targetWorkers: 'skills HAS "sales"',
        maxReservedWorkers: 3
      };

      const mockQueue = {
        sid: 'WQ_new_queue',
        ...queueData
      };

      mockTaskRouterAPI.taskQueues.create.mockResolvedValue(mockQueue);

      const response = await fetch('/api/taskrouter/task-queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queueData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject(mockQueue);
      expect(mockTaskRouterAPI.taskQueues.create).toHaveBeenCalledWith(queueData);
    });
  });

  describe('Workflow Management', () => {
    it('should list all workflows', async () => {
      const mockWorkflows = [
        {
          sid: 'WW_test_workflow_1',
          friendlyName: 'Customer Support Workflow',
          configuration: {
            taskRouting: {
              filters: [
                {
                  expression: 'type == "support"',
                  targets: [
                    {
                      queue: 'WQ_test_queue_1',
                      priority: 10
                    }
                  ]
                }
              ]
            }
          }
        }
      ];

      mockTaskRouterAPI.workflows.list.mockResolvedValue(mockWorkflows);

      const response = await fetch('/api/taskrouter/workflows');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject(mockWorkflows[0]);
      expect(mockTaskRouterAPI.workflows.list).toHaveBeenCalled();
    });

    it('should create new workflow', async () => {
      const workflowData = {
        friendlyName: 'VIP Customer Workflow',
        configuration: {
          taskRouting: {
            filters: [
              {
                expression: 'customer.type == "vip"',
                targets: [
                  {
                    queue: 'WQ_vip_queue',
                    priority: 20
                  }
                ]
              }
            ]
          }
        }
      };

      const mockWorkflow = {
        sid: 'WW_new_workflow',
        ...workflowData
      };

      mockTaskRouterAPI.workflows.create.mockResolvedValue(mockWorkflow);

      const response = await fetch('/api/taskrouter/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject(mockWorkflow);
      expect(mockTaskRouterAPI.workflows.create).toHaveBeenCalledWith(workflowData);
    });
  });

  describe('Task Management', () => {
    it('should list all tasks', async () => {
      const mockTasks = [
        {
          sid: 'WT_test_task_1',
          attributes: {
            type: 'support',
            customer: 'Test Customer 1',
            priority: 'normal'
          },
          status: 'pending',
          assignmentStatus: 'pending'
        }
      ];

      mockTaskRouterAPI.tasks.list.mockResolvedValue(mockTasks);

      const response = await fetch('/api/taskrouter/tasks');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject(mockTasks[0]);
      expect(mockTaskRouterAPI.tasks.list).toHaveBeenCalled();
    });

    it('should create new task', async () => {
      const taskData = {
        attributes: {
          type: 'support',
          customer: 'Test Customer 2',
          priority: 'high'
        }
      };

      const mockTask = {
        sid: 'WT_new_task',
        ...taskData,
        status: 'pending',
        assignmentStatus: 'pending'
      };

      mockTaskRouterAPI.tasks.create.mockResolvedValue(mockTask);

      const response = await fetch('/api/taskrouter/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject(mockTask);
      expect(mockTaskRouterAPI.tasks.create).toHaveBeenCalledWith(taskData);
    });

    it('should accept task', async () => {
      const taskId = 'WT_test_task_1';
      const workerId = 'WK_test_worker_1';

      mockTaskRouterAPI.tasks.update.mockResolvedValue({
        sid: taskId,
        assignmentStatus: 'accepted',
        assignedTo: workerId
      });

      const response = await fetch(`/api/taskrouter/tasks/${taskId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId })
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assignmentStatus).toBe('accepted');
      expect(data.assignedTo).toBe(workerId);
    });

    it('should complete task', async () => {
      const taskId = 'WT_test_task_1';
      const completionData = {
        result: 'Task completed successfully',
        notes: 'Customer issue resolved'
      };

      mockTaskRouterAPI.tasks.update.mockResolvedValue({
        sid: taskId,
        status: 'completed',
        ...completionData
      });

      const response = await fetch(`/api/taskrouter/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionData)
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('completed');
      expect(data.result).toBe(completionData.result);
    });

    it('should reject task', async () => {
      const taskId = 'WT_test_task_1';
      const rejectionData = {
        reason: 'Not qualified for this task type'
      };

      mockTaskRouterAPI.tasks.update.mockResolvedValue({
        sid: taskId,
        assignmentStatus: 'rejected',
        ...rejectionData
      });

      const response = await fetch(`/api/taskrouter/tasks/${taskId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rejectionData)
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assignmentStatus).toBe('rejected');
      expect(data.reason).toBe(rejectionData.reason);
    });
  });

  describe('Activity Management', () => {
    it('should list all activities', async () => {
      const mockActivities = [
        {
          sid: 'WA_available',
          friendlyName: 'Available',
          available: true
        },
        {
          sid: 'WA_busy',
          friendlyName: 'Busy',
          available: false
        }
      ];

      const response = await fetch('/api/taskrouter/activities');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0]).toMatchObject(mockActivities[0]);
    });
  });

  describe('Routing Rules', () => {
    it('should list routing rules', async () => {
      const mockRules = [
        {
          id: 'rule_1',
          name: 'VIP Customer Routing',
          condition: 'customer.type == "vip"',
          action: 'route_to_supervisor',
          priority: 1
        }
      ];

      const response = await fetch('/api/taskrouter/routing-rules');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject(mockRules[0]);
    });

    it('should create routing rule', async () => {
      const ruleData = {
        name: 'Emergency Routing',
        condition: 'priority == "emergency"',
        action: 'route_to_emergency_queue',
        priority: 1
      };

      const mockRule = {
        id: 'rule_2',
        ...ruleData
      };

      const response = await fetch('/api/taskrouter/routing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject(mockRule);
    });

    it('should test routing rule', async () => {
      const ruleId = 'rule_1';
      const testData = {
        customer: { type: 'vip' },
        priority: 'normal'
      };

      const mockResult = {
        matched: true,
        action: 'route_to_supervisor',
        queue: 'WQ_supervisor_queue'
      };

      const response = await fetch(`/api/taskrouter/routing-rules/${ruleId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject(mockResult);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockTaskRouterAPI.workers.list.mockRejectedValue(new Error('TaskRouter API Error'));

      const response = await fetch('/api/taskrouter/workers');
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to fetch workers');
    });

    it('should handle authentication errors', async () => {
      mockTaskRouterAPI.workers.list.mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      });

      const response = await fetch('/api/taskrouter/workers');
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });

    it('should handle rate limiting', async () => {
      mockTaskRouterAPI.workers.list.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded'
      });

      const response = await fetch('/api/taskrouter/workers');
      
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toContain('Rate limit exceeded');
    });
  });
});
