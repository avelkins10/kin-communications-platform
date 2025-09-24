# Phase 7: TaskRouter Integration Guide

This guide provides comprehensive instructions for implementing TaskRouter functionality in the KIN Communications Platform, enabling intelligent task routing and workforce management.

## Overview

Phase 7 focuses on implementing TaskRouter capabilities including:
- Worker management and status tracking
- Task creation and intelligent routing
- Real-time event handling and updates
- Activity management and availability
- Integration with existing voice calling system

## Prerequisites

- Twilio Account with TaskRouter enabled
- Completed Phase 3 (Voice Calling) implementation
- Node.js 16+ and npm
- WebSocket support for real-time events
- Database for storing task and worker data

## Required Environment Variables

```bash
# Twilio Account Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# TaskRouter Configuration
TWILIO_WORKSPACE_SID=WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WORKFLOW_SID=WWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TASK_QUEUE_SID=WQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Activity SIDs
TWILIO_ACTIVITY_AVAILABLE_SID=WAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACTIVITY_BUSY_SID=WAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACTIVITY_OFFLINE_SID=WAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_ACTIVITY_WRAPUP_SID=WAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Keys for Access Tokens
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_key_secret_here

# Webhook URLs
TWILIO_WEBHOOK_BASE_URL=https://your-domain.com
TWILIO_TASKROUTER_WEBHOOK_URL=https://your-domain.com/taskrouter
```

## Installation

### Server-side Dependencies
```bash
npm install twilio express body-parser cors dotenv ws
npm install --save-dev @types/express @types/node @types/ws typescript
```

### Client-side Dependencies
```bash
npm install twilio-taskrouter ws
```

## TaskRouter Workspace Setup

### 1. Create Workspace and Activities

```typescript
// scripts/setupTaskRouter.ts
import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function setupTaskRouter() {
  try {
    // Create workspace
    const workspace = await client.taskrouter.v1.workspaces.create({
      friendlyName: 'KIN Communications Workspace',
      eventCallbackUrl: `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/taskrouter`,
      multiTaskEnabled: true
    });

    console.log('Workspace created:', workspace.sid);

    // Create activities
    const activities = await Promise.all([
      client.taskrouter.v1.workspaces(workspace.sid).activities.create({
        friendlyName: 'Available',
        available: true
      }),
      client.taskrouter.v1.workspaces(workspace.sid).activities.create({
        friendlyName: 'Busy',
        available: false
      }),
      client.taskrouter.v1.workspaces(workspace.sid).activities.create({
        friendlyName: 'Offline',
        available: false
      }),
      client.taskrouter.v1.workspaces(workspace.sid).activities.create({
        friendlyName: 'Wrap-up',
        available: false
      })
    ]);

    console.log('Activities created:', activities.map(a => ({ name: a.friendlyName, sid: a.sid })));

    // Create task queue
    const taskQueue = await client.taskrouter.v1.workspaces(workspace.sid).taskQueues.create({
      friendlyName: 'General Queue',
      targetWorkers: '1==1' // All workers
    });

    console.log('Task queue created:', taskQueue.sid);

    // Create workflow
    const workflow = await client.taskrouter.v1.workspaces(workspace.sid).workflows.create({
      friendlyName: 'Default Workflow',
      configuration: JSON.stringify({
        task_routing: {
          filters: [
            {
              expression: '1==1',
              targets: [
                {
                  queue: taskQueue.sid,
                  priority: 1,
                  timeout: 30
                }
              ]
            }
          ]
        }
      })
    });

    console.log('Workflow created:', workflow.sid);

    // Output configuration
    console.log('\n=== TaskRouter Configuration ===');
    console.log(`Workspace SID: ${workspace.sid}`);
    console.log(`Available Activity SID: ${activities[0].sid}`);
    console.log(`Busy Activity SID: ${activities[1].sid}`);
    console.log(`Offline Activity SID: ${activities[2].sid}`);
    console.log(`Wrap-up Activity SID: ${activities[3].sid}`);
    console.log(`Task Queue SID: ${taskQueue.sid}`);
    console.log(`Workflow SID: ${workflow.sid}`);

  } catch (error) {
    console.error('Error setting up TaskRouter:', error);
  }
}

setupTaskRouter();
```

