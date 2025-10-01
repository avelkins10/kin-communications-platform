// Shared domain types aligned with Prisma schema

export type Role = "user" | "manager" | "admin";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: Role;
}

export type ContactType = "CUSTOMER" | "FIELD_CREW" | "SALES_REP" | "VENDOR";

export type ProjectStatus = "PRE_PTO" | "POST_PTO";

export type StatusCategory = "ACTIVE" | "INACTIVE";

export type ContactSectionType = "CUSTOMERS" | "EMPLOYEES";

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
  
  // Enhanced fields for Master Requirements Document
  projectStatus?: ProjectStatus | null;
  statusCategory: StatusCategory;
  isStale: boolean;
  
  // SLA tracking fields
  lastContactDate?: string | Date | null;
  lastContactBy?: string | null;
  lastContactByUser?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  lastContactDepartment?: string | null;
  lastContactType?: string | null;
  voicemailCallbackDue?: string | Date | null;
  textResponseDue?: string | Date | null;
  missedCallFollowupDue?: string | Date | null;
  unreadCount: number;
  
  // Project Coordinator assignment
  projectCoordinatorId?: string | null;
  projectCoordinator?: {
    id: string;
    name?: string | null;
    email: string;
    department?: string | null;
  } | null;
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
  // Enhanced search parameters
  sectionType?: ContactSectionType;
  projectStatus?: ProjectStatus;
  statusCategory?: StatusCategory;
  isStale?: boolean;
  projectCoordinatorId?: string;
  slaViolation?: boolean;
  lastContactDateFrom?: string;
  lastContactDateTo?: string;
}

export interface ContactImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  duplicates: number;
}

// Enhanced contact management interfaces
export interface ContactConfiguration {
  id: string;
  name: string;
  description?: string | null;
  stalenessRules: StalenessRules;
  statusMappings: StatusMappings;
  slaSettings: SLASettings;
  isActive: boolean;
  createdBy?: string | null;
  createdByUser?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StalenessRules {
  activeTimeoutMonths: number; // Default: 6 months
  holdTimeoutMonths: number;   // Default: 3 months
  enabled: boolean;
}

export interface StatusMappings {
  activeStatuses: string[];    // Status values that map to ACTIVE
  inactiveStatuses: string[];  // Status values that map to INACTIVE
}

export interface SLASettings {
  voicemailCallback: {
    sameDayBefore3PM: boolean;
    nextBusinessDayAfter: boolean;
    enabled: boolean;
  };
  textResponse: {
    businessHoursMinutes: number; // Default: 30 minutes
    afterHoursNextDay9AM: boolean;
    enabled: boolean;
  };
  missedCallFollowup: {
    hours: number; // Default: 1 hour
    enabled: boolean;
  };
}

export interface CustomerContact extends Contact {
  type: "CUSTOMER";
  projectStatus: ProjectStatus;
  projectCoordinator: {
    id: string;
    name?: string | null;
    email: string;
    department?: string | null;
  } | null;
}

export interface EmployeeContact extends Contact {
  type: "FIELD_CREW" | "SALES_REP" | "VENDOR";
  role?: string;
  department: string;
  isAvailable: boolean;
}

export interface SLAStatus {
  type: "voicemail_callback" | "text_response" | "missed_call_followup";
  status: "on_time" | "approaching" | "violated";
  dueDate: string | Date;
  timeRemaining?: string; // Format: "2h 15m remaining" or "OVERDUE by 45m"
  isOverdue: boolean;
  minutesOverdue?: number;
  minutesRemaining?: number;
}

export interface ContactSLAStatus {
  contactId: string;
  voicemailCallback?: SLAStatus;
  textResponse?: SLAStatus;
  missedCallFollowup?: SLAStatus;
  hasViolations: boolean;
  hasApproaching: boolean;
  totalViolations: number;
}

export const CallDirection = {
  INBOUND: "INBOUND",
  OUTBOUND: "OUTBOUND",
} as const;
export type CallDirection = typeof CallDirection[keyof typeof CallDirection];

export const CallStatus = {
  PENDING: "PENDING",
  RINGING: "RINGING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  MISSED: "MISSED",
  VOICEMAIL: "VOICEMAIL",
} as const;
export type CallStatus = typeof CallStatus[keyof typeof CallStatus];

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

export const MessageDirection = {
  INBOUND: "INBOUND",
  OUTBOUND: "OUTBOUND",
} as const;
export type MessageDirection = typeof MessageDirection[keyof typeof MessageDirection];

export const MessageStatus = {
  QUEUED: "QUEUED",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
  FAILED: "FAILED",
  UNDELIVERED: "UNDELIVERED",
  RECEIVED: "RECEIVED",
} as const;
export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

export interface Message {
  id: string;
  direction: MessageDirection;
  status: MessageStatus;
  fromNumber: string;
  toNumber: string;
  body: string;
  mediaUrl?: string | null;
  mediaUrls?: string[];
  sentAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  readAt?: string | Date | null;
  twilioMessageSid?: string | null;
  conversationSid?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  numSegments?: number | null;
  price?: string | null;
  priceUnit?: string | null;
  userId?: string | null;
  contactId?: string | null;
  templateId?: string | null;
  createdAt: string | Date;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    organization?: string | null;
    phone: string;
    email?: string | null;
    type: ContactType;
  } | null;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  template?: {
    id: string;
    name: string;
    category: TemplateCategory;
  } | null;
}

