// Shared domain types aligned with Prisma schema

export type Role = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: Role;
}

export type ContactType = "CUSTOMER" | "FIELD_CREW" | "SALES_REP" | "VENDOR";

export interface Contact {
  id: string;
  organization?: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  type: ContactType;
  department?: string | null;
  notes?: string | null;
  tags: string[];
  quickbaseId?: string | null;
  isFavorite: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  ownerId?: string | null;
  groups?: ContactGroup[];
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  members?: Contact[];
}

export interface ContactCreateInput {
  organization?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  type: ContactType;
  department?: string;
  notes?: string;
  tags?: string[];
  quickbaseId?: string;
  isFavorite?: boolean;
  groupIds?: string[];
}

export interface ContactUpdateInput {
  organization?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  type?: ContactType;
  department?: string;
  notes?: string;
  tags?: string[];
  quickbaseId?: string;
  isFavorite?: boolean;
  groupIds?: string[];
}

export interface ContactSearchParams {
  search?: string;
  type?: ContactType;
  department?: string;
  isFavorite?: boolean;
  groupId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ContactImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  duplicates: number;
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
  twilioCallSid?: string | null;
  recordingSid?: string | null;
  transcription?: string | null;
  userId?: string | null;
  contactId?: string | null;
  createdAt: string | Date;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    organization?: string | null;
    phone: string;
    email?: string | null;
  } | null;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
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