## Server-side Implementation

### 1. TaskRouter Service

Create `src/services/taskRouterService.ts`:

```typescript
import { TaskRouterServerManager } from '../templates/taskrouter-worker';

export class TaskRouterService {
  private serverManager: TaskRouterServerManager;

  constructor() {
    this.serverManager = new TaskRouterServerManager(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
      process.env.TWILIO_WORKSPACE_SID!
    );
  }

  /**
   * Create a new task
   */
  async createTask(attributes: any, priority: number = 0, timeout: number = 3600) {
    return await this.serverManager.createTask(
      attributes,
      process.env.TWILIO_WORKFLOW_SID!,
      process.env.TWILIO_TASK_QUEUE_SID!,
      priority,
      timeout
    );
  }

  /**
   * Create a voice call task
   */
  async createVoiceCallTask(callSid: string, customerPhone: string, agentId: string) {
    const attributes = {
      type: 'voice_call',
      callSid: callSid,
      customerPhone: customerPhone,
      agentId: agentId,
      priority: 'high',
      skills: ['voice', 'customer_service'],
      department: 'support'
    };

    return await this.createTask(attributes, 10, 1800); // 30 minute timeout
  }

  /**
   * Create a callback task
   */
  async createCallbackTask(customerPhone: string, preferredTime: string, reason: string) {
    const attributes = {
      type: 'callback',
      customerPhone: customerPhone,
      preferredTime: preferredTime,
      reason: reason,
      priority: 'medium',
      skills: ['callback', 'customer_service']
    };

    return await this.createTask(attributes, 5, 86400); // 24 hour timeout
  }

  /**
   * Get task details
   */
  async getTask(taskSid: string) {
    return await this.serverManager.getTask(taskSid);
  }

  /**
   * Update task attributes
   */
  async updateTask(taskSid: string, attributes: any) {
    return await this.serverManager.updateTask(taskSid, attributes);
  }

  /**
   * Cancel task
   */
  async cancelTask(taskSid: string, reason?: string) {
    return await this.serverManager.cancelTask(taskSid, reason);
  }

  /**
   * Get worker details
   */
  async getWorker(workerSid: string) {
    return await this.serverManager.getWorker(workerSid);
  }

  /**
   * Update worker attributes
   */
  async updateWorker(workerSid: string, attributes: any) {
    return await this.serverManager.updateWorker(workerSid, attributes);
  }

  /**
   * Update worker activity
   */
  async updateWorkerActivity(workerSid: string, activitySid: string) {
    return await this.serverManager.updateWorkerActivity(workerSid, activitySid);
  }

  /**
   * Generate worker access token
   */
  generateWorkerToken(workerSid: string, identity: string, ttl: number = 3600) {
    const AccessToken = require('twilio').jwt.AccessToken;
    const TaskRouterGrant = AccessToken.TaskRouterGrant;

    const taskRouterGrant = new TaskRouterGrant({
      workerSid: workerSid,
      workspaceSid: process.env.TWILIO_WORKSPACE_SID!,
      role: 'worker'
    });

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY_SID!,
      process.env.TWILIO_API_KEY_SECRET!,
      { identity, ttl }
    );

    token.addGrant(taskRouterGrant);
    return token.toJwt();
  }
}
```

### 2. API Routes

Create `src/routes/taskRouter.ts`:

