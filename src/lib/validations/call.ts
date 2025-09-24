import { z } from 'zod';
import { CallDirection, CallStatus } from '@/types/index';

// Call creation validation
export const createCallSchema = z.object({
  contactId: z.string().cuid(),
  direction: z.enum(['INBOUND', 'OUTBOUND'] as const),
  fromNumber: z.string().min(1).max(32),
  toNumber: z.string().min(1).max(32),
  userId: z.string().cuid().optional(),
});

// Call update validation
export const updateCallSchema = z.object({
  status: z.enum(['PENDING', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'MISSED', 'VOICEMAIL'] as const).optional(),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  durationSec: z.number().int().min(0).optional(),
  recordingUrl: z.string().url().optional(),
  twilioCallSid: z.string().optional(),
  recordingSid: z.string().optional(),
  transcription: z.string().optional(),
});

// Call control action validation
export const callControlSchema = z.object({
  action: z.enum(['mute', 'unmute', 'hold', 'unhold', 'hangup', 'transfer']),
  to: z.string().optional(), // Required for transfer action
});

// Call search/filter validation
export const callSearchSchema = z.object({
  search: z.string().optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND'] as const).optional(),
  status: z.enum(['PENDING', 'RINGING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'MISSED', 'VOICEMAIL'] as const).optional(),
  userId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'startedAt', 'durationSec', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Webhook payload validation
export const voiceWebhookSchema = z.object({
  CallSid: z.string(),
  From: z.string(),
  To: z.string(),
  CallStatus: z.string(),
  Direction: z.enum(['inbound', 'outbound']),
  CallerName: z.string().optional(),
  CallerCity: z.string().optional(),
  CallerState: z.string().optional(),
  CallerCountry: z.string().optional(),
  CallerZip: z.string().optional(),
  CalledCity: z.string().optional(),
  CalledState: z.string().optional(),
  CalledCountry: z.string().optional(),
  CalledZip: z.string().optional(),
  AccountSid: z.string(),
  ApiVersion: z.string().optional(),
});

export const statusWebhookSchema = z.object({
  CallSid: z.string(),
  CallStatus: z.enum(['queued', 'ringing', 'in-progress', 'busy', 'failed', 'no-answer', 'canceled', 'completed']),
  From: z.string().optional(),
  To: z.string().optional(),
  Timestamp: z.string().optional(),
  CallDuration: z.string().optional(),
  Direction: z.enum(['inbound', 'outbound']).optional(),
  AccountSid: z.string(),
  ApiVersion: z.string().optional(),
});

export const recordingWebhookSchema = z.object({
  CallSid: z.string(),
  RecordingSid: z.string(),
  RecordingUrl: z.string().url(),
  RecordingDuration: z.string(),
  RecordingChannels: z.string(),
  RecordingStatus: z.enum(['in-progress', 'completed', 'absent']),
  RecordingStartTime: z.string().optional(),
  RecordingSource: z.string().optional(),
  AccountSid: z.string(),
  ApiVersion: z.string().optional(),
});

export const transcriptionWebhookSchema = z.object({
  CallSid: z.string(),
  TranscriptionSid: z.string(),
  TranscriptionText: z.string(),
  TranscriptionStatus: z.enum(['in-progress', 'completed', 'failed']),
  TranscriptionUrl: z.string().url().optional(),
  RecordingSid: z.string().optional(),
  AccountSid: z.string(),
  ApiVersion: z.string().optional(),
});

// Type exports
export type CreateCallInput = z.infer<typeof createCallSchema>;
export type UpdateCallInput = z.infer<typeof updateCallSchema>;
export type CallControlInput = z.infer<typeof callControlSchema>;
export type CallSearchParams = z.infer<typeof callSearchSchema>;
export type VoiceWebhookPayload = z.infer<typeof voiceWebhookSchema>;
export type StatusWebhookPayload = z.infer<typeof statusWebhookSchema>;
export type RecordingWebhookPayload = z.infer<typeof recordingWebhookSchema>;
export type TranscriptionWebhookPayload = z.infer<typeof transcriptionWebhookSchema>;
