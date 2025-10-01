import { z } from 'zod';
import { VoicemailPriority } from '@/types/index';

// Voicemail creation validation
export const createVoicemailSchema = z.object({
  callId: z.string().cuid(),
  fromNumber: z.string().min(1).max(32),
  audioUrl: z.string().url(),
  duration: z.number().int().min(0).optional(),
  contactId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).default('NORMAL'),
  notes: z.string().max(1000).optional(),
});

// Voicemail update validation
export const updateVoicemailSchema = z.object({
  readAt: z.string().datetime().nullable().optional(),
  assignedToId: z.string().cuid().nullable().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).optional(),
  notes: z.string().max(1000).nullable().optional(),
  transcription: z.string().nullable().optional(),
  emailSent: z.boolean().optional(),
});

// Voicemail search/filter validation
export const voicemailSearchSchema = z.object({
  assignedToId: z.string().cuid().optional(),
  isRead: z.boolean().optional(), // true = read (readAt is not null), false = unread (readAt is null)
  contactId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'priority', 'readAt', 'assignedToId', 'fromNumber']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Voicemail bulk action validation
export const voicemailBulkActionSchema = z.object({
  action: z.enum(['mark_read', 'mark_unread', 'assign', 'delete', 'set_priority']),
  voicemailIds: z.array(z.string().cuid()).min(1).max(100),
  assignedToId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).optional(),
});

// Voicemail callback validation
export const voicemailCallbackSchema = z.object({
  voicemailId: z.string().cuid(),
  fromNumber: z.string().min(1).max(32),
  toNumber: z.string().min(1).max(32),
});

// Voicemail assignment validation
export const voicemailAssignmentSchema = z.object({
  assignedToId: z.string().cuid(),
  notes: z.string().max(500).optional(),
  sendEmailNotification: z.boolean().default(true),
});

// Voicemail read status validation
export const voicemailReadStatusSchema = z.object({
  isRead: z.boolean(), // true = mark as read (set readAt), false = mark as unread (set readAt to null)
  voicemailIds: z.array(z.string().cuid()).optional(), // For bulk operations
});

// Voicemail stats validation
export const voicemailStatsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  userId: z.string().cuid().optional(),
});

// Webhook payload validation for voicemail creation
export const voicemailWebhookSchema = z.object({
  CallSid: z.string(),
  RecordingSid: z.string(),
  RecordingUrl: z.string().url(),
  RecordingDuration: z.string(),
  RecordingStatus: z.enum(['in-progress', 'completed', 'absent']),
  From: z.string(),
  To: z.string(),
  AccountSid: z.string(),
  ApiVersion: z.string().optional(),
});

// Voicemail transcription webhook validation
export const voicemailTranscriptionWebhookSchema = z.object({
  CallSid: z.string(),
  TranscriptionSid: z.string(),
  TranscriptionText: z.string(),
  TranscriptionStatus: z.enum(['in-progress', 'completed', 'failed']),
  TranscriptionUrl: z.string().url().optional(),
  RecordingSid: z.string().optional(),
  AccountSid: z.string(),
  ApiVersion: z.string().optional(),
});

// Email notification validation
export const voicemailEmailNotificationSchema = z.object({
  voicemailId: z.string().cuid(),
  recipientEmail: z.string().email(),
  templateType: z.enum(['new_voicemail', 'assignment', 'high_priority', 'daily_summary']),
  customMessage: z.string().max(500).optional(),
});

// Voicemail priority detection validation
export const voicemailPriorityDetectionSchema = z.object({
  transcription: z.string(),
  keywords: z.array(z.string()).optional(),
  autoAssign: z.boolean().default(false),
});

// Type exports
export type CreateVoicemailInput = z.infer<typeof createVoicemailSchema>;
export type UpdateVoicemailInput = z.infer<typeof updateVoicemailSchema>;
export type VoicemailSearchParams = z.infer<typeof voicemailSearchSchema>;
export type VoicemailBulkActionInput = z.infer<typeof voicemailBulkActionSchema>;
export type VoicemailCallbackInput = z.infer<typeof voicemailCallbackSchema>;
export type VoicemailAssignmentInput = z.infer<typeof voicemailAssignmentSchema>;
export type VoicemailReadStatusInput = z.infer<typeof voicemailReadStatusSchema>;
export type VoicemailStatsParams = z.infer<typeof voicemailStatsSchema>;
export type VoicemailWebhookPayload = z.infer<typeof voicemailWebhookSchema>;
export type VoicemailTranscriptionWebhookPayload = z.infer<typeof voicemailTranscriptionWebhookSchema>;
export type VoicemailEmailNotificationInput = z.infer<typeof voicemailEmailNotificationSchema>;
export type VoicemailPriorityDetectionInput = z.infer<typeof voicemailPriorityDetectionSchema>;