```typescript
import express from 'express';
import { TaskRouterService } from '../services/taskRouterService';
import { TaskRouterWebhookHandler } from '../templates/webhook-handlers';

const router = express.Router();
const taskRouterService = new TaskRouterService();

// Generate worker access token
router.post('/worker/token', async (req, res) => {
  try {
    const { workerSid, identity } = req.body;
    
    if (!workerSid || !identity) {
      return res.status(400).json({ success: false, error: 'WorkerSid and identity are required' });
    }

    const token = taskRouterService.generateWorkerToken(workerSid, identity);
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error generating worker token:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create task
router.post('/tasks', async (req, res) => {
  try {
    const { attributes, priority, timeout } = req.body;
    
    if (!attributes) {
      return res.status(400).json({ success: false, error: 'Attributes are required' });
    }

    const result = await taskRouterService.createTask(attributes, priority, timeout);
    res.json(result);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create voice call task
router.post('/tasks/voice-call', async (req, res) => {
  try {
    const { callSid, customerPhone, agentId } = req.body;
    
    if (!callSid || !customerPhone || !agentId) {
      return res.status(400).json({ success: false, error: 'CallSid, customerPhone, and agentId are required' });
    }

    const result = await taskRouterService.createVoiceCallTask(callSid, customerPhone, agentId);
    res.json(result);
  } catch (error) {
    console.error('Error creating voice call task:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create callback task
router.post('/tasks/callback', async (req, res) => {
  try {
    const { customerPhone, preferredTime, reason } = req.body;
    
    if (!customerPhone || !preferredTime || !reason) {
      return res.status(400).json({ success: false, error: 'CustomerPhone, preferredTime, and reason are required' });
    }

    const result = await taskRouterService.createCallbackTask(customerPhone, preferredTime, reason);
    res.json(result);
  } catch (error) {
    console.error('Error creating callback task:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get task details
router.get('/tasks/:taskSid', async (req, res) => {
  try {
    const { taskSid } = req.params;
    const result = await taskRouterService.getTask(taskSid);
    res.json(result);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update task
router.put('/tasks/:taskSid', async (req, res) => {
  try {
    const { taskSid } = req.params;
    const { attributes } = req.body;
    
    const result = await taskRouterService.updateTask(taskSid, attributes);
    res.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Cancel task
router.post('/tasks/:taskSid/cancel', async (req, res) => {
  try {
    const { taskSid } = req.params;
    const { reason } = req.body;
    
    const result = await taskRouterService.cancelTask(taskSid, reason);
    res.json(result);
  } catch (error) {
    console.error('Error canceling task:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get worker details
router.get('/workers/:workerSid', async (req, res) => {
  try {
    const { workerSid } = req.params;
    const result = await taskRouterService.getWorker(workerSid);
    res.json(result);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update worker
router.put('/workers/:workerSid', async (req, res) => {
  try {
    const { workerSid } = req.params;
    const { attributes } = req.body;
    
    const result = await taskRouterService.updateWorker(workerSid, attributes);
    res.json(result);
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update worker activity
router.post('/workers/:workerSid/activity', async (req, res) => {
  try {
    const { workerSid } = req.params;
    const { activitySid } = req.body;
    
    if (!activitySid) {
      return res.status(400).json({ success: false, error: 'ActivitySid is required' });
    }

    const result = await taskRouterService.updateWorkerActivity(workerSid, activitySid);
    res.json(result);
  } catch (error) {
    console.error('Error updating worker activity:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Webhook endpoint
router.post('/webhooks', async (req, res) => {
  const handler = new TaskRouterWebhookHandler();
  const result = await handler.handle(req, res);
  res.status(result.status).send(result.body);
});

export default router;
```

## Client-side Implementation

### 1. TaskRouter Worker Component

Create `src/components/TaskRouterWorker.tsx`:

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { TaskRouterWorkerManager } from '../templates/taskrouter-worker';

interface TaskRouterWorkerProps {
  workerSid: string;
  identity: string;
  onTaskReceived?: (task: any) => void;
  onStatusChange?: (status: string) => void;
}

