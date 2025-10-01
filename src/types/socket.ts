import { Socket } from 'socket.io';
import { User } from '@prisma/client';

// Socket.io event types for type-safe real-time communication
export interface ServerToClientEvents {
  // Voicemail events
  voicemail_created: (data: VoicemailEventData) => void;
  voicemail_updated: (data: VoicemailEventData) => void;
  voicemail_assigned: (data: VoicemailEventData) => void;
  voicemail_status_changed: (data: VoicemailEventData) => void;
  
  // Call events
  call_incoming: (data: CallEventData) => void;
  call_status_changed: (data: CallEventData) => void;
  call_completed: (data: CallEventData) => void;
  call_recording_available: (data: CallEventData) => void;
  
  // Message events
  message_received: (data: MessageEventData) => void;
  message_sent: (data: MessageEventData) => void;
  message_status_changed: (data: MessageEventData) => void;
  conversation_updated: (data: ConversationEventData) => void;
  
  // TaskRouter events
  task_assigned: (data: TaskEventData) => void;
  task_accepted: (data: TaskEventData) => void;
  task_rejected: (data: TaskEventData) => void;
  task_completed: (data: TaskEventData) => void;
  worker_status_changed: (data: WorkerEventData) => void;
  worker_activity_changed: (data: WorkerEventData) => void;
  
  // Presence events
  user_presence_updated: (data: PresenceEventData) => void;
  user_joined: (data: PresenceEventData) => void;
  user_left: (data: PresenceEventData) => void;
  user_online: (data: PresenceEventData) => void;
  user_offline: (data: PresenceEventData) => void;
  user_activity: (data: UserActivityEventData) => void;
  presence_update: (data: PresenceUpdateEventData) => void;
  online_users_list: (data: { users: Array<{ userId: string; name?: string; email?: string; department?: string; lastSeen: string }> }) => void;
  
  // System events
  notification: (data: NotificationEventData) => void;
  system_alert: (data: SystemAlertEventData) => void;
  queue_updated: (data: QueueEventData) => void;
}

export interface ClientToServerEvents {
  // Authentication
  authenticate: (token: string) => void;
  
  // Room management
  join_room: (room: string) => void;
  leave_room: (room: string) => void;
  
  // Presence
  update_presence: (data: PresenceUpdateData) => void;
  heartbeat: () => void;
  
  // User actions
  mark_voicemail_read: (voicemailId: string) => void;
  accept_task: (taskId: string) => void;
  reject_task: (taskId: string) => void;
  
