import { z } from "zod";

// Contact type enum validation
export const contactTypeSchema = z.enum(["CUSTOMER", "FIELD_CREW", "SALES_REP", "VENDOR"]);

// Enhanced enum validations for Master Requirements Document
export const projectStatusSchema = z.enum(["PRE_PTO", "POST_PTO"]);
export const statusCategorySchema = z.enum(["ACTIVE", "INACTIVE"]);
export const contactSectionTypeSchema = z.enum(["CUSTOMERS", "EMPLOYEES"]);

// Phone number validation (supports various formats)
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(32, "Phone number must be less than 32 characters")
  .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format");

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .optional()
  .or(z.literal(""));

// Base contact schema
export const contactSchema = z.object({
  organization: z.string().optional(),
  firstName: z.string().min(1, "First name is required").max(100, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),
  phone: phoneSchema,
  email: emailSchema,
  type: contactTypeSchema,
  department: z.string().max(100, "Department name too long").optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  tags: z.array(z.string().max(50, "Tag too long")).max(10, "Too many tags").default([]),
  quickbaseId: z.string().max(100, "QuickBase ID too long").optional(),
  isFavorite: z.boolean().default(false),
  groupIds: z.array(z.string()).optional(),
  
  // Enhanced fields for Master Requirements Document
  projectStatus: projectStatusSchema.optional(),
  statusCategory: statusCategorySchema.default("ACTIVE"),
  isStale: z.boolean().default(false),
  
  // SLA tracking fields
  lastContactDate: z.string().datetime().optional(),
  lastContactBy: z.string().optional(),
  lastContactDepartment: z.string().max(100).optional(),
  lastContactType: z.string().max(50).optional(),
  voicemailCallbackDue: z.string().datetime().optional(),
  textResponseDue: z.string().datetime().optional(),
  missedCallFollowupDue: z.string().datetime().optional(),
  unreadCount: z.number().int().min(0).default(0),
  
  // Project Coordinator assignment
  projectCoordinatorId: z.string().optional(),
});

// Contact creation schema
export const createContactSchema = contactSchema;

// Contact update schema (all fields optional except id)
export const updateContactSchema = contactSchema.partial();

// Contact search/filter schema
export const contactSearchSchema = z.object({
  search: z.string().optional(),
  type: contactTypeSchema.optional(),
  department: z.string().optional(),
  isFavorite: z.boolean().optional(),
  groupId: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["firstName", "lastName", "phone", "email", "type", "department", "createdAt", "projectStatus", "statusCategory", "lastContactDate", "projectCoordinatorId"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  
  // Enhanced search parameters
  sectionType: contactSectionTypeSchema.optional(),
  projectStatus: projectStatusSchema.optional(),
  statusCategory: statusCategorySchema.optional(),
  isStale: z.boolean().optional(),
  projectCoordinatorId: z.string().optional(),
  slaViolation: z.boolean().optional(),
  lastContactDateFrom: z.string().datetime().optional(),
  lastContactDateTo: z.string().datetime().optional(),
});

// Contact group schema
export const contactGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Group name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

// Contact group update schema with optional membership mutations
export const contactGroupUpdateSchema = z.object({
  name: z.string().max(100, "Group name too long").optional(),
  description: z.string().max(500, "Description too long").optional(),
  addContactIds: z.array(z.string()).optional(),
  removeContactIds: z.array(z.string()).optional(),
});

// CSV import validation schema
export const csvContactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: phoneSchema,
  email: emailSchema,
  organization: z.string().optional(),
  type: contactTypeSchema.default("CUSTOMER"),
  department: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  quickbaseId: z.string().optional(),
  isFavorite: z.boolean().default(false),
});

// CSV import result schema
export const csvImportResultSchema = z.object({
  success: z.boolean(),
  imported: z.number(),
  errors: z.array(z.string()),
  duplicates: z.number(),
});

// Call initiation schema
export const callContactSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
});

// SMS sending schema
export const smsContactSchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
  message: z.string().min(1, "Message is required").max(1600, "Message too long"),
});

// Enhanced contact management validation schemas
export const stalenessRulesSchema = z.object({
  activeTimeoutMonths: z.number().int().min(1).max(24).default(6),
  holdTimeoutMonths: z.number().int().min(1).max(24).default(3),
  enabled: z.boolean().default(true),
});

export const statusMappingsSchema = z.object({
  activeStatuses: z.array(z.string().max(50)).default([]),
  inactiveStatuses: z.array(z.string().max(50)).default([]),
});

