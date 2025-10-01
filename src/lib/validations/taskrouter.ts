import { z } from "zod";

// Worker validation schemas
export const workerAttributesSchema = z.object({
  skills: z.array(z.string()).optional(),
  department: z.string().optional(),
  languages: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  contact_uri: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
}).catchall(z.any());

export const workerCreateSchema = z.object({
  friendlyName: z.string().min(1, "Friendly name is required"),
  attributes: workerAttributesSchema,
  activitySid: z.string().optional(),
});

export const workerUpdateSchema = z.object({
  friendlyName: z.string().min(1).optional(),
  attributes: workerAttributesSchema.optional(),
  activitySid: z.string().optional(),
});

export const workerActivityUpdateSchema = z.object({
  activitySid: z.string().min(1, "Activity SID is required"),
  reason: z.string().optional(),
});

// Task validation schemas
export const taskAttributesSchema = z.object({
  type: z.enum(["voice", "sms", "callback", "support"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  customer_phone: z.string().optional(),
  customer_name: z.string().optional(),
  customer_id: z.string().optional(),
  quickbase_id: z.string().optional(),
  project_coordinator: z.string().optional(),
  department: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  call_sid: z.string().optional(),
  message_sid: z.string().optional(),
  transcription: z.string().optional(),
  notes: z.string().optional(),
}).catchall(z.any());

export const taskCreateSchema = z.object({
  taskQueueSid: z.string().min(1, "Task queue SID is required"),
  workflowSid: z.string().optional(),
  attributes: taskAttributesSchema,
  priority: z.number().int().min(0).max(100).optional(),
  timeout: z.number().int().min(1).max(3600).optional(),
  taskChannel: z.string().optional(),
});

export const taskUpdateSchema = z.object({
  attributes: taskAttributesSchema.optional(),
  priority: z.number().int().min(0).max(100).optional(),
  assignmentStatus: z.enum(["PENDING", "ASSIGNED", "RESERVED", "ACCEPTED", "COMPLETED", "CANCELED", "TIMEOUT"]).optional(),
});

// Routing rule validation schemas
export const routingConditionSchema = z.object({
  type: z.enum(["keyword", "time", "customer", "phone", "department", "priority"]),
  operator: z.enum(["equals", "contains", "starts_with", "ends_with", "regex", "in", "not_in", "greater_than", "less_than", "between"]),
  value: z.any(),
  field: z.string().optional(),
});

export const routingActionSchema = z.object({
  type: z.enum(["route_to_queue", "route_to_worker", "route_to_workflow", "voicemail", "hangup", "transfer"]),
  target: z.string().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  timeout: z.number().int().min(1).max(3600).optional(),
  attributes: z.record(z.any()).optional(),
});

export const routingRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  description: z.string().optional(),
  priority: z.number().int().min(0).max(1000).default(0),
  enabled: z.boolean().default(true),
  conditions: z.array(routingConditionSchema).min(1, "At least one condition is required"),
  actions: z.array(routingActionSchema).min(1, "At least one action is required"),
  workflowSid: z.string().optional(),
  queueSid: z.string().optional(),
});

export const routingRuleUpdateSchema = routingRuleSchema.partial().omit({ conditions: true, actions: true }).extend({
  conditions: z.array(routingConditionSchema).optional(),
  actions: z.array(routingActionSchema).optional(),
});

// Activity validation schemas
export const activityCreateSchema = z.object({
  friendlyName: z.string().min(1, "Friendly name is required"),
  available: z.boolean().default(false),
});

export const activityUpdateSchema = z.object({
  friendlyName: z.string().min(1).optional(),
  available: z.boolean().optional(),
});

// Task queue validation schemas
export const taskQueueCreateSchema = z.object({
  friendlyName: z.string().min(1, "Friendly name is required"),
  targetWorkers: z.string().optional(),
  maxReservedWorkers: z.number().int().min(1).max(100).default(1),
  taskOrder: z.enum(["FIFO", "LIFO"]).default("FIFO"),
});

export const taskQueueUpdateSchema = z.object({
  friendlyName: z.string().min(1).optional(),
  targetWorkers: z.string().optional(),
  maxReservedWorkers: z.number().int().min(1).max(100).optional(),
  taskOrder: z.enum(["FIFO", "LIFO"]).optional(),
});

// Workflow validation schemas
export const workflowCreateSchema = z.object({
  friendlyName: z.string().min(1, "Friendly name is required"),
  configuration: z.string().min(1, "Configuration is required"),
  taskTimeout: z.number().int().min(1).max(3600).default(300),
});

