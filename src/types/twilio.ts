export interface TwilioWebhookBase {
  AccountSid: string;
  ApiVersion?: string;
}

export interface VoiceStatusCallback extends TwilioWebhookBase {
  CallSid: string;
  CallStatus: "queued" | "ringing" | "in-progress" | "busy" | "failed" | "no-answer" | "canceled" | "completed";
  From?: string;
  To?: string;
  Timestamp?: string;
  CallDuration?: string;
  Direction?: "inbound" | "outbound";
}

export interface VoiceWebhook extends TwilioWebhookBase {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: "inbound" | "outbound";
  CallerName?: string;
  CallerCity?: string;
  CallerState?: string;
  CallerCountry?: string;
  CallerZip?: string;
  CalledCity?: string;
  CalledState?: string;
  CalledCountry?: string;
  CalledZip?: string;
}

export interface RecordingWebhook extends TwilioWebhookBase {
  CallSid: string;
  RecordingSid: string;
  RecordingUrl: string;
  RecordingDuration: string;
  RecordingChannels: string;
  RecordingStatus: "in-progress" | "completed" | "absent";
  RecordingStartTime?: string;
  RecordingSource?: string;
}

export interface TranscriptionWebhook extends TwilioWebhookBase {
  CallSid: string;
  TranscriptionSid: string;
  TranscriptionText: string;
  TranscriptionStatus: "in-progress" | "completed" | "failed";
  TranscriptionUrl?: string;
  RecordingSid?: string;
}

export interface OutboundCallParams {
  to: string;
  from: string;
  statusCallback?: string;
  statusCallbackEvent?: string[];
  record?: boolean;
  recordingChannels?: "mono" | "dual";
  recordingStatusCallback?: string;
  twiml?: string;
  url?: string;
}

export interface CallControlAction {
  action: "mute" | "unmute" | "hold" | "unhold" | "hangup" | "transfer";
  to?: string; // For transfer action
}

export interface TwiMLResponse {
  say?: {
    voice?: string;
    language?: string;
    text: string;
  };
  play?: {
    url: string;
  };
  record?: {
    action?: string;
    method?: string;
    maxLength?: number;
    finishOnKey?: string;
    recordingStatusCallback?: string;
  };
  dial?: {
    number?: string;
    callerId?: string;
    timeout?: number;
    timeLimit?: number;
    record?: boolean;
  };
  hangup?: {};
  redirect?: {
    url: string;
    method?: string;
  };
}

export interface InboundMessageWebhook extends TwilioWebhookBase {
  MessageSid: string;
  From: string;
  To: string;
  Body?: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaUrl1?: string;
  MediaUrl2?: string;
  MediaUrl3?: string;
  MediaUrl4?: string;
  MediaUrl5?: string;
  MediaUrl6?: string;
  MediaUrl7?: string;
  MediaUrl8?: string;
  MediaUrl9?: string;
  MediaContentType0?: string;
  MediaContentType1?: string;
  MediaContentType2?: string;
  MediaContentType3?: string;
  MediaContentType4?: string;
  MediaContentType5?: string;
  MediaContentType6?: string;
  MediaContentType7?: string;
  MediaContentType8?: string;
  MediaContentType9?: string;
  SmsStatus?: string;
  SmsSid?: string;
  SmsMessageSid?: string;
  MessageStatus?: string;
  MessagingServiceSid?: string;
  ApiVersion?: string;
}

export interface MessageStatusWebhook extends TwilioWebhookBase {
  MessageSid: string;
  MessageStatus: "queued" | "sending" | "sent" | "receiving" | "received" | "delivered" | "undelivered" | "failed";
  To: string;
  From: string;
  Body?: string;
  NumSegments?: string;
  NumMedia?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  Price?: string;
  PriceUnit?: string;
  SmsSid?: string;
  SmsMessageSid?: string;
  MessagingServiceSid?: string;
  ApiVersion?: string;
  Timestamp?: string;
}

