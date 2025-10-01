import { z } from "zod";

// Phone number validation (relaxed for Twilio formats)
export const quickbasePhoneSchema = z
  .string()
  .min(8, "Phone number must be at least 8 digits")
  .max(32, "Phone number must be less than 32 characters")
  .regex(/^[\+\-\(\)\s\d]+$/, "Phone number contains invalid characters")
  .transform((val) => {
    // Normalize phone number by removing non-digit characters except +
    const normalized = val.replace(/[^\d\+]/g, '');
    return normalized;
  });

// Email validation for Project Coordinators (relaxed)
export const quickbaseEmailSchema = z
  .string()
  .min(1, "Email is required")
  .max(255, "Email too long")
  .refine((val) => {
    // More permissive email validation that allows various formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(val);
  }, "Invalid email format");

// Customer lookup request schema
export const customerLookupSchema = z.object({
  phone: quickbasePhoneSchema.optional(),
  email: quickbaseEmailSchema.optional(),
  customerId: z.string().min(1, "Customer ID is required").optional(),
}).refine(
  (data) => data.phone || data.email || data.customerId,
  {
    message: "At least one lookup parameter (phone, email, or customerId) is required",
  }
);

// Project Coordinator lookup schema
export const projectCoordinatorLookupSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required").optional(),
  email: quickbaseEmailSchema.optional(),
  pcId: z.string().min(1, "Project Coordinator ID is required").optional(),
}).refine(
  (data) => data.customerId || data.email || data.pcId,
  {
    message: "At least one lookup parameter is required",
  }
);

// Communication activity logging schema
export const communicationLogSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  type: z.enum(["call", "sms", "voicemail", "email"], {
    errorMap: () => ({ message: "Invalid communication type" }),
  }),
  direction: z.enum(["inbound", "outbound"], {
    errorMap: () => ({ message: "Invalid communication direction" }),
  }),
  duration: z.number().int().min(0).optional(),
  agentId: z.string().optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
  recordingUrl: z.string().url("Invalid recording URL").optional(),
  status: z.enum(["completed", "failed", "missed"], {
    errorMap: () => ({ message: "Invalid communication status" }),
  }),
  timestamp: z.date().optional().default(() => new Date()),
});

// Project status query schema
export const projectStatusSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
});

// Customer data update schema
export const customerUpdateSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  name: z.string().min(1, "Name is required").max(255, "Name too long").optional(),
  phone: quickbasePhoneSchema.optional(),
  email: quickbaseEmailSchema.optional(),
  address: z.string().max(500, "Address too long").optional(),
  projectCoordinatorId: z.string().optional(),
  projectStatus: z.string().max(100, "Project status too long").optional(),
  notes: z.string().max(2000, "Notes too long").optional(),
});

// Batch communication logging schema
export const batchCommunicationLogSchema = z.object({
  communications: z.array(communicationLogSchema).min(1, "At least one communication is required").max(100, "Too many communications"),
});

// Quickbase webhook payload schema
export const quickbaseWebhookSchema = z.object({
  tableId: z.string().min(1, "Table ID is required"),
  recordId: z.string().min(1, "Record ID is required"),
  action: z.enum(["create", "update", "delete"], {
    errorMap: () => ({ message: "Invalid webhook action" }),
  }),
  timestamp: z.string().datetime("Invalid timestamp format"),
  data: z.record(z.unknown()).optional(),
});

// Customer context data schema
export const customerContextSchema = z.object({
  customer: z.object({
    id: z.string(),
    name: z.string(),
    phone: quickbasePhoneSchema,
    email: quickbaseEmailSchema.optional(),
    address: z.string().optional(),
    projectCoordinatorId: z.string().optional(),
    projectStatus: z.string().optional(),
    lastContact: z.date().optional(),
    communicationCount: z.number().int().min(0).optional(),
  }),
  projectCoordinator: z.object({
    id: z.string(),
    name: z.string(),
    email: quickbaseEmailSchema,
    phone: quickbasePhoneSchema.optional(),
    availability: z.enum(["available", "busy", "offline"]),
    assignedCustomers: z.array(z.string()),
    workload: z.number().int().min(0),
  }).optional(),
  project: z.object({
    id: z.string(),
    customerId: z.string(),
    status: z.string(),
    stage: z.string(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    milestones: z.array(z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(["pending", "in_progress", "completed"]),
      dueDate: z.date().optional(),
      completedDate: z.date().optional(),
    })),
    coordinatorId: z.string().optional(),
  }).optional(),
});

// Sync request schema
export const syncRequestSchema = z.object({
  type: z.enum(["full", "incremental"], {
    errorMap: () => ({ message: "Invalid sync type" }),
  }),
  lastSync: z.date().optional(),
  customerIds: z.array(z.string()).optional(),
  force: z.boolean().default(false),
});

// Iframe configuration schema
export const iframeConfigSchema = z.object({
  customerId: z.string().optional(),
  recordId: z.string().optional(),
  tableId: z.string().optional(),
  viewId: z.string().optional(),
  embed: z.boolean().default(true),
  width: z.string().default("100%"),
  height: z.string().default("600px"),
});

// Field mapping validation schema
export const fieldMappingSchema = z.object({
  customerPhone: z.number().int().positive("Invalid field ID"),
  projectCoordinator: z.number().int().positive("Invalid field ID"),
  projectStatus: z.number().int().positive("Invalid field ID"),
  customerName: z.number().int().positive("Invalid field ID").optional(),
  customerEmail: z.number().int().positive("Invalid field ID").optional(),
  customerAddress: z.number().int().positive("Invalid field ID").optional(),
  lastContact: z.number().int().positive("Invalid field ID").optional(),
});

// API response schemas
export const quickbaseApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.date().default(() => new Date()),
});

// Error response schema
export const quickbaseErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  timestamp: z.date().default(() => new Date()),
});

// Type exports for use in API routes and services
export type CustomerLookupInput = z.infer<typeof customerLookupSchema>;
export type ProjectCoordinatorLookupInput = z.infer<typeof projectCoordinatorLookupSchema>;
export type CommunicationLogInput = z.infer<typeof communicationLogSchema>;
export type ProjectStatusInput = z.infer<typeof projectStatusSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
export type BatchCommunicationLogInput = z.infer<typeof batchCommunicationLogSchema>;
export type QuickbaseWebhookInput = z.infer<typeof quickbaseWebhookSchema>;
export type CustomerContextInput = z.infer<typeof customerContextSchema>;
export type SyncRequestInput = z.infer<typeof syncRequestSchema>;
export type IframeConfigInput = z.infer<typeof iframeConfigSchema>;
export type FieldMappingInput = z.infer<typeof fieldMappingSchema>;
export type QuickbaseApiResponse = z.infer<typeof quickbaseApiResponseSchema>;
export type QuickbaseError = z.infer<typeof quickbaseErrorSchema>;
