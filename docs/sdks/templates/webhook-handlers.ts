/**
 * Webhook Handlers Template for KIN Communications Platform
 * 
 * This template provides secure webhook processing for Twilio services
 * including signature validation and event handling.
 */

import twilio from 'twilio';
import crypto from 'crypto';

// Types
interface WebhookRequest {
  body: any;
  headers: Record<string, string>;
  rawBody?: Buffer;
}

interface WebhookResponse {
  status: number;
  body: string;
  headers?: Record<string, string>;
}

interface CallStatusEvent {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  From: string;
  To: string;
  Direction: string;
  StartTime?: string;
  EndTime?: string;
  Price?: string;
  PriceUnit?: string;
}

interface RecordingStatusEvent {
  CallSid: string;
  RecordingSid: string;
  RecordingStatus: string;
  RecordingUrl?: string;
  RecordingDuration?: string;
  RecordingChannels?: string;
}

interface TaskRouterEvent {
  EventType: string;
  EventData: any;
  WorkerSid?: string;
  TaskSid?: string;
  WorkspaceSid?: string;
  Timestamp: string;
}

// Webhook Security Manager
export class WebhookSecurityManager {
  private authToken: string;

  constructor() {
    this.authToken = process.env.TWILIO_AUTH_TOKEN!;
    if (!this.authToken) {
      throw new Error('TWILIO_AUTH_TOKEN environment variable is required');
    }
  }