export interface MessageCreateParams {
  to: string;
  from?: string;
  body?: string;
  mediaUrl?: string[];
  statusCallback?: string;
  statusCallbackMethod?: "GET" | "POST";
  messagingServiceSid?: string;
  sendAsMms?: boolean;
  smartEncoded?: boolean;
  validityPeriod?: number;
  maxPrice?: number;
  provideFeedback?: boolean;
  forceDelivery?: boolean;
  applicationSid?: string;
  contentRetention?: "retain" | "discard";
  addressRetention?: "retain" | "discard";
  persistentAction?: string[];
  shortenUrls?: boolean;
}

export interface MessageListParams {
  to?: string;
  from?: string;
  dateSent?: Date;
  dateSentBefore?: Date;
  dateSentAfter?: Date;
  pageSize?: number;
  limit?: number;
}

export interface ConversationWebhook extends TwilioWebhookBase {
  ConversationSid: string;
  MessageSid: string;
  ParticipantSid: string;
  Author: string;
  Body?: string;
  Index: string;
  DateCreated: string;
  DateUpdated: string;
  Delivery?: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    undelivered: number;
  };
  Attributes?: string;
  MediaSid?: string;
  Media?: {
    sid: string;
    size: number;
    content_type: string;
    filename?: string;
  };
}

export interface ConversationCreateParams {
  friendlyName?: string;
  uniqueName?: string;
  attributes?: string;
  messagingServiceSid?: string;
  state?: "active" | "inactive" | "closed";
  timers?: {
    closed?: string;
    inactive?: string;
  };
}

export interface ConversationParticipantCreateParams {
  identity?: string;
  messagingBinding?: {
    type: "sms" | "whatsapp";
    address: string;
    proxyAddress?: string;
  };
  attributes?: string;
  roleSid?: string;
  lastReadMessageIndex?: number;
  lastReadTimestamp?: Date;
}

export interface BulkMessageParams {
  to: string[];
  body: string;
  from?: string;
  mediaUrl?: string[];
  statusCallback?: string;
  messagingServiceSid?: string;
  sendAsMms?: boolean;
  smartEncoded?: boolean;
  validityPeriod?: number;
  maxPrice?: number;
  provideFeedback?: boolean;
  forceDelivery?: boolean;
  applicationSid?: string;
  contentRetention?: "retain" | "discard";
  addressRetention?: "retain" | "discard";
  persistentAction?: string[];
  shortenUrls?: boolean;
}

export interface MessageTemplate {
  name: string;
  body: string;
  category: "SUPPORT" | "SALES" | "SCHEDULING" | "FIELD_CREW" | "GENERAL";
  variables: string[];
  isShared: boolean;
}

export interface MessageTemplateCreateInput {
  name: string;
  body: string;
  category: "SUPPORT" | "SALES" | "SCHEDULING" | "FIELD_CREW" | "GENERAL";
  variables?: string[];
  isShared?: boolean;
}

export interface MessageTemplateUpdateInput {
  name?: string;
  body?: string;
  category?: "SUPPORT" | "SALES" | "SCHEDULING" | "FIELD_CREW" | "GENERAL";
  variables?: string[];
  isShared?: boolean;
}

export interface ConversationThread {
  conversationSid: string;
  messages: {
    sid: string;
    index: number;
    author: string;
    body?: string;
    dateCreated: string;
    dateUpdated: string;
    delivery?: {
      total: number;
      sent: number;
      delivered: number;
      read: number;
      failed: number;
      undelivered: number;
    };
    attributes?: string;
    media?: {
      sid: string;
      size: number;
      content_type: string;
      filename?: string;
    }[];
  }[];
  participants: {
    sid: string;
    identity?: string;
    messagingBinding?: {
      type: "sms" | "whatsapp";
      address: string;
      proxyAddress?: string;
    };
    attributes?: string;
    roleSid?: string;
    lastReadMessageIndex?: number;
    lastReadTimestamp?: string;
  }[];
}

export interface FieldCrewMessageParams {
  contactIds: string[];
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
  mediaUrls?: string[];
}

export interface SalesRepMessageParams {
  contactIds: string[];
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
  mediaUrls?: string[];
}