export const workflowUpdateSchema = z.object({
  friendlyName: z.string().min(1).optional(),
  configuration: z.string().min(1).optional(),
  taskTimeout: z.number().int().min(1).max(3600).optional(),
});

// Reservation validation schemas
export const reservationAcceptSchema = z.object({
  reservationSid: z.string().min(1, "Reservation SID is required"),
  instruction: z.string().optional(),
  dequeueFrom: z.string().optional(),
  dequeuePostWorkActivitySid: z.string().optional(),
  dequeueStatusCallbackUrl: z.string().url().optional(),
  dequeueStatusCallbackEvent: z.array(z.string()).optional(),
  dequeueStatusCallbackMethod: z.enum(["GET", "POST"]).optional(),
  dequeueTimeout: z.number().int().min(1).max(3600).optional(),
  dequeueTo: z.string().optional(),
  dequeueRecord: z.boolean().optional(),
  dequeueTrim: z.enum(["trim-silence", "do-not-trim"]).optional(),
  dequeueRecordingChannels: z.enum(["mono", "dual"]).optional(),
  dequeueRecordingStatusCallback: z.string().url().optional(),
  dequeueRecordingStatusCallbackMethod: z.enum(["GET", "POST"]).optional(),
  dequeueRecordingStatusCallbackEvent: z.array(z.string()).optional(),
  dequeueRecordingTrack: z.enum(["inbound", "outbound", "both"]).optional(),
  dequeueBeep: z.enum(["true", "false"]).optional(),
  dequeueStartConferenceOnEnter: z.boolean().optional(),
  dequeueEndConferenceOnExit: z.boolean().optional(),
  dequeueWaitUrl: z.string().url().optional(),
  dequeueWaitMethod: z.enum(["GET", "POST"]).optional(),
  dequeueEarlyMedia: z.boolean().optional(),
  dequeueMaxParticipants: z.number().int().min(1).max(100).optional(),
});

export const reservationRejectSchema = z.object({
  reservationSid: z.string().min(1, "Reservation SID is required"),
  reason: z.string().optional(),
});

export const reservationCompleteSchema = z.object({
  reservationSid: z.string().min(1, "Reservation SID is required"),
  instruction: z.string().optional(),
});

// Keyword detection validation schemas
export const keywordDetectionSchema = z.object({
  text: z.string().min(1, "Text is required for keyword detection"),
  keywords: z.array(z.string()).optional(),
  department: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const keywordConfigSchema = z.object({
  keywords: z.array(z.string()).min(1, "At least one keyword is required"),
  department: z.string().min(1, "Department is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  confidence: z.number().min(0).max(1).default(0.8),
  regex: z.boolean().default(false),
});

// Time-based routing validation schemas
export const timeBasedRoutingSchema = z.object({
  timezone: z.string().default("America/New_York"),
  businessHours: z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    end: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    days: z.array(z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])).min(1),
  }),
  holidays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")).optional(),
  afterHoursAction: z.enum(["route_to_queue", "voicemail", "hangup", "transfer"]).default("voicemail"),
  afterHoursTarget: z.string().optional(),
});

// Skills-based routing validation schemas
export const skillsBasedRoutingSchema = z.object({
  requiredSkills: z.array(z.string()).min(1, "At least one skill is required"),
  preferredSkills: z.array(z.string()).optional(),
  minimumMatch: z.number().int().min(1).default(1),
  maxWorkers: z.number().int().min(1).max(100).default(10),
});

// Quickbase routing validation schemas
export const quickbaseRoutingSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  includeProjectCoordinator: z.boolean().default(true),
  includeDepartment: z.boolean().default(true),
  includePriority: z.boolean().default(true),
  customFields: z.array(z.string()).optional(),
});

// TaskRouter webhook validation schemas
export const taskRouterWebhookSchema = z.object({
  AccountSid: z.string(),
  WorkspaceSid: z.string(),
  EventType: z.string(),
  EventDescription: z.string(),
  ResourceType: z.string(),
  ResourceSid: z.string(),
  Timestamp: z.string(),
  ApiVersion: z.string().optional(),
});

export const workerWebhookSchema = taskRouterWebhookSchema.extend({
  WorkerSid: z.string(),
  WorkerName: z.string(),
  WorkerAttributes: z.string(),
  WorkerActivitySid: z.string(),
  WorkerActivityName: z.string(),
  WorkerTimeInPreviousActivity: z.string(),
});