export const TaskRouterWorker: React.FC<TaskRouterWorkerProps> = ({
  workerSid,
  identity,
  onTaskReceived,
  onStatusChange
}) => {
  const [workerManager, setWorkerManager] = useState<TaskRouterWorkerManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<string>('offline');
  const [activeTasks, setActiveTasks] = useState<any[]>([]);

  useEffect(() => {
    initializeWorker();
    
    return () => {
      if (workerManager) {
        workerManager.disconnect();
      }
    };
  }, [workerSid, identity]);

  const initializeWorker = async () => {
    try {
      // Get worker token from server
      const response = await fetch('/api/taskrouter/worker/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workerSid, identity })
      });

      const data = await response.json();
      
      if (data.success) {
        const manager = new TaskRouterWorkerManager(data.token, {
          edge: 'ashburn',
          logLevel: 'info'
        });

        // Setup event listeners
        manager.on('ready', (worker) => {
          setIsReady(true);
          setCurrentActivity(worker.activityName);
          onStatusChange?.('ready');
        });

        manager.on('error', (error) => {
          console.error('Worker error:', error);
          onStatusChange?.('error');
        });

        manager.on('disconnected', () => {
          setIsReady(false);
          onStatusChange?.('disconnected');
        });

        manager.on('activityUpdated', (activity) => {
          setCurrentActivity(activity.activityName);
          onStatusChange?.(activity.activityName);
        });

        manager.on('reservationCreated', (reservation) => {
          console.log('New task received:', reservation.task);
          onTaskReceived?.(reservation.task);
        });

        manager.on('reservationAccepted', (reservation) => {
          setActiveTasks(prev => [...prev, reservation.task]);
        });

        manager.on('reservationCompleted', (reservation) => {
          setActiveTasks(prev => prev.filter(task => task.sid !== reservation.task.sid));
        });

        // Initialize worker
        await manager.initialize();
        setWorkerManager(manager);
      }
    } catch (error) {
      console.error('Error initializing TaskRouter worker:', error);
    }
  };

  const updateActivity = async (activitySid: string) => {
    if (workerManager) {
      await workerManager.updateActivity(activitySid);
    }
  };

  const acceptTask = async (reservationSid: string) => {
    if (workerManager) {
      await workerManager.acceptReservation(reservationSid);
    }
  };

  const rejectTask = async (reservationSid: string, reason?: string) => {
    if (workerManager) {
      await workerManager.rejectReservation(reservationSid, reason);
    }
  };

  const completeTask = async (reservationSid: string, attributes?: any) => {
    if (workerManager) {
      await workerManager.completeReservation(reservationSid, attributes);
    }
  };

  const wrapupTask = async (reservationSid: string, attributes?: any) => {
    if (workerManager) {
      await workerManager.wrapupReservation(reservationSid, attributes);
    }
  };

  return {
    isReady,
    currentActivity,
    activeTasks,
    updateActivity,
    acceptTask,
    rejectTask,
    completeTask,
    wrapupTask,
    getWorkerStatus: () => workerManager?.getWorkerStatus(),
    getActiveReservations: () => workerManager?.getActiveReservations()
  };
};
```

### 2. Task Management Interface

Create `src/components/TaskManagement.tsx`:

```typescript
import React, { useState } from 'react';
import { TaskRouterWorker } from './TaskRouterWorker';

interface TaskManagementProps {
  workerSid: string;
  identity: string;
}