// TaskRouter Types
export interface TaskRouterWebhookBase extends TwilioWebhookBase {
  WorkspaceSid: string;
  EventType: string;
  EventDescription: string;
  ResourceType: string;
  ResourceSid: string;
  Timestamp: string;
}

export interface WorkerWebhook extends TaskRouterWebhookBase {
  WorkerSid: string;
  WorkerName: string;
  WorkerAttributes: string;
  WorkerActivitySid: string;
  WorkerActivityName: string;
  WorkerTimeInPreviousActivity: string;
  EventType: "worker.created" | "worker.updated" | "worker.deleted" | "worker.activity.update";
}

export interface TaskWebhook extends TaskRouterWebhookBase {
  TaskSid: string;
  TaskQueueSid: string;
  TaskQueueName: string;
  TaskAttributes: string;
  TaskPriority: string;
  TaskAssignmentStatus: string;
  TaskAge: string;
  TaskTimeout: string;
  TaskChannelUniqueName: string;
  TaskChannelTaskChannelSid: string;
  TaskChannelTaskChannelFriendlyName: string;
  TaskChannelReservationSid: string;
  TaskChannelReservationAccepted: string;
  TaskChannelReservationRejected: string;
  TaskChannelReservationTimedOut: string;
  TaskChannelReservationCanceled: string;
  TaskChannelReservationRescinded: string;
  TaskChannelReservationCompleted: string;
  TaskChannelReservationWrapped: string;
  TaskChannelReservationTransferred: string;
  TaskChannelReservationTransferredFrom: string;
  TaskChannelReservationTransferredTo: string;
  TaskChannelReservationTransferredFromWorker: string;
  TaskChannelReservationTransferredToWorker: string;
  TaskChannelReservationTransferredFromQueue: string;
  TaskChannelReservationTransferredToQueue: string;
  TaskChannelReservationTransferredFromWorkflow: string;
  TaskChannelReservationTransferredToWorkflow: string;
  TaskChannelReservationTransferredFromTaskQueue: string;
  TaskChannelReservationTransferredToTaskQueue: string;
  TaskChannelReservationTransferredFromWorkerSid: string;
  TaskChannelReservationTransferredToWorkerSid: string;
  TaskChannelReservationTransferredFromQueueSid: string;
  TaskChannelReservationTransferredToQueueSid: string;
  TaskChannelReservationTransferredFromWorkflowSid: string;
  TaskChannelReservationTransferredToWorkflowSid: string;
  TaskChannelReservationTransferredFromTaskQueueSid: string;
  TaskChannelReservationTransferredToTaskQueueSid: string;
  EventType: "task.created" | "task.updated" | "task.deleted" | "task.canceled" | "task.completed" | "task.wrapup";
}

export interface ReservationWebhook extends TaskRouterWebhookBase {
  TaskSid: string;
  TaskQueueSid: string;
  TaskQueueName: string;
  TaskAttributes: string;
  TaskPriority: string;
  TaskAssignmentStatus: string;
  TaskAge: string;
  TaskTimeout: string;
  TaskChannelUniqueName: string;
  TaskChannelTaskChannelSid: string;
  TaskChannelTaskChannelFriendlyName: string;
  TaskChannelReservationSid: string;
  TaskChannelReservationAccepted: string;
  TaskChannelReservationRejected: string;
  TaskChannelReservationTimedOut: string;
  TaskChannelReservationCanceled: string;
  TaskChannelReservationRescinded: string;
  TaskChannelReservationCompleted: string;
  TaskChannelReservationWrapped: string;
  TaskChannelReservationTransferred: string;
  TaskChannelReservationTransferredFrom: string;
  TaskChannelReservationTransferredTo: string;
  TaskChannelReservationTransferredFromWorker: string;
  TaskChannelReservationTransferredToWorker: string;
  TaskChannelReservationTransferredFromQueue: string;
  TaskChannelReservationTransferredToQueue: string;
  TaskChannelReservationTransferredFromWorkflow: string;
  TaskChannelReservationTransferredToWorkflow: string;
  TaskChannelReservationTransferredFromTaskQueue: string;
  TaskChannelReservationTransferredToTaskQueue: string;
  TaskChannelReservationTransferredFromWorkerSid: string;
  TaskChannelReservationTransferredToWorkerSid: string;
  TaskChannelReservationTransferredFromQueueSid: string;
  TaskChannelReservationTransferredToQueueSid: string;
  TaskChannelReservationTransferredFromWorkflowSid: string;
  TaskChannelReservationTransferredToWorkflowSid: string;
  TaskChannelReservationTransferredFromTaskQueueSid: string;
  TaskChannelReservationTransferredToTaskQueueSid: string;
  EventType: "reservation.created" | "reservation.accepted" | "reservation.rejected" | "reservation.timeout" | "reservation.canceled" | "reservation.rescinded" | "reservation.completed" | "reservation.wrapup";
}