export const taskWebhookSchema = taskRouterWebhookSchema.extend({
  TaskSid: z.string(),
  TaskQueueSid: z.string(),
  TaskQueueName: z.string(),
  TaskAttributes: z.string(),
  TaskPriority: z.string(),
  TaskAssignmentStatus: z.string(),
  TaskAge: z.string(),
  TaskTimeout: z.string(),
  TaskChannelUniqueName: z.string(),
  TaskChannelTaskChannelSid: z.string(),
  TaskChannelTaskChannelFriendlyName: z.string(),
  TaskChannelReservationSid: z.string(),
});

export const reservationWebhookSchema = taskRouterWebhookSchema.extend({
  TaskSid: z.string(),
  TaskQueueSid: z.string(),
  TaskQueueName: z.string(),
  TaskAttributes: z.string(),
  TaskPriority: z.string(),
  TaskAssignmentStatus: z.string(),
  TaskAge: z.string(),
  TaskTimeout: z.string(),
  TaskChannelUniqueName: z.string(),
  TaskChannelTaskChannelSid: z.string(),
  TaskChannelTaskChannelFriendlyName: z.string(),
  TaskChannelReservationSid: z.string(),
});

// Query parameter validation schemas
export const workerQuerySchema = z.object({
  activity: z.string().optional(),
  available: z.enum(["true", "false"]).optional(),
  skills: z.string().optional(),
  department: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const taskQuerySchema = z.object({
  status: z.enum(["PENDING", "ASSIGNED", "RESERVED", "ACCEPTED", "COMPLETED", "CANCELED", "TIMEOUT"]).optional(),
  workerId: z.string().optional(),
  queueId: z.string().optional(),
  type: z.enum(["voice", "sms", "callback", "support"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const routingRuleQuerySchema = z.object({
  enabled: z.enum(["true", "false"]).optional(),
  priority: z.coerce.number().int().min(0).max(1000).optional(),
  workflowSid: z.string().optional(),
  queueSid: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Test routing rule validation schema
export const testRoutingRuleSchema = z.object({
  phoneNumber: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  time: z.string().datetime().optional(),
  customerData: z.record(z.any()).optional(),
  taskAttributes: taskAttributesSchema.optional(),
});

// Routing rules test endpoint validation schema
export const routingRulesTestSchema = z.object({
  phoneNumber: z.string().optional(),
  text: z.string().optional(),
  callSid: z.string().optional(),
  messageSid: z.string().optional(),
  attributes: taskAttributesSchema,
});

// Worker token generation validation schema
export const workerTokenSchema = z.object({
  workerSid: z.string().min(1, "Worker SID is required"),
  ttl: z.number().int().min(60).max(3600).default(3600),
  permissions: z.array(z.enum(["worker", "task", "reservation"])).default(["worker", "task", "reservation"]),
});

// Type exports
export type WorkerCreateInput = z.infer<typeof workerCreateSchema>;
export type WorkerUpdateInput = z.infer<typeof workerUpdateSchema>;
export type WorkerActivityUpdateInput = z.infer<typeof workerActivityUpdateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type RoutingRuleInput = z.infer<typeof routingRuleSchema>;
export type RoutingRuleUpdateInput = z.infer<typeof routingRuleUpdateSchema>;
export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>;
export type TaskQueueCreateInput = z.infer<typeof taskQueueCreateSchema>;
export type TaskQueueUpdateInput = z.infer<typeof taskQueueUpdateSchema>;
export type WorkflowCreateInput = z.infer<typeof workflowCreateSchema>;
export type WorkflowUpdateInput = z.infer<typeof workflowUpdateSchema>;
export type ReservationAcceptInput = z.infer<typeof reservationAcceptSchema>;
export type ReservationRejectInput = z.infer<typeof reservationRejectSchema>;
export type ReservationCompleteInput = z.infer<typeof reservationCompleteSchema>;
export type KeywordDetectionInput = z.infer<typeof keywordDetectionSchema>;
export type KeywordConfigInput = z.infer<typeof keywordConfigSchema>;
export type TimeBasedRoutingInput = z.infer<typeof timeBasedRoutingSchema>;
export type SkillsBasedRoutingInput = z.infer<typeof skillsBasedRoutingSchema>;
export type QuickbaseRoutingInput = z.infer<typeof quickbaseRoutingSchema>;
export type WorkerQueryInput = z.infer<typeof workerQuerySchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
export type RoutingRuleQueryInput = z.infer<typeof routingRuleQuerySchema>;
export type TestRoutingRuleInput = z.infer<typeof testRoutingRuleSchema>;
export type RoutingRulesTestInput = z.infer<typeof routingRulesTestSchema>;
export type WorkerTokenInput = z.infer<typeof workerTokenSchema>;
