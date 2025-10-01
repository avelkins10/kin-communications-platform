export interface QBRecord {
  rid?: number;
  [fid: `fid_${number}`]: unknown;
}

export interface QBQueryRequest {
  from: string; // table id
  select: number[]; // fids
  where?: string;
  sortBy?: { fieldId: number; order: "ASC" | "DESC" }[];
  options?: { skip?: number; top?: number };
}

export interface QBQueryResponse {
  data: QBRecord[];
  fields: { id: number; label: string }[];
}

// Customer data interfaces
export interface QBCustomer {
  id: string;
  name: string;
  phone: string; // Field 148
  email?: string;
  address?: string;
  projectCoordinatorId?: string; // Field 346
  projectStatus?: string; // Field 255
  lastContact?: Date;
  communicationCount?: number;
  [key: string]: unknown;
}

export interface QBProjectCoordinator {
  id: string;
  name: string;
  email: string;
  phone?: string;
  availability: 'available' | 'busy' | 'offline';
  assignedCustomers: string[];
  workload: number;
  [key: string]: unknown;
}

export interface QBProject {
  id: string;
  customerId: string;
  status: string; // Field 255
  stage: string;
  startDate?: Date;
  endDate?: Date;
  milestones: QBMilestone[];
  coordinatorId?: string;
  [key: string]: unknown;
}

export interface QBMilestone {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
  completedDate?: Date;
}

export interface QBCommunication {
  id: string;
  customerId: string;
  type: 'call' | 'sms' | 'voicemail' | 'email';
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  duration?: number;
  agentId?: string;
  notes?: string;
  recordingUrl?: string;
  status: 'completed' | 'failed' | 'missed';
  [key: string]: unknown;
}

// API request/response interfaces
export interface QBCustomerLookupRequest {
  phone?: string;
  email?: string;
  customerId?: string;
}

export interface QBCustomerLookupResponse {
  customer?: QBCustomer;
  projectCoordinator?: QBProjectCoordinator;
  project?: QBProject;
  found: boolean;
}

export interface QBCommunicationLogRequest {
  customerId: string;
  type: 'call' | 'sms' | 'voicemail' | 'email';
  direction: 'inbound' | 'outbound';
  duration?: number;
  agentId?: string;
  notes?: string;
  recordingUrl?: string;
  status: 'completed' | 'failed' | 'missed';
}

export interface QBProjectStatusRequest {
  customerId: string;
}

export interface QBProjectStatusResponse {
  project?: QBProject;
  status: string;
  stage: string;
  milestones: QBMilestone[];
}

// Field ID constants
export const QB_FIELD_IDS = {
  CUSTOMER_PHONE: 148,
  PROJECT_COORDINATOR: 346,
  PROJECT_STATUS: 255,
} as const;

// Iframe integration
export interface QBIframeConfig {
  customerId?: string;
  recordId?: string;
  tableId?: string;
  viewId?: string;
  embed?: boolean;
}

export interface QBSyncRequest {
  type: 'full' | 'incremental';
  lastSync?: Date;
  customerIds?: string[];
}

export interface QBSyncResponse {
  synced: number;
  errors: number;
  lastSync: Date;
  conflicts: QBSyncConflict[];
}

export interface QBSyncConflict {
  field: string;
  localValue: unknown;
  quickbaseValue: unknown;
  resolution: 'local' | 'quickbase' | 'manual';
}