export interface WorkerAttributes {
  skills?: string[];
  department?: string;
  languages?: string[];
  timezone?: string;
  contact_uri?: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

export interface TaskAttributes {
  type?: "voice" | "sms" | "callback" | "support";
  priority?: "low" | "normal" | "high" | "urgent";
  customer_phone?: string;
  customer_name?: string;
  customer_id?: string;
  quickbase_id?: string;
  project_coordinator?: string;
  department?: string;
  keywords?: string[];
  call_sid?: string;
  message_sid?: string;
  transcription?: string;
  notes?: string;

  // Project coordinator routing attributes
  preferred_worker_sid?: string;        // Twilio worker SID to route to
  routing_type?: "project_coordinator" | "department" | "skills" | "default";

  [key: string]: any;
}

export interface RoutingCondition {
  type: "keyword" | "time" | "customer" | "phone" | "department" | "priority";
  operator: "equals" | "contains" | "starts_with" | "ends_with" | "regex" | "in" | "not_in" | "greater_than" | "less_than" | "between";
  value: any;
  field?: string;
}

export interface RoutingAction {
  type: "route_to_queue" | "route_to_worker" | "route_to_workflow" | "voicemail" | "hangup" | "transfer";
  target?: string;
  priority?: number;
  timeout?: number;
  attributes?: Record<string, any>;
}

export interface RoutingRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditions: RoutingCondition[];
  actions: RoutingAction[];
  workflowSid?: string;
  queueSid?: string;
}

export interface TaskCreateParams {
  taskQueueSid: string;
  workflowSid?: string;
  attributes: TaskAttributes;
  priority?: number;
  timeout?: number;
  taskChannel?: string;
}

export interface WorkerCreateParams {
  friendlyName: string;
  attributes: WorkerAttributes;
  activitySid?: string;
}

export interface WorkerUpdateParams {
  friendlyName?: string;
  attributes?: WorkerAttributes;
  activitySid?: string;
}

export interface ActivityCreateParams {
  friendlyName: string;
  available: boolean;
}

export interface TaskQueueCreateParams {
  friendlyName: string;
  targetWorkers?: string;
  maxReservedWorkers?: number;
  taskOrder?: "FIFO" | "LIFO";
}

export interface WorkflowCreateParams {
  friendlyName: string;
  configuration: string;
  taskTimeout?: number;
}