export const slaSettingsSchema = z.object({
  voicemailCallback: z.object({
    sameDayBefore3PM: z.boolean().default(true),
    nextBusinessDayAfter: z.boolean().default(true),
    enabled: z.boolean().default(true),
  }),
  textResponse: z.object({
    businessHoursMinutes: z.number().int().min(5).max(1440).default(30),
    afterHoursNextDay9AM: z.boolean().default(true),
    enabled: z.boolean().default(true),
  }),
  missedCallFollowup: z.object({
    hours: z.number().int().min(1).max(24).default(1),
    enabled: z.boolean().default(true),
  }),
});

export const contactConfigurationSchema = z.object({
  name: z.string().min(1, "Configuration name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  stalenessRules: stalenessRulesSchema,
  statusMappings: statusMappingsSchema,
  slaSettings: slaSettingsSchema,
  isActive: z.boolean().default(true),
});

export const contactConfigurationUpdateSchema = contactConfigurationSchema.partial();

// Customer contact schema (extends base contact)
export const customerContactSchema = contactSchema.extend({
  type: z.literal("CUSTOMER"),
  projectStatus: projectStatusSchema,
  projectCoordinatorId: z.string().min(1, "Project Coordinator is required for customers"),
});

// Employee contact schema (extends base contact)
export const employeeContactSchema = contactSchema.extend({
  type: z.enum(["FIELD_CREW", "SALES_REP", "VENDOR"]),
  role: z.string().max(100).optional(),
  department: z.string().min(1, "Department is required for employees").max(100),
  isAvailable: z.boolean().default(true),
});

// SLA status schema
export const slaStatusSchema = z.object({
  type: z.enum(["voicemail_callback", "text_response", "missed_call_followup"]),
  status: z.enum(["on_time", "approaching", "violated"]),
  dueDate: z.string().datetime(),
  timeRemaining: z.string().optional(),
  isOverdue: z.boolean(),
  minutesOverdue: z.number().int().min(0).optional(),
  minutesRemaining: z.number().int().min(0).optional(),
});

export const contactSLAStatusSchema = z.object({
  contactId: z.string(),
  voicemailCallback: slaStatusSchema.optional(),
  textResponse: slaStatusSchema.optional(),
  missedCallFollowup: slaStatusSchema.optional(),
  hasViolations: z.boolean(),
  hasApproaching: z.boolean(),
  totalViolations: z.number().int().min(0),
});

// Bulk operations schema
export const contactBulkActionSchema = z.object({
  action: z.enum(["update_status", "assign_pc", "mark_stale", "update_sla", "delete"]),
  contactIds: z.array(z.string()).min(1, "At least one contact ID is required"),
  data: z.record(z.any()).optional(), // Additional data for the action
});

// QuickBase sync schema
export const quickbaseSyncSchema = z.object({
  syncType: z.enum(["full", "incremental"]).default("incremental"),
  customerIds: z.array(z.string()).optional(), // Specific customer IDs to sync
  forceUpdate: z.boolean().default(false),
});

// Type exports for use in API routes
export type ContactInput = z.infer<typeof contactSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactSearchInput = z.infer<typeof contactSearchSchema>;
export type ContactGroupInput = z.infer<typeof contactGroupSchema>;
export type CsvContactInput = z.infer<typeof csvContactSchema>;
export type CsvImportResult = z.infer<typeof csvImportResultSchema>;
export type CallContactInput = z.infer<typeof callContactSchema>;
export type SmsContactInput = z.infer<typeof smsContactSchema>;
export type ContactGroupUpdateInput = z.infer<typeof contactGroupUpdateSchema>;

// Enhanced contact management type exports
export type StalenessRulesInput = z.infer<typeof stalenessRulesSchema>;
export type StatusMappingsInput = z.infer<typeof statusMappingsSchema>;
export type SLASettingsInput = z.infer<typeof slaSettingsSchema>;
export type ContactConfigurationInput = z.infer<typeof contactConfigurationSchema>;
export type ContactConfigurationUpdateInput = z.infer<typeof contactConfigurationUpdateSchema>;
export type CustomerContactInput = z.infer<typeof customerContactSchema>;
export type EmployeeContactInput = z.infer<typeof employeeContactSchema>;
export type SLAStatusInput = z.infer<typeof slaStatusSchema>;
export type ContactSLAStatusInput = z.infer<typeof contactSLAStatusSchema>;
export type ContactBulkActionInput = z.infer<typeof contactBulkActionSchema>;
export type QuickBaseSyncInput = z.infer<typeof quickbaseSyncSchema>;
