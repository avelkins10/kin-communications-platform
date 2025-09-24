# TypeScript Definitions for Twilio SDKs

This document provides TypeScript type definitions and interfaces for working with Twilio SDKs in the KIN Communications Platform.

## Core Types

### Twilio Client Types
```typescript
// Twilio Client Configuration
interface TwilioClientConfig {
  accountSid: string;
  authToken: string;
  region?: string;
  edge?: string;
  httpClient?: {
    agent?: any;
    timeout?: number;
  };
}

// Twilio Client Instance
interface TwilioClient {
  calls: CallResource;
  messages: MessageResource;
  taskrouter: TaskRouterResource;
  // ... other resources
}
```

### Voice SDK Types
```typescript
// Device Options
interface DeviceOptions {
  edge?: string;
  region?: string;
  sounds?: {
    incoming?: string;
    outgoing?: string;
    disconnect?: string;
  };
  enableImprovedSignalingErrorPrecision?: boolean;
  closeExistingSessions?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// Device Events
interface DeviceEvents {
  'ready': (device: Device) => void;
  'error': (error: TwilioError) => void;
  'incoming': (call: Call) => void;
  'tokenWillExpire': () => void;
  'registered': () => void;
  'unregistered': () => void;
}

// Call Options
interface CallOptions {
  params?: Record<string, any>;
  rtcConstraints?: RTCConfiguration;
}

// Call Events
interface CallEvents {
  'accept': (call: Call) => void;
  'disconnect': (call: Call) => void;
  'error': (error: TwilioError) => void;
  'mute': (isMuted: boolean) => void;
  'reconnecting': (call: Call) => void;
  'ringing': (call: Call) => void;
}

// Twilio Error
interface TwilioError extends Error {
  code: number;
  message: string;
  explanation?: string;
  solutions?: string[];
  status?: number;
  moreInfo?: string;
}
```

### TaskRouter SDK Types
```typescript
// Worker Options
interface WorkerOptions {
  edge?: string;
  region?: string;
  closeExistingSessions?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

// Worker Events
interface WorkerEvents {
  'ready': (worker: Worker) => void;
  'error': (error: TwilioError) => void;
  'disconnected': () => void;
  'tokenExpired': () => void;
  'activityUpdated': (activity: Activity) => void;
  'attributesUpdated': (attributes: Record<string, any>) => void;
  'reservationCreated': (reservation: Reservation) => void;
  'reservationFailed': (reservation: Reservation) => void;
}

// Task Attributes
interface TaskAttributes {
  type?: string;
  priority?: number | string;
  customer_id?: string;
  department?: string;
  skills?: string[];
  [key: string]: any;
}

// Worker Attributes
interface WorkerAttributes {
  name?: string;
  email?: string;
  skills?: string[];
  department?: string;
  languages?: string[];
  max_concurrent_tasks?: number;
  [key: string]: any;
}

// Reservation Options
interface ReservationOptions {
  timeout?: number;
  instruction?: string;
  dequeueFrom?: string;
  dequeueStatusCallbackUrl?: string;
  dequeueStatusCallbackEvent?: string[];
}

// Reservation Events
interface ReservationEvents {
  'accepted': (reservation: Reservation) => void;
  'rejected': (reservation: Reservation) => void;
  'timeout': (reservation: Reservation) => void;
  'canceled': (reservation: Reservation) => void;
  'completed': (reservation: Reservation) => void;
  'wrapup': (reservation: Reservation) => void;
}
```

## API Response Types

### Voice API Responses
```typescript
// Call Resource
interface CallResource {
  sid: string;
  status: CallStatus;
  direction: CallDirection;
  from: string;
  to: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  price?: string;
  priceUnit?: string;
  uri: string;
}

// Call Status Enum
type CallStatus = 
  | 'queued'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'busy'
  | 'failed'
  | 'no-answer'
  | 'canceled';

// Call Direction Enum
type CallDirection = 'inbound' | 'outbound-api' | 'outbound-dial';

// Message Resource
interface MessageResource {
  sid: string;
  status: MessageStatus;
  direction: MessageDirection;
  from: string;
  to: string;
  body: string;
  dateCreated: Date;
  dateUpdated: Date;
  dateSent?: Date;
  uri: string;
}

// Message Status Enum
type MessageStatus = 
  | 'queued'
  | 'sending'
  | 'sent'
  | 'receiving'
  | 'received'
  | 'failed'
  | 'undelivered';

// Message Direction Enum
type MessageDirection = 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
```