export interface ReservationAcceptParams {
  reservationSid: string;
  instruction?: string;
  dequeueFrom?: string;
  dequeuePostWorkActivitySid?: string;
  dequeueStatusCallbackUrl?: string;
  dequeueStatusCallbackEvent?: string[];
  dequeueStatusCallbackMethod?: "GET" | "POST";
  dequeueTimeout?: number;
  dequeueTo?: string;
  dequeueRecord?: boolean;
  dequeueTrim?: "trim-silence" | "do-not-trim";
  dequeueRecordingChannels?: "mono" | "dual";
  dequeueRecordingStatusCallback?: string;
  dequeueRecordingStatusCallbackMethod?: "GET" | "POST";
  dequeueRecordingStatusCallbackEvent?: string[];
  dequeueRecordingTrack?: "inbound" | "outbound" | "both";
  dequeueBeep?: "true" | "false";
  dequeueStartConferenceOnEnter?: boolean;
  dequeueEndConferenceOnExit?: boolean;
  dequeueWaitUrl?: string;
  dequeueWaitMethod?: "GET" | "POST";
  dequeueEarlyMedia?: boolean;
  dequeueMaxParticipants?: number;
  dequeueConferenceStatusCallback?: string;
  dequeueConferenceStatusCallbackMethod?: "GET" | "POST";
  dequeueConferenceStatusCallbackEvent?: string[];
  dequeueConferenceRecord?: boolean;
  dequeueConferenceTrim?: "trim-silence" | "do-not-trim";
  dequeueConferenceRecordingChannels?: "mono" | "dual";
  dequeueConferenceRecordingStatusCallback?: string;
  dequeueConferenceRecordingStatusCallbackMethod?: "GET" | "POST";
  dequeueConferenceRecordingStatusCallbackEvent?: string[];
  dequeueConferenceRecordingTrack?: "inbound" | "outbound" | "both";
  dequeueConferenceBeep?: "true" | "false";
  dequeueConferenceStartConferenceOnEnter?: boolean;
  dequeueConferenceEndConferenceOnExit?: boolean;
  dequeueConferenceWaitUrl?: string;
  dequeueConferenceWaitMethod?: "GET" | "POST";
  dequeueConferenceEarlyMedia?: boolean;
  dequeueConferenceMaxParticipants?: number;
  dequeueConferenceStatusCallback?: string;
  dequeueConferenceStatusCallbackMethod?: "GET" | "POST";
  dequeueConferenceStatusCallbackEvent?: string[];
  dequeueConferenceRecord?: boolean;
  dequeueConferenceTrim?: "trim-silence" | "do-not-trim";
  dequeueConferenceRecordingChannels?: "mono" | "dual";
  dequeueConferenceRecordingStatusCallback?: string;
  dequeueConferenceRecordingStatusCallbackMethod?: "GET" | "POST";
  dequeueConferenceRecordingStatusCallbackEvent?: string[];
  dequeueConferenceRecordingTrack?: "inbound" | "outbound" | "both";
  dequeueConferenceBeep?: "true" | "false";
  dequeueConferenceStartConferenceOnEnter?: boolean;
  dequeueConferenceEndConferenceOnExit?: boolean;
  dequeueConferenceWaitUrl?: string;
  dequeueConferenceWaitMethod?: "GET" | "POST";
  dequeueConferenceEarlyMedia?: boolean;
  dequeueConferenceMaxParticipants?: number;
}

export interface ReservationRejectParams {
  reservationSid: string;
  reason?: string;
}

export interface ReservationCompleteParams {
  reservationSid: string;
  instruction?: string;
}

export interface KeywordDetectionResult {
  keywords: string[];
  department?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  confidence: number;
}

export interface QuickbaseRoutingResult {
  customerId?: string;
  projectCoordinator?: string;
  department?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  customAttributes?: Record<string, any>;
}

export interface TimeBasedRoutingResult {
  isBusinessHours: boolean;
  isHoliday: boolean;
  nextBusinessDay?: Date;
  routingAction: "route_to_queue" | "voicemail" | "hangup" | "transfer";
  target?: string;
}

export interface SkillsBasedRoutingResult {
  requiredSkills: string[];
  availableWorkers: string[];
  bestMatch?: string;
  confidence: number;
}

export interface TaskRouterStats {
  activeWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  offlineWorkers: number;
  pendingTasks: number;
  assignedTasks: number;
  completedTasks: number;
  averageWaitTime: number;
  averageHandleTime: number;
}

export interface WorkerStats {
  workerSid: string;
  tasksCompleted: number;
  tasksAccepted: number;
  tasksRejected: number;
  averageHandleTime: number;
  totalTalkTime: number;
  totalIdleTime: number;
  lastActivityChange: Date;
}

export interface TaskQueueStats {
  taskQueueSid: string;
  tasksInQueue: number;
  averageWaitTime: number;
  longestWaitTime: number;
  tasksCompleted: number;
  tasksAbandoned: number;
  averageHandleTime: number;
}

export interface WorkflowStats {
  workflowSid: string;
  tasksCreated: number;
  tasksCompleted: number;
  tasksCanceled: number;
  averageWaitTime: number;
  averageHandleTime: number;
  successRate: number;
}


