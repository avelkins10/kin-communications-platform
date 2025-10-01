import { z } from "zod";
import { normalizePhoneNumber, validatePhoneNumber } from "@/lib/utils/phone";

// Message direction enum validation
export const messageDirectionSchema = z.enum(["INBOUND", "OUTBOUND"]);

// Message status enum validation
export const messageStatusSchema = z.enum(["QUEUED", "SENT", "DELIVERED", "READ", "FAILED", "UNDELIVERED", "RECEIVED"]);

// Template category enum validation
export const templateCategorySchema = z.enum(["SUPPORT", "SALES", "SCHEDULING", "FIELD_CREW", "GENERAL"]);

// Phone number validation with E.164 normalization
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .refine((phone) => validatePhoneNumber(phone), {
    message: "Invalid phone number format"
  })
  .transform((phone) => {
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) {
      throw new Error("Invalid phone number format");
    }
    return normalized;
  });

// Media URL validation
export const mediaUrlSchema = z
  .string()
  .url("Invalid media URL format")
  .max(2000, "Media URL too long");

// Message body validation with SMS length considerations
export const messageBodySchema = z
  .string()
  .min(1, "Message body is required")
  .max(1600, "Message too long (max 1600 characters for multi-part SMS)");

// Message creation schema
export const createMessageSchema = z.object({
  toNumber: phoneSchema.optional(),
  body: messageBodySchema,
  mediaUrls: z.array(mediaUrlSchema).max(10, "Too many media attachments").optional(),
  contactId: z.string().optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
}).refine((data) => {
  // Either toNumber or contactId must be provided
  return data.toNumber || data.contactId;
}, {
  message: "Either toNumber or contactId must be provided",
  path: ["toNumber", "contactId"],
});

