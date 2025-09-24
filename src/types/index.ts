// Shared domain types aligned with Prisma schema

export type Role = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: Role;
}

export interface Contact {
  id: string;
  organization?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  ownerId?: string | null;
}

export type CallDirection = "INBOUND" | "OUTBOUND";
export type CallStatus =
  | "PENDING"
  | "RINGING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"
  | "MISSED"
  | "VOICEMAIL";

export interface Call {
  id: string;
  direction: CallDirection;
  status: CallStatus;
  fromNumber: string;
  toNumber: string;
  startedAt?: string | Date | null;
  endedAt?: string | Date | null;
  durationSec?: number | null;
  recordingUrl?: string | null;
  userId?: string | null;
  contactId?: string | null;
}

export type MessageDirection = "INBOUND" | "OUTBOUND";
export type MessageStatus = "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export interface Message {
  id: string;
  direction: MessageDirection;
  status: MessageStatus;
  fromNumber: string;
  toNumber: string;
  body: string;
  mediaUrl?: string | null;
  userId?: string | null;
  contactId?: string | null;
  sentAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  readAt?: string | Date | null;
}

export interface Voicemail {
  id: string;
  callId: string;
  transcription?: string | null;
  audioUrl: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  matchType: string;
  matchValue: string;
  action: string;
  actionValue?: string | null;
  enabled: boolean;
}

// Twilio domain types (simplified)
export interface TwilioAccessTokenResponse {
  token: string;
  expiresIn: number; // seconds
}