  /**
   * Validate Twilio webhook signature
   */
  validateSignature(req: WebhookRequest, url: string): boolean {
    const signature = req.headers['x-twilio-signature'];
    if (!signature) {
      console.error('Missing Twilio signature header');
      return false;
    }

    try {
      return twilio.validateRequest(this.authToken, signature, url, req.body);
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Validate webhook signature with raw body
   */
  validateSignatureWithRawBody(req: WebhookRequest, url: string): boolean {
    const signature = req.headers['x-twilio-signature'];
    if (!signature) {
      console.error('Missing Twilio signature header');
      return false;
    }

    if (!req.rawBody) {
      console.error('Raw body is required for signature validation');
      return false;
    }

    try {
      return twilio.validateRequest(this.authToken, signature, url, req.rawBody);
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Generate HMAC signature for testing
   */
  generateTestSignature(url: string, body: string): string {
    const hmac = crypto.createHmac('sha1', this.authToken);
    hmac.update(url + body);
    return hmac.digest('base64');
  }
}

// Call Status Webhook Handler
export class CallStatusWebhookHandler {
  private securityManager: WebhookSecurityManager;

  constructor() {
    this.securityManager = new WebhookSecurityManager();
  }

  /**
   * Handle call status webhook
   */
  async handle(req: WebhookRequest, res: WebhookResponse): Promise<WebhookResponse> {
    const webhookUrl = `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/call-status`;

    // Validate signature
    if (!this.securityManager.validateSignature(req, webhookUrl)) {
      console.error('Invalid webhook signature for call status');
      return {
        status: 403,
        body: 'Forbidden'
      };
    }

    const event: CallStatusEvent = req.body;
    console.log(`Call Status Webhook: ${event.CallSid} - ${event.CallStatus}`);

    try {
      await this.processCallStatus(event);
      return {
        status: 200,
        body: 'OK'
      };
    } catch (error) {
      console.error('Error processing call status:', error);
      return {
        status: 500,
        body: 'Internal Server Error'
      };
    }
  }

  /**
   * Process call status event
   */
  private async processCallStatus(event: CallStatusEvent): Promise<void> {
    switch (event.CallStatus) {
      case 'initiated':
        await this.handleCallInitiated(event);
        break;
      case 'ringing':
        await this.handleCallRinging(event);
        break;
      case 'answered':
        await this.handleCallAnswered(event);
        break;
      case 'completed':
        await this.handleCallCompleted(event);
        break;
      case 'failed':
        await this.handleCallFailed(event);
        break;
      case 'busy':
        await this.handleCallBusy(event);
        break;
      case 'no-answer':
        await this.handleCallNoAnswer(event);
        break;
      default:
        console.log(`Unknown call status: ${event.CallStatus}`);
    }
  }

  private async handleCallInitiated(event: CallStatusEvent): Promise<void> {
    console.log(`Call ${event.CallSid} initiated from ${event.From} to ${event.To}`);
    // Update database with call initiation
    // Send notification to relevant users
  }

  private async handleCallRinging(event: CallStatusEvent): Promise<void> {
    console.log(`Call ${event.CallSid} is ringing`);
    // Update call status in database
  }

  private async handleCallAnswered(event: CallStatusEvent): Promise<void> {
    console.log(`Call ${event.CallSid} answered`);
    // Update call status, start call timer
  }

  private async handleCallCompleted(event: CallStatusEvent): Promise<void> {
    console.log(`Call ${event.CallSid} completed. Duration: ${event.CallDuration} seconds`);
    // Update call record with completion details
    // Process call analytics
    // Update user statistics
  }

  private async handleCallFailed(event: CallStatusEvent): Promise<void> {
    console.log(`Call ${event.CallSid} failed`);
    // Log failure reason
    // Update call record
  }

  private async handleCallBusy(event: CallStatusEvent): Promise<void> {
    console.log(`Call ${event.CallSid} busy`);
    // Handle busy call scenario
  }

  private async handleCallNoAnswer(event: CallStatusEvent): Promise<void> {
    console.log(`Call ${event.CallSid} no answer`);
    // Handle no answer scenario
  }
}

// Recording Status Webhook Handler
export class RecordingStatusWebhookHandler {
  private securityManager: WebhookSecurityManager;

  constructor() {
    this.securityManager = new WebhookSecurityManager();
  }

  /**
   * Handle recording status webhook
   */
  async handle(req: WebhookRequest, res: WebhookResponse): Promise<WebhookResponse> {
    const webhookUrl = `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/recording-status`;

    // Validate signature
    if (!this.securityManager.validateSignature(req, webhookUrl)) {
      console.error('Invalid webhook signature for recording status');
      return {
        status: 403,
        body: 'Forbidden'
      };
    }

    const event: RecordingStatusEvent = req.body;
    console.log(`Recording Status Webhook: ${event.RecordingSid} - ${event.RecordingStatus}`);

    try {
      await this.processRecordingStatus(event);
      return {
        status: 200,
        body: 'OK'
      };
    } catch (error) {
      console.error('Error processing recording status:', error);
      return {
        status: 500,
        body: 'Internal Server Error'
      };
    }
  }

  /**
   * Process recording status event
   */
  private async processRecordingStatus(event: RecordingStatusEvent): Promise<void> {
    switch (event.RecordingStatus) {
      case 'in-progress':
        await this.handleRecordingInProgress(event);
        break;
      case 'completed':
        await this.handleRecordingCompleted(event);
        break;
      case 'failed':
        await this.handleRecordingFailed(event);
        break;
      default:
        console.log(`Unknown recording status: ${event.RecordingStatus}`);
    }
  }

  private async handleRecordingInProgress(event: RecordingStatusEvent): Promise<void> {
    console.log(`Recording ${event.RecordingSid} in progress for call ${event.CallSid}`);
    // Update recording status in database
  }

  private async handleRecordingCompleted(event: RecordingStatusEvent): Promise<void> {
    console.log(`Recording ${event.RecordingSid} completed for call ${event.CallSid}`);
    console.log(`Recording URL: ${event.RecordingUrl}`);
    
    // Download and store recording
    if (event.RecordingUrl) {
      await this.downloadRecording(event.RecordingSid, event.RecordingUrl);
    }
    
    // Update database with recording details
    // Trigger transcription if needed
  }

  private async handleRecordingFailed(event: RecordingStatusEvent): Promise<void> {
    console.log(`Recording ${event.RecordingSid} failed for call ${event.CallSid}`);
    // Log failure reason
    // Update recording status
  }

  /**
   * Download recording from Twilio
   */
  private async downloadRecording(recordingSid: string, recordingUrl: string): Promise<void> {
    try {
      // Add auth token to URL
      const authenticatedUrl = `${recordingUrl}?AuthToken=${process.env.TWILIO_AUTH_TOKEN}`;
      
      // Download recording (implement based on your storage solution)
      console.log(`Downloading recording ${recordingSid} from ${authenticatedUrl}`);
      
      // Example: Save to local file system or cloud storage
      // const response = await fetch(authenticatedUrl);
      // const buffer = await response.arrayBuffer();
      // await saveToStorage(recordingSid, buffer);
    } catch (error) {
      console.error(`Error downloading recording ${recordingSid}:`, error);
    }
  }
}

// TaskRouter Webhook Handler
export class TaskRouterWebhookHandler {
  private securityManager: WebhookSecurityManager;

  constructor() {
    this.securityManager = new WebhookSecurityManager();
  }

  /**
   * Handle TaskRouter webhook
   */
  async handle(req: WebhookRequest, res: WebhookResponse): Promise<WebhookResponse> {
    const webhookUrl = `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/taskrouter`;

    // Validate signature
    if (!this.securityManager.validateSignature(req, webhookUrl)) {
      console.error('Invalid webhook signature for TaskRouter');
      return {
        status: 403,
        body: 'Forbidden'
      };
    }

    const event: TaskRouterEvent = req.body;
    console.log(`TaskRouter Webhook: ${event.EventType}`);

    try {
      await this.processTaskRouterEvent(event);
      return {
        status: 200,
        body: 'OK'
      };
    } catch (error) {
      console.error('Error processing TaskRouter event:', error);
      return {
        status: 500,
        body: 'Internal Server Error'
      };
    }
  }

  /**
   * Process TaskRouter event
   */
  private async processTaskRouterEvent(event: TaskRouterEvent): Promise<void> {
    switch (event.EventType) {
      case 'task.created':
        await this.handleTaskCreated(event);
        break;
      case 'task.assigned':
        await this.handleTaskAssigned(event);
        break;
      case 'task.completed':
        await this.handleTaskCompleted(event);
        break;
      case 'task.canceled':
        await this.handleTaskCanceled(event);
        break;
      case 'worker.activity.update':
        await this.handleWorkerActivityUpdate(event);
        break;
      case 'worker.attributes.update':
        await this.handleWorkerAttributesUpdate(event);
        break;
      default:
        console.log(`Unknown TaskRouter event: ${event.EventType}`);
    }
  }

  private async handleTaskCreated(event: TaskRouterEvent): Promise<void> {
    console.log(`Task ${event.TaskSid} created in workspace ${event.WorkspaceSid}`);
    // Create task record in database
    // Notify available workers
  }

  private async handleTaskAssigned(event: TaskRouterEvent): Promise<void> {
    console.log(`Task ${event.TaskSid} assigned to worker ${event.WorkerSid}`);
    // Update task assignment in database
    // Notify assigned worker
  }

  private async handleTaskCompleted(event: TaskRouterEvent): Promise<void> {
    console.log(`Task ${event.TaskSid} completed by worker ${event.WorkerSid}`);
    // Update task completion in database
    // Process task analytics
  }

  private async handleTaskCanceled(event: TaskRouterEvent): Promise<void> {
    console.log(`Task ${event.TaskSid} canceled`);
    // Update task cancellation in database
  }

  private async handleWorkerActivityUpdate(event: TaskRouterEvent): Promise<void> {
    console.log(`Worker ${event.WorkerSid} activity updated`);
    // Update worker activity in database
    // Update worker availability status
  }

  private async handleWorkerAttributesUpdate(event: TaskRouterEvent): Promise<void> {
    console.log(`Worker ${event.WorkerSid} attributes updated`);
    // Update worker attributes in database
  }
}

// Express.js Middleware
export class WebhookMiddleware {
  private securityManager: WebhookSecurityManager;

  constructor() {
    this.securityManager = new WebhookSecurityManager();
  }

  /**
   * Middleware for Twilio webhook signature validation
   */
  validateTwilioWebhook(url: string) {
    return (req: any, res: any, next: any) => {
      if (!this.securityManager.validateSignature(req, url)) {
        return res.status(403).send('Forbidden');
      }
      next();
    };
  }

  /**
   * Middleware for raw body parsing (required for signature validation)
   */
  parseRawBody() {
    return (req: any, res: any, next: any) => {
      let data = '';
      req.setEncoding('utf8');
      
      req.on('data', (chunk: string) => {
        data += chunk;
      });
      
      req.on('end', () => {
        req.rawBody = Buffer.from(data, 'utf8');
        req.body = JSON.parse(data);
        next();
      });
    };
  }
}

// Usage Examples
export const webhookExamples = {
  // Express.js setup
  setupExpressWebhooks() {
    const express = require('express');
    const app = express();
    
    const middleware = new WebhookMiddleware();
    const callStatusHandler = new CallStatusWebhookHandler();
    const recordingHandler = new RecordingStatusWebhookHandler();
    const taskRouterHandler = new TaskRouterWebhookHandler();

    // Parse raw body for signature validation
    app.use('/webhooks', middleware.parseRawBody());

    // Call status webhook
    app.post('/webhooks/call-status', 
      middleware.validateTwilioWebhook(`${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/call-status`),
      async (req: any, res: any) => {
        const result = await callStatusHandler.handle(req, res);
        res.status(result.status).send(result.body);
      }
    );

    // Recording status webhook
    app.post('/webhooks/recording-status',
      middleware.validateTwilioWebhook(`${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/recording-status`),
      async (req: any, res: any) => {
        const result = await recordingHandler.handle(req, res);
        res.status(result.status).send(result.body);
      }
    );

    // TaskRouter webhook
    app.post('/webhooks/taskrouter',
      middleware.validateTwilioWebhook(`${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/taskrouter`),
      async (req: any, res: any) => {
        const result = await taskRouterHandler.handle(req, res);
        res.status(result.status).send(result.body);
      }
    );

    return app;
  }
};

export default {
  WebhookSecurityManager,
  CallStatusWebhookHandler,
  RecordingStatusWebhookHandler,
  TaskRouterWebhookHandler,
  WebhookMiddleware
};