export type TemplateCategory = "SUPPORT" | "SALES" | "SCHEDULING" | "FIELD_CREW" | "GENERAL";

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  category: TemplateCategory;
  variables: string[];
  isShared: boolean;
  usageCount: number;
  userId?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export interface MessageCreateInput {
  toNumber: string;
  body: string;
  mediaUrls?: string[];
  contactId?: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface MessageBulkInput {
  contactIds: string[];
  body: string;
  mediaUrls?: string[];
  templateId?: string;
  variables?: Record<string, string>;
}

export interface Conversation {
  contactId: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    organization?: string | null;
    phone: string;
    email?: string | null;
    type: ContactType;
  };
  lastMessage?: {
    id: string;
    body: string;
    direction: MessageDirection;
    status: MessageStatus;
    createdAt: string | Date;
  };
  unreadCount: number;
  messageCount: number;
  lastActivityAt: string | Date;
}

export interface MessageSearchParams {
  contactId?: string;
  direction?: MessageDirection;
  status?: MessageStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const VoicemailPriority = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type VoicemailPriority = typeof VoicemailPriority[keyof typeof VoicemailPriority];

export interface Voicemail {
  id: string;
  callId: string;
  transcription?: string | null;
  audioUrl: string;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name?: string | null;
    email: string;
  } | null;
  fromNumber: string;
  duration?: number | null;
  contactId?: string | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    organization?: string | null;
    phone: string;
    email?: string | null;
    type: ContactType;
  } | null;
  emailSent: boolean;
  priority: VoicemailPriority;
  notes?: string | null;
  readAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  call?: {
    id: string;
    direction: CallDirection;
    status: CallStatus;
    fromNumber: string;
    toNumber: string;
    startedAt?: string | Date | null;
    endedAt?: string | Date | null;
    durationSec?: number | null;
    twilioCallSid?: string | null;
  };
}

export interface VoicemailCreateInput {
  callId: string;
  fromNumber: string;
  audioUrl: string;
  duration?: number;
  contactId?: string;
  assignedToId?: string;
  priority?: VoicemailPriority;
  notes?: string;
}

export interface VoicemailUpdateInput {
  readAt?: string | Date | null;
  assignedToId?: string | null;
  priority?: VoicemailPriority;
  notes?: string | null;
  transcription?: string | null;
  emailSent?: boolean;
}

export interface VoicemailSearchParams {
  assignedToId?: string;
  isRead?: boolean; // true = read (readAt is not null), false = unread (readAt is null)
  contactId?: string;
  priority?: VoicemailPriority;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VoicemailBulkAction {
  action: "mark_read" | "mark_unread" | "assign" | "delete" | "set_priority";
  voicemailIds: string[];
  assignedToId?: string;
  priority?: VoicemailPriority;
}

export interface VoicemailCallbackRequest {
  voicemailId: string;
  fromNumber: string;
  toNumber: string;
}

export interface VoicemailStats {
  total: number;
  unread: number;
  byPriority: Record<VoicemailPriority, number>;
  byUser: Array<{
    userId: string;
    userName: string;
    count: number;
    unreadCount: number;
  }>;
  averageResponseTime: number;
  todayCount: number;
  weekCount: number;
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

// Message Template types
export interface MessageTemplateCreateInput {
  name: string;
  body: string;
  category: TemplateCategory;
  variables?: string[];
  isShared?: boolean;
}

export interface MessageTemplateUpdateInput {
  name?: string;
  body?: string;
  category?: TemplateCategory;
  variables?: string[];
  isShared?: boolean;
}

export interface MessageTemplateSearchParams {
  category?: TemplateCategory;
  search?: string;
  isShared?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Conversation types
export interface ConversationSearchParams {
  contactType?: ContactType;
  unreadOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