// Bulk message creation schema
export const createBulkMessageSchema = z.object({
  contactIds: z.array(z.string().min(1, "Contact ID is required")).min(1, "At least one contact is required").max(100, "Too many contacts for bulk message"),
  body: messageBodySchema,
  mediaUrls: z.array(mediaUrlSchema).max(10, "Too many media attachments").optional(),
  templateId: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

// Message update schema
export const updateMessageSchema = z.object({
  status: messageStatusSchema.optional(),
  readAt: z.date().optional(),
  errorCode: z.string().max(50).optional(),
  errorMessage: z.string().max(500).optional(),
});

// Message search/filter schema
export const messageSearchSchema = z.object({
  contactId: z.string().optional(),
  direction: messageDirectionSchema.optional(),
  status: messageStatusSchema.optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "sentAt", "deliveredAt", "status", "direction"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Conversation search schema
export const conversationSearchSchema = z.object({
  contactType: z.enum(["CUSTOMER", "FIELD_CREW", "SALES_REP", "VENDOR"]).optional(),
  unreadOnly: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["lastActivityAt", "unreadCount", "messageCount"]).default("lastActivityAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Message template creation schema
export const createMessageTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100, "Template name too long"),
  body: messageBodySchema,
  category: templateCategorySchema,
  variables: z.array(z.string().max(50, "Variable name too long")).max(20, "Too many variables").default([]),
  isShared: z.boolean().default(false),
});

// Message template update schema
export const updateMessageTemplateSchema = z.object({
  name: z.string().max(100, "Template name too long").optional(),
  body: messageBodySchema.optional(),
  category: templateCategorySchema.optional(),
  variables: z.array(z.string().max(50, "Variable name too long")).max(20, "Too many variables").optional(),
  isShared: z.boolean().optional(),
});

// Message template search schema
export const messageTemplateSearchSchema = z.object({
  category: templateCategorySchema.optional(),
  search: z.string().optional(),
  isShared: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "category", "usageCount", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Webhook validation schemas
export const smsWebhookSchema = z.object({
  MessageSid: z.string(),
  From: z.string(),
  To: z.string(),
  Body: z.string().optional(),
  NumMedia: z.string().optional(),
  MediaUrl0: z.string().optional(),
  MediaUrl1: z.string().optional(),
  MediaUrl2: z.string().optional(),
  MediaUrl3: z.string().optional(),
  MediaUrl4: z.string().optional(),
  MediaUrl5: z.string().optional(),
  MediaUrl6: z.string().optional(),
  MediaUrl7: z.string().optional(),
  MediaUrl8: z.string().optional(),
  MediaUrl9: z.string().optional(),
  MediaContentType0: z.string().optional(),
  MediaContentType1: z.string().optional(),
  MediaContentType2: z.string().optional(),
  MediaContentType3: z.string().optional(),
  MediaContentType4: z.string().optional(),
  MediaContentType5: z.string().optional(),
  MediaContentType6: z.string().optional(),
  MediaContentType7: z.string().optional(),
  MediaContentType8: z.string().optional(),
  MediaContentType9: z.string().optional(),
  SmsStatus: z.string().optional(),
  SmsSid: z.string().optional(),
  SmsMessageSid: z.string().optional(),
  MessageStatus: z.string().optional(),
  MessagingServiceSid: z.string().optional(),
  ApiVersion: z.string().optional(),
});

export const messageStatusWebhookSchema = z.object({
  MessageSid: z.string(),
  MessageStatus: z.enum(["queued", "sending", "sent", "receiving", "received", "delivered", "undelivered", "failed"]),
  To: z.string(),
  From: z.string(),
  Body: z.string().optional(),
  NumSegments: z.string().optional(),
  NumMedia: z.string().optional(),
  ErrorCode: z.string().optional(),
  ErrorMessage: z.string().optional(),
  Price: z.string().optional(),
  PriceUnit: z.string().optional(),
  SmsSid: z.string().optional(),
  SmsMessageSid: z.string().optional(),
  MessagingServiceSid: z.string().optional(),
  ApiVersion: z.string().optional(),
  Timestamp: z.string().optional(),
});

// Field crew messaging schema
export const fieldCrewMessageSchema = z.object({
  contactIds: z.array(z.string().min(1, "Contact ID is required")).min(1, "At least one field crew contact is required").max(50, "Too many contacts for field crew message"),
  body: messageBodySchema,
  templateId: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
  mediaUrls: z.array(mediaUrlSchema).max(10, "Too many media attachments").optional(),
});

// Sales rep messaging schema
export const salesRepMessageSchema = z.object({
  contactIds: z.array(z.string().min(1, "Contact ID is required")).min(1, "At least one sales rep contact is required").max(50, "Too many contacts for sales rep message"),
  body: messageBodySchema,
  templateId: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
  mediaUrls: z.array(mediaUrlSchema).max(10, "Too many media attachments").optional(),
});

// Template variable substitution schema
export const templateVariableSchema = z.record(
  z.string().min(1, "Variable name is required").max(50, "Variable name too long"),
  z.string().max(200, "Variable value too long")
);

// Message scheduling schema (not implemented - removed to avoid confusion)
// export const messageScheduleSchema = z.object({
//   sendAt: z.date().min(new Date(), "Send date must be in the future"),
//   timezone: z.string().optional(),
// });

// Type exports for use in API routes
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type CreateBulkMessageInput = z.infer<typeof createBulkMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
export type MessageSearchInput = z.infer<typeof messageSearchSchema>;
export type ConversationSearchInput = z.infer<typeof conversationSearchSchema>;
export type CreateMessageTemplateInput = z.infer<typeof createMessageTemplateSchema>;
export type UpdateMessageTemplateInput = z.infer<typeof updateMessageTemplateSchema>;
export type MessageTemplateSearchInput = z.infer<typeof messageTemplateSearchSchema>;
export type SmsWebhookInput = z.infer<typeof smsWebhookSchema>;
export type MessageStatusWebhookInput = z.infer<typeof messageStatusWebhookSchema>;
export type FieldCrewMessageInput = z.infer<typeof fieldCrewMessageSchema>;
export type SalesRepMessageInput = z.infer<typeof salesRepMessageSchema>;
export type TemplateVariableInput = z.infer<typeof templateVariableSchema>;
// export type MessageScheduleInput = z.infer<typeof messageScheduleSchema>;
