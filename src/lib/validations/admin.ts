import { z } from "zod"

// User Management Schemas
export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "supervisor", "agent", "viewer"]),
  department: z.string().optional(),
  skills: z.array(z.string()).optional(),
  phoneNumber: z.string().optional(),
  quickbaseUserId: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = createUserSchema.partial()

export const userRoleSchema = z.enum(["admin", "supervisor", "agent", "viewer"])

// Phone Number Management Schemas
export const phoneNumberSearchSchema = z.object({
  areaCode: z.string().length(3, "Area code must be 3 digits").optional(),
  contains: z.string().optional(),
  nearLatLong: z.string().optional(),
  nearNumber: z.string().optional(),
  nearPostalCode: z.string().optional(),
  nearRegion: z.string().optional(),
  inRegion: z.string().optional(),
  inPostalCode: z.string().optional(),
  inLata: z.string().optional(),
  inRateCenter: z.string().optional(),
  inLocality: z.string().optional(),
  faxEnabled: z.boolean().optional(),
  mmsEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  voiceEnabled: z.boolean().optional(),
  excludeAllAddressRequired: z.boolean().optional(),
  excludeForeignAddressRequired: z.boolean().optional(),
  excludeLocalAddressRequired: z.boolean().optional(),
  beta: z.boolean().optional(),
  nearNumber: z.string().optional(),
  distance: z.number().optional(),
  limit: z.number().min(1).max(1000).default(20),
})

export const purchasePhoneNumberSchema = z.object({
  phoneNumber: z.string().regex(/^\+1[0-9]{10}$/, "Invalid phone number format"),
  friendlyName: z.string().optional(),
  voiceUrl: z.string().url("Invalid voice webhook URL").optional(),
  smsUrl: z.string().url("Invalid SMS webhook URL").optional(),
  statusCallback: z.string().url("Invalid status callback URL").optional(),
  voiceMethod: z.enum(["GET", "POST"]).default("POST"),
  smsMethod: z.enum(["GET", "POST"]).default("POST"),
  statusCallbackMethod: z.enum(["GET", "POST"]).default("POST"),
})

export const updatePhoneNumberSchema = z.object({
  friendlyName: z.string().optional(),
  voiceUrl: z.string().url("Invalid voice webhook URL").optional(),
  smsUrl: z.string().url("Invalid SMS webhook URL").optional(),
  statusCallback: z.string().url("Invalid status callback URL").optional(),
  voiceMethod: z.enum(["GET", "POST"]).optional(),
  smsMethod: z.enum(["GET", "POST"]).optional(),
  statusCallbackMethod: z.enum(["GET", "POST"]).optional(),
})

// Business Hours Schemas
export const timeSlotSchema = z.object({
  start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
})

export const dayScheduleSchema = z.object({
  isOpen: z.boolean(),
  timeSlots: z.array(timeSlotSchema).optional(),
})

export const weeklyScheduleSchema = z.object({
  monday: dayScheduleSchema,
  tuesday: dayScheduleSchema,
  wednesday: dayScheduleSchema,
  thursday: dayScheduleSchema,
  friday: dayScheduleSchema,
  saturday: dayScheduleSchema,
  sunday: dayScheduleSchema,
})

export const holidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  isOpen: z.boolean(),
  timeSlots: z.array(timeSlotSchema).optional(),
})

export const businessHoursSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  weeklySchedule: weeklyScheduleSchema,
  holidays: z.array(holidaySchema).optional(),
  specialHours: z.array(z.object({
    name: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    schedule: weeklyScheduleSchema,
  })).optional(),
})

// IVR Menu Schemas
export const ivrActionSchema = z.object({
  type: z.enum(["transfer", "hangup", "voicemail", "queue", "menu"]),
  target: z.string().optional(),
  queueSid: z.string().optional(),
  menuId: z.string().optional(),
  message: z.string().optional(),
})

export const ivrOptionSchema = z.object({
  digit: z.string().length(1, "Option must be a single digit"),
  action: ivrActionSchema,
  description: z.string().optional(),
})