  // Custom events
  custom_event: (data: any) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

// Event data interfaces
export interface VoicemailEventData {
  id: string;
  callerId: string;
  callerName?: string;
  duration: number;
  recordingUrl?: string;
  transcription?: string;
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'archived';
  assignedTo?: string;
  assignedToName?: string;
  department?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface CallEventData {
  id: string;
  callSid: string;
  from: string;
  to: string;
  status: 'ringing' | 'in-progress' | 'completed' | 'busy' | 'no-answer' | 'failed';
  direction: 'inbound' | 'outbound';
  duration?: number;
  recordingUrl?: string;
  transcription?: string;
  customerId?: string;
  customerName?: string;
  department?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageEventData {
  id: string;
  messageSid: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'received';
  conversationId?: string;
  customerId?: string;
  customerName?: string;
  department?: string;
  assignedTo?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationEventData {
  id: string;
  customerId?: string;
  customerName?: string;
  customerPhone: string;
  department?: string;
  assignedTo?: string;
  assignedToName?: string;
  status: 'active' | 'closed' | 'archived';
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskEventData {
  id: string;
  taskSid: string;
  taskQueueSid: string;
  taskQueueName: string;
  workerSid?: string;
  workerName?: string;
  attributes: Record<string, any>;
  priority: number;
  status: 'pending' | 'assigned' | 'accepted' | 'rejected' | 'completed' | 'canceled';
  assignmentStatus: 'pending' | 'assigned' | 'accepted' | 'rejected' | 'timeout';
  timeout: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerEventData {
  id: string;
  workerSid: string;
  friendlyName: string;
  activityName: string;
  activitySid: string;
  available: boolean;
  attributes: Record<string, any>;
  department?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresenceEventData {
  userId: string;
  userName: string;
  userEmail: string;
  department?: string;
  role: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  currentActivity?: string;
  location?: string;
}

export interface PresenceUpdateData {
  status: 'online' | 'offline' | 'away' | 'busy';
  currentActivity?: string;
  location?: string;
}

export interface UserActivityEventData {
  userId: string;
  activity: string;
  timestamp: string;
  name?: string;
  email?: string;
  department?: string;
}

export interface PresenceUpdateEventData {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: string;
  activity?: string;
}

export interface NotificationEventData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  userId?: string;
  department?: string;
  role?: string;
  priority: 'low' | 'medium' | 'high';
  autoDismiss: boolean;
  dismissAfter?: number;
  createdAt: string;
}

export interface SystemAlertEventData {
  id: string;
  type: 'system' | 'maintenance' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  affectedUsers?: string[];
  affectedDepartments?: string[];
  createdAt: string;
  expiresAt?: string;
}

export interface QueueEventData {
  department?: string;
  voicemailCount: number;
  unreadVoicemailCount: number;
  activeCallCount: number;
  pendingTaskCount: number;
  availableWorkerCount: number;
  averageWaitTime?: number;
  lastUpdated: string;
}

// Specific payload types for hooks
export interface VoicemailCreatedPayload {
  id: string;
  callerId: string;
  callerName?: string;
  duration: number;
  recordingUrl?: string;
  transcription?: string;
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'archived';
  assignedTo?: string;
  assignedToName?: string;
  department?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
}

export interface VoicemailUpdatedPayload {
  id: string;
  status: 'new' | 'assigned' | 'in_progress' | 'completed' | 'archived';
  assignedTo?: string;
  assignedToName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  updatedAt: string;
}

export interface MessageReceivedPayload {
  id: string;
  messageSid: string;
  from: string;
  to: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'received';
  conversationId?: string;
  customerId?: string;
  customerName?: string;
  department?: string;
  assignedTo?: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageStatusChangedPayload {
  id: string;
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'received';
  updatedAt: string;
}

export interface ConversationUpdatedPayload {
  id: string;
  customerId?: string;
  customerName?: string;
  customerPhone: string;
  department?: string;
  assignedTo?: string;
  assignedToName?: string;
  status: 'active' | 'closed' | 'archived';
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignedPayload {
  id: string;
  taskSid: string;
  taskQueueSid: string;
  taskQueueName: string;
  workerSid?: string;
  workerName?: string;
  attributes: Record<string, any>;
  priority: number;
  assignmentStatus: 'pending' | 'assigned' | 'accepted' | 'rejected' | 'timeout';
  createdAt: string;
  updatedAt: string;
}

export interface TaskAcceptedPayload {
  id: string;
  taskSid: string;
  workerSid: string;
  workerName?: string;
  updatedAt: string;
}

export interface TaskRejectedPayload {
  id: string;
  taskSid: string;
  workerSid: string;
  workerName?: string;
  updatedAt: string;
}

export interface TaskCompletedPayload {
  id: string;
  taskSid: string;
  workerSid: string;
  workerName?: string;
  updatedAt: string;
}

export interface WorkerStatusChangedPayload {
  workerSid: string;
  workerName?: string;
  available: boolean;
  activitySid: string;
  updatedAt: string;
}

export interface WorkerActivityChangedPayload {
  workerSid: string;
  workerName?: string;
  activitySid: string;
  activityName: string;
  available: boolean;
  updatedAt: string;
}

// Socket.io server types
export type SocketServer = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents>;

// Room types for organizing users
export type RoomType = 
  | 'global'
  | `department:${string}`
  | `role:${string}`
  | `user:${string}`
  | `voicemail:${string}`
  | `conversation:${string}`
  | `task:${string}`
  | `taskqueue:${string}`;

// Connection state types
export interface SocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error?: string;
  lastConnected?: string;
  reconnectAttempts: number;
}

// User session data for Socket.io
export interface SocketUserSession {
  user: User;
  sessionId: string;
  connectedAt: string;
  lastActivity: string;
  rooms: string[];
  presence: PresenceUpdateData;
}

// Event subscription types
export interface EventSubscription {
  event: keyof ServerToClientEvents;
  handler: (...args: any[]) => void;
  once?: boolean;
}

// Socket.io configuration
export interface SocketConfig {
  port: number;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  adapter?: string;
  enablePresence: boolean;
  presenceTimeout: number;
  heartbeatInterval: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
}