### TaskRouter API Responses
```typescript
// Task Resource
interface TaskResource {
  sid: string;
  attributes: string; // JSON string
  assignmentStatus: TaskAssignmentStatus;
  priority: number;
  age: number;
  timeout: number;
  workflowSid: string;
  workflowFriendlyName: string;
  queueSid: string;
  queueFriendlyName: string;
  dateCreated: Date;
  dateUpdated: Date;
  uri: string;
}

// Task Assignment Status Enum
type TaskAssignmentStatus = 
  | 'pending'
  | 'reserved'
  | 'assigned'
  | 'canceled'
  | 'completed'
  | 'wrapping';

// Worker Resource
interface WorkerResource {
  sid: string;
  friendlyName: string;
  attributes: string; // JSON string
  activityName: string;
  activitySid: string;
  available: boolean;
  dateCreated: Date;
  dateUpdated: Date;
  dateStatusChanged: Date;
  uri: string;
}

// Activity Resource
interface ActivityResource {
  sid: string;
  friendlyName: string;
  available: boolean;
  dateCreated: Date;
  dateUpdated: Date;
  uri: string;
}

// Task Queue Resource
interface TaskQueueResource {
  sid: string;
  friendlyName: string;
  targetWorkers: string;
  maxReservedWorkers: number;
  taskOrder: TaskOrder;
  dateCreated: Date;
  dateUpdated: Date;
  uri: string;
}

// Task Order Enum
type TaskOrder = 'FIFO' | 'LIFO';

// Workflow Resource
interface WorkflowResource {
  sid: string;
  friendlyName: string;
  configuration: string; // JSON string
  dateCreated: Date;
  dateUpdated: Date;
  uri: string;
}
```

## Webhook Event Types

### Voice Webhook Events
```typescript
// Call Status Event
interface CallStatusEvent {
  CallSid: string;
  CallStatus: CallStatus;
  CallDuration?: string;
  From: string;
  To: string;
  Direction: CallDirection;
  StartTime?: string;
  EndTime?: string;
  Price?: string;
  PriceUnit?: string;
  Timestamp: string;
}

// Recording Status Event
interface RecordingStatusEvent {
  CallSid: string;
  RecordingSid: string;
  RecordingStatus: RecordingStatus;
  RecordingUrl?: string;
  RecordingDuration?: string;
  RecordingChannels?: string;
  RecordingSource?: string;
  Timestamp: string;
}

// Recording Status Enum
type RecordingStatus = 'in-progress' | 'completed' | 'failed' | 'absent';
```

### TaskRouter Webhook Events
```typescript
// TaskRouter Event
interface TaskRouterEvent {
  EventType: TaskRouterEventType;
  EventData: Record<string, any>;
  WorkerSid?: string;
  TaskSid?: string;
  WorkspaceSid: string;
  Timestamp: string;
  ActorSid?: string;
  ActorType?: string;
  Description?: string;
}

// TaskRouter Event Type Enum
type TaskRouterEventType = 
  | 'task.created'
  | 'task.assigned'
  | 'task.completed'
  | 'task.canceled'
  | 'task.wrapup'
  | 'task.timeout'
  | 'worker.activity.update'
  | 'worker.attributes.update'
  | 'reservation.created'
  | 'reservation.accepted'
  | 'reservation.rejected'
  | 'reservation.timeout'
  | 'reservation.canceled'
  | 'reservation.completed'
  | 'reservation.wrapup';
```

## Service Interface Types

### Voice Service Interface
```typescript
interface IVoiceService {
  createCall(options: CallOptions): Promise<CallResult>;
  getCallDetails(callSid: string): Promise<CallDetailsResult>;
  hangupCall(callSid: string): Promise<HangupResult>;
  generateVoiceToken(identity: string, ttl?: number): string;
}

interface CallResult {
  success: boolean;
  callSid?: string;
  status?: string;
  direction?: string;
  from?: string;
  to?: string;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface CallDetailsResult {
  success: boolean;
  call?: CallResource;
  error?: string;
}

interface HangupResult {
  success: boolean;
  callSid?: string;
  status?: string;
  error?: string;
}
```

### TaskRouter Service Interface
```typescript
interface ITaskRouterService {
  createTask(attributes: TaskAttributes, priority?: number, timeout?: number): Promise<TaskResult>;
  getTask(taskSid: string): Promise<TaskDetailsResult>;
  updateTask(taskSid: string, attributes: TaskAttributes): Promise<TaskUpdateResult>;
  cancelTask(taskSid: string, reason?: string): Promise<TaskCancelResult>;
  getWorker(workerSid: string): Promise<WorkerResult>;
  updateWorker(workerSid: string, attributes: WorkerAttributes): Promise<WorkerUpdateResult>;
  updateWorkerActivity(workerSid: string, activitySid: string): Promise<WorkerActivityResult>;
  generateWorkerToken(workerSid: string, identity: string, ttl?: number): string;
}

interface TaskResult {
  success: boolean;
  task?: TaskResource;
  error?: string;
}

interface TaskDetailsResult {
  success: boolean;
  task?: TaskResource;
  error?: string;
}

interface TaskUpdateResult {
  success: boolean;
  task?: TaskResource;
  error?: string;
}

interface TaskCancelResult {
  success: boolean;
  task?: TaskResource;
  error?: string;
}

interface WorkerResult {
  success: boolean;
  worker?: WorkerResource;
  error?: string;
}

interface WorkerUpdateResult {
  success: boolean;
  worker?: WorkerResource;
  error?: string;
}

interface WorkerActivityResult {
  success: boolean;
  worker?: WorkerResource;
  error?: string;
}
```

## Webhook Handler Types