export const ivrMenuSchema = z.object({
  name: z.string().min(1, "Menu name is required"),
  greeting: z.string().min(1, "Greeting message is required"),
  timeout: z.number().min(1).max(30).default(10),
  maxRetries: z.number().min(1).max(5).default(3),
  options: z.array(ivrOptionSchema).max(9, "Maximum 9 options allowed"),
  timeoutAction: ivrActionSchema,
  invalidAction: ivrActionSchema,
  isActive: z.boolean().default(true),
})

export const createIVRMenuSchema = ivrMenuSchema

export const updateIVRMenuSchema = ivrMenuSchema.partial()

// System Settings Schemas
export const routingSettingsSchema = z.object({
  defaultQueue: z.string().optional(),
  fallbackQueue: z.string().optional(),
  maxWaitTime: z.number().min(1).default(300),
  priorityRouting: z.boolean().default(false),
  skillBasedRouting: z.boolean().default(true),
})

export const voicemailSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  timeout: z.number().min(5).max(60).default(30),
  greetingMessage: z.string().optional(),
  transcriptionEnabled: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
})

export const recordingSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  recordFromAnswer: z.boolean().default(true),
  trimSilence: z.boolean().default(false),
  channels: z.enum(["mono", "dual"]).default("mono"),
})

export const notificationSettingsSchema = z.object({
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  webhookEnabled: z.boolean().default(false),
  webhookUrl: z.string().url("Invalid webhook URL").optional(),
  adminEmail: z.string().email("Invalid admin email").optional(),
})

export const systemSettingsSchema = z.object({
  routing: routingSettingsSchema,
  voicemail: voicemailSettingsSchema,
  recording: recordingSettingsSchema,
  notifications: notificationSettingsSchema,
  maintenanceMode: z.boolean().default(false),
  debugMode: z.boolean().default(false),
})

// Query Parameter Schemas
export const userQuerySchema = z.object({
  role: userRoleSchema.optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export const phoneNumberQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  capability: z.enum(["voice", "sms", "mms", "fax"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Admin Permission Schemas
export const adminPermissionSchema = z.object({
  canManageUsers: z.boolean().default(false),
  canManagePhoneNumbers: z.boolean().default(false),
  canManageRoutingRules: z.boolean().default(false),
  canManageBusinessHours: z.boolean().default(false),
  canManageIVR: z.boolean().default(false),
  canManageSystemSettings: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(false),
  canManageIntegrations: z.boolean().default(false),
})

export const updateAdminPermissionSchema = adminPermissionSchema.partial()

// Export types
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserRole = z.infer<typeof userRoleSchema>
export type PhoneNumberSearchInput = z.infer<typeof phoneNumberSearchSchema>
export type PurchasePhoneNumberInput = z.infer<typeof purchasePhoneNumberSchema>
export type UpdatePhoneNumberInput = z.infer<typeof updatePhoneNumberSchema>
export type TimeSlot = z.infer<typeof timeSlotSchema>
export type DaySchedule = z.infer<typeof dayScheduleSchema>
export type WeeklySchedule = z.infer<typeof weeklyScheduleSchema>
export type Holiday = z.infer<typeof holidaySchema>
export type BusinessHours = z.infer<typeof businessHoursSchema>
export type IVRAction = z.infer<typeof ivrActionSchema>
export type IVROption = z.infer<typeof ivrOptionSchema>
export type IVRMenu = z.infer<typeof ivrMenuSchema>
export type CreateIVRMenuInput = z.infer<typeof createIVRMenuSchema>
export type UpdateIVRMenuInput = z.infer<typeof updateIVRMenuSchema>
export type RoutingSettings = z.infer<typeof routingSettingsSchema>
export type VoicemailSettings = z.infer<typeof voicemailSettingsSchema>
export type RecordingSettings = z.infer<typeof recordingSettingsSchema>
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>
export type SystemSettings = z.infer<typeof systemSettingsSchema>
export type UserQuery = z.infer<typeof userQuerySchema>
export type PhoneNumberQuery = z.infer<typeof phoneNumberQuerySchema>
export type AdminPermission = z.infer<typeof adminPermissionSchema>
export type UpdateAdminPermissionInput = z.infer<typeof updateAdminPermissionSchema>