export const TaskManagement: React.FC<TaskManagementProps> = ({ workerSid, identity }) => {
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [workerStatus, setWorkerStatus] = useState('offline');

  const {
    isReady,
    currentActivity,
    activeTasks,
    updateActivity,
    acceptTask,
    rejectTask,
    completeTask,
    wrapupTask
  } = TaskRouterWorker({
    workerSid,
    identity,
    onTaskReceived: (task) => {
      setCurrentTask(task);
    },
    onStatusChange: (status) => {
      setWorkerStatus(status);
    }
  });

  const handleActivityChange = async (activity: string) => {
    const activityMap: { [key: string]: string } = {
      'available': process.env.TWILIO_ACTIVITY_AVAILABLE_SID!,
      'busy': process.env.TWILIO_ACTIVITY_BUSY_SID!,
      'offline': process.env.TWILIO_ACTIVITY_OFFLINE_SID!,
      'wrapup': process.env.TWILIO_ACTIVITY_WRAPUP_SID!
    };

    await updateActivity(activityMap[activity]);
  };

  const handleAcceptTask = async () => {
    if (currentTask) {
      await acceptTask(currentTask.reservationSid);
      setCurrentTask(null);
    }
  };

  const handleRejectTask = async () => {
    if (currentTask) {
      await rejectTask(currentTask.reservationSid, 'Not available');
      setCurrentTask(null);
    }
  };

  const handleCompleteTask = async () => {
    if (currentTask) {
      await completeTask(currentTask.reservationSid, {
        completed: true,
        completionTime: new Date().toISOString()
      });
      setCurrentTask(null);
    }
  };

  return (
    <div className="task-management">
      <div className="worker-status">
        <h3>Worker Status</h3>
        <p>Ready: {isReady ? 'Yes' : 'No'}</p>
        <p>Current Activity: {currentActivity}</p>
        <p>Active Tasks: {activeTasks.length}</p>
      </div>

      <div className="activity-controls">
        <h3>Change Activity</h3>
        <button 
          onClick={() => handleActivityChange('available')}
          disabled={!isReady}
        >
          Available
        </button>
        <button 
          onClick={() => handleActivityChange('busy')}
          disabled={!isReady}
        >
          Busy
        </button>
        <button 
          onClick={() => handleActivityChange('offline')}
          disabled={!isReady}
        >
          Offline
        </button>
        <button 
          onClick={() => handleActivityChange('wrapup')}
          disabled={!isReady}
        >
          Wrap-up
        </button>
      </div>

      {currentTask && (
        <div className="incoming-task">
          <h3>Incoming Task</h3>
          <p>Type: {currentTask.attributes?.type}</p>
          <p>Priority: {currentTask.attributes?.priority}</p>
          <p>Customer: {currentTask.attributes?.customerPhone}</p>
          <div className="task-actions">
            <button onClick={handleAcceptTask}>Accept</button>
            <button onClick={handleRejectTask}>Reject</button>
          </div>
        </div>
      )}

      {activeTasks.length > 0 && (
        <div className="active-tasks">
          <h3>Active Tasks</h3>
          {activeTasks.map((task) => (
            <div key={task.sid} className="task-item">
              <p>Task: {task.sid}</p>
              <p>Type: {task.attributes?.type}</p>
              <button onClick={() => handleCompleteTask()}>Complete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Integration with Voice Calling

### 1. Voice Call Task Creation

```typescript
// In your voice calling service
export class VoiceCallingService {
  private taskRouterService: TaskRouterService;

  constructor() {
    this.taskRouterService = new TaskRouterService();
  }

  async createCallWithTask(to: string, from: string, agentId: string) {
    // Create the voice call
    const callResult = await this.createOutboundCall({
      to,
      from,
      url: `${process.env.TWILIO_WEBHOOK_BASE_URL}/voice/twiml`,
      statusCallback: `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/call-status`
    });

    if (callResult.success) {
      // Create a TaskRouter task for the call
      const taskResult = await this.taskRouterService.createVoiceCallTask(
        callResult.callSid,
        to,
        agentId
      );

      if (taskResult.success) {
        console.log(`Call ${callResult.callSid} created with task ${taskResult.task.sid}`);
      }
    }

    return callResult;
  }
}
```

### 2. Call Status Integration

```typescript
// In your webhook handlers
export const handleCallStatus = async (req: any, res: any) => {
  const { CallSid, CallStatus } = req.body;

  if (CallStatus === 'completed' || CallStatus === 'failed') {
    // Find and complete the associated task
    const taskResult = await taskRouterService.getTaskByCallSid(CallSid);
    if (taskResult.success) {
      await taskRouterService.completeTask(taskResult.task.sid, {
        callStatus: CallStatus,
        completedAt: new Date().toISOString()
      });
    }
  }

  res.status(200).send('OK');
};
```

## Real-time Event Handling

### 1. WebSocket Integration

```typescript
// src/services/websocketService.ts
import WebSocket from 'ws';

export class WebSocketService {
  private wss: WebSocket.Server;
  private clients: Map<string, WebSocket> = new Map();

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const workerId = req.url?.split('workerId=')[1];
      if (workerId) {
        this.clients.set(workerId, ws);
        console.log(`Worker ${workerId} connected`);
      }

      ws.on('close', () => {
        if (workerId) {
          this.clients.delete(workerId);
          console.log(`Worker ${workerId} disconnected`);
        }
      });
    });
  }

  sendToWorker(workerId: string, message: any) {
    const client = this.clients.get(workerId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  broadcast(message: any) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}
```

### 2. TaskRouter Event Broadcasting

```typescript
// In your TaskRouter webhook handler
export const handleTaskRouterEvent = async (req: any, res: any) => {
  const event = req.body;
  
  // Process the event
  await processTaskRouterEvent(event);
  
  // Broadcast to connected workers
  if (event.WorkerSid) {
    websocketService.sendToWorker(event.WorkerSid, {
      type: 'taskrouter_event',
      event: event
    });
  }
  
  res.status(200).send('OK');
};
```

## Testing

### 1. Unit Tests

```typescript
// taskRouterService.test.ts
import { TaskRouterService } from '../services/taskRouterService';

describe('TaskRouterService', () => {
  let taskRouterService: TaskRouterService;

  beforeEach(() => {
    taskRouterService = new TaskRouterService();
  });

  test('should create voice call task', async () => {
    const result = await taskRouterService.createVoiceCallTask(
      'CA123',
      '+1234567890',
      'agent123'
    );
    
    expect(result.success).toBe(true);
    expect(result.task.attributes.type).toBe('voice_call');
  });

  test('should generate worker token', () => {
    const token = taskRouterService.generateWorkerToken('WK123', 'test-worker');
    expect(token).toBeDefined();
  });
});
```

### 2. Integration Tests

```typescript
// taskRouterIntegration.test.ts
import request from 'supertest';
import app from '../app';

describe('TaskRouter API Integration', () => {
  test('POST /api/taskrouter/worker/token', async () => {
    const response = await request(app)
      .post('/api/taskrouter/worker/token')
      .send({ workerSid: 'WK123', identity: 'test-worker' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });

  test('POST /api/taskrouter/tasks/voice-call', async () => {
    const response = await request(app)
      .post('/api/taskrouter/tasks/voice-call')
      .send({
        callSid: 'CA123',
        customerPhone: '+1234567890',
        agentId: 'agent123'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.task.sid).toBeDefined();
  });
});
```

## Deployment Checklist

- [ ] TaskRouter workspace configured
- [ ] Activities and task queues created
- [ ] Workflows configured
- [ ] Environment variables set
- [ ] Webhook URLs configured
- [ ] Worker tokens generated
- [ ] Real-time event handling implemented
- [ ] Integration with voice calling tested
- [ ] Error handling implemented
- [ ] Logging and monitoring setup

## Troubleshooting

### Common Issues

1. **Worker not connecting**: Check worker token and workspace SID
2. **Tasks not routing**: Verify workflow configuration
3. **Events not received**: Check webhook URLs and signature validation
4. **Activity updates failing**: Verify activity SIDs

### Debug Tools

- Twilio Console for TaskRouter monitoring
- WebSocket connection testing
- Server logs for webhook processing
- Browser developer tools for client-side debugging

## Next Steps

After completing Phase 7, you'll be ready to move on to:
- Phase 8: Analytics & Reporting
- Phase 9: Advanced Integrations
- Phase 10: Optimization & Scaling

TaskRouter provides the foundation for intelligent task routing and workforce management, enabling more sophisticated communication workflows in later phases.