### Webhook Request/Response Types
```typescript
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

interface IWebhookHandler {
  handle(req: WebhookRequest, res: WebhookResponse): Promise<WebhookResponse>;
}
```

### Webhook Security Types
```typescript
interface IWebhookSecurityManager {
  validateSignature(req: WebhookRequest, url: string): boolean;
  validateSignatureWithRawBody(req: WebhookRequest, url: string): boolean;
  generateTestSignature(url: string, body: string): string;
}
```

## Custom KIN Types

### KIN-Specific Types
```typescript
// KIN Contact Integration
interface KINContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  skills: string[];
  availability: ContactAvailability;
  lastContact?: Date;
  notes?: string;
}

interface ContactAvailability {
  status: 'available' | 'busy' | 'offline';
  nextAvailable?: Date;
  timezone: string;
}

// KIN Call Session
interface KINCallSession {
  id: string;
  callSid: string;
  taskSid?: string;
  customerId: string;
  agentId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: CallStatus;
  recordingUrl?: string;
  transcriptionUrl?: string;
  notes?: string;
  tags?: string[];
}

// KIN Task
interface KINTask {
  id: string;
  taskSid: string;
  type: TaskType;
  priority: TaskPriority;
  customerId: string;
  agentId?: string;
  status: TaskStatus;
  createdAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  attributes: TaskAttributes;
  notes?: string;
}

type TaskType = 'voice_call' | 'callback' | 'follow_up' | 'support' | 'sales';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type TaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'canceled';

// KIN Agent
interface KINAgent {
  id: string;
  workerSid: string;
  name: string;
  email: string;
  department: string;
  skills: string[];
  languages: string[];
  status: AgentStatus;
  currentActivity: string;
  activeTasks: number;
  maxConcurrentTasks: number;
  lastActivity?: Date;
}

type AgentStatus = 'available' | 'busy' | 'offline' | 'break' | 'training';
```

## Utility Types

### Generic API Response Types
```typescript
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp: Date;
}
```

### Configuration Types
```typescript
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  applicationSid: string;
  workspaceSid: string;
  workflowSid: string;
  taskQueueSid: string;
  apiKeySid: string;
  apiKeySecret: string;
  webhookBaseUrl: string;
  region?: string;
  edge?: string;
}

interface KINConfig {
  twilio: TwilioConfig;
  database: {
    url: string;
    ssl: boolean;
  };
  redis: {
    url: string;
    password?: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
}
```

## Usage Examples

### Type-Safe Service Implementation
```typescript
class VoiceService implements IVoiceService {
  private client: TwilioClient;

  constructor(config: TwilioConfig) {
    this.client = twilio(config.accountSid, config.authToken);
  }

  async createCall(options: CallOptions): Promise<CallResult> {
    try {
      const call = await this.client.calls.create({
        to: options.to,
        from: options.from,
        url: options.url,
        record: options.record || false
      });

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        direction: call.direction,
        from: call.from,
        to: call.to,
        startTime: call.startTime,
        endTime: call.endTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ... other methods
}
```

### Type-Safe Webhook Handler
```typescript
class CallStatusWebhookHandler implements IWebhookHandler {
  async handle(req: WebhookRequest, res: WebhookResponse): Promise<WebhookResponse> {
    const event: CallStatusEvent = req.body;
    
    // Type-safe event processing
    switch (event.CallStatus) {
      case 'completed':
        await this.handleCallCompleted(event);
        break;
      case 'failed':
        await this.handleCallFailed(event);
        break;
      // ... other cases
    }

    return {
      status: 200,
      body: 'OK'
    };
  }

  private async handleCallCompleted(event: CallStatusEvent): Promise<void> {
    // Type-safe access to event properties
    console.log(`Call ${event.CallSid} completed. Duration: ${event.CallDuration} seconds`);
  }

  private async handleCallFailed(event: CallStatusEvent): Promise<void> {
    console.log(`Call ${event.CallSid} failed`);
  }
}
```

### Type-Safe React Component
```typescript
interface VoiceDeviceProps {
  identity: string;
  onCallStatusChange?: (status: CallStatus) => void;
  onIncomingCall?: (call: Call) => void;
}

const VoiceDevice: React.FC<VoiceDeviceProps> = ({
  identity,
  onCallStatusChange,
  onIncomingCall
}) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');

  useEffect(() => {
    const initializeDevice = async () => {
      const token = await getVoiceToken(identity);
      const newDevice = new Twilio.Device(token, {
        edge: 'ashburn',
        sounds: {
          incoming: '/sounds/incoming.wav',
          outgoing: '/sounds/outgoing.wav'
        }
      });

      newDevice.on('ready', () => {
        setCallStatus('ready');
        onCallStatusChange?.('ready');
      });

      newDevice.on('incoming', (call: Call) => {
        onIncomingCall?.(call);
      });

      setDevice(newDevice);
    };

    initializeDevice();
  }, [identity, onCallStatusChange, onIncomingCall]);

  // ... component implementation
};
```

These TypeScript definitions provide comprehensive type safety for working with Twilio SDKs in the KIN Communications Platform, ensuring better development experience and fewer runtime errors.
