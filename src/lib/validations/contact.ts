import { z } from "zod";

// Contact type enum validation
export const contactTypeSchema = z.enum(["CUSTOMER", "FIELD_CREW", "SALES_REP", "VENDOR"]);

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
  sortBy: z.enum(["firstName", "lastName", "phone", "email", "type", "department", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
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
