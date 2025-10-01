import { Contact, CustomerContact, ProjectStatus } from "@/types";
import { QuickbaseClient } from './client';
import { Call, Message, Voicemail, User } from '@prisma/client';
import { QBCustomer, QBCommunication } from '@/types/quickbase';
import * as Sentry from '@sentry/nextjs';

// QuickBase field mappings for customer data
// Default values are from Master Requirements Document
export const QUICKBASE_FIELD_MAPPINGS = {
  // Core identifiers and contact info
  customerId: process.env.QUICKBASE_FIELD_CUSTOMER_ID || "6",
  firstName: process.env.QUICKBASE_FIELD_FIRST_NAME || "7",
  lastName: process.env.QUICKBASE_FIELD_LAST_NAME || "8",
  email: process.env.QUICKBASE_FIELD_EMAIL || "9",
  phone: process.env.QUICKBASE_FIELD_PHONE || "148", // Master Requirements: phone field ID
  company: process.env.QUICKBASE_FIELD_COMPANY || "11",

  // Project fields (Master Requirements field IDs)
  projectStatus: process.env.QUICKBASE_FIELD_PROJECT_STATUS || "255", // Master Requirements: project status field ID
  projectStage: process.env.QUICKBASE_FIELD_PROJECT_STAGE || "367",
  projectCoordinatorId: process.env.QUICKBASE_FIELD_PROJECT_COORDINATOR || "346", // Master Requirements: project coordinator field ID

  // Operational / dates
  saleDate: process.env.QUICKBASE_FIELD_SALE_DATE || "12",
  scheduledInstallDate: process.env.QUICKBASE_FIELD_SCHEDULED_INSTALL_DATE || "710",
  lastContactDate: process.env.QUICKBASE_FIELD_LAST_CONTACT_DATE || "14",
  lastContactBy: process.env.QUICKBASE_FIELD_LAST_CONTACT_BY || "15",
  lastContactDepartment: process.env.QUICKBASE_FIELD_LAST_CONTACT_DEPARTMENT || "16",
  lastContactType: process.env.QUICKBASE_FIELD_LAST_CONTACT_TYPE || "17",

  // SLA related
  voicemailCallbackDue: process.env.QUICKBASE_FIELD_VOICEMAIL_CALLBACK_DUE || "18",
  textResponseDue: process.env.QUICKBASE_FIELD_TEXT_RESPONSE_DUE || "19",
  missedCallFollowupDue: process.env.QUICKBASE_FIELD_MISSED_CALL_FOLLOWUP_DUE || "20",

  // Status / misc
  unreadCount: process.env.QUICKBASE_FIELD_UNREAD_COUNT || "21",
  status: process.env.QUICKBASE_FIELD_STATUS || "22",
  isStale: process.env.QUICKBASE_FIELD_IS_STALE || "23",
  notes: process.env.QUICKBASE_FIELD_NOTES || "24",

  // Additional provided fields
  customerName: process.env.QUICKBASE_FIELD_CUSTOMER_NAME || "145",
  address: process.env.QUICKBASE_FIELD_ADDRESS || "146",
};

// QuickBase API configuration
export const QUICKBASE_CONFIG = {
  realm: process.env.QUICKBASE_REALM || "kincommunications",
  appId: process.env.QUICKBASE_APP_ID || "",
  userToken: process.env.QUICKBASE_USER_TOKEN || "",
  tableId: process.env.QUICKBASE_TABLE_ID || "",
  baseUrl: process.env.QUICKBASE_BASE_URL || "https://api.quickbase.com/v1",
};

// QuickBase customer data interface
export interface QuickBaseCustomerData {
  customerId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  projectStatus: ProjectStatus;
  projectCoordinatorId?: string;
  lastContactDate?: string;
  lastContactBy?: string;
  lastContactDepartment?: string;
  lastContactType?: string;
  voicemailCallbackDue?: string;
  textResponseDue?: string;
  missedCallFollowupDue?: string;
  unreadCount: number;
  status: string;
  isStale: boolean;
  notes?: string;
}

// QuickBase API client class
export class QuickBaseService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = QUICKBASE_CONFIG.baseUrl;
    this.headers = {
      "QB-Realm-Hostname": QUICKBASE_CONFIG.realm,
      "Authorization": `QB-USER-TOKEN ${QUICKBASE_CONFIG.userToken}`,
      "Content-Type": "application/json",
    };
  }

  // Fetch customer data from QuickBase
  async fetchCustomerData(filters?: Record<string, any>): Promise<QuickBaseCustomerData[]> {
    try {
      const query = this.buildQuery(filters);
      
      const response = await fetch(`${this.baseUrl}/records/query`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          from: QUICKBASE_CONFIG.tableId || QUICKBASE_CONFIG.appId,
          select: Object.values(QUICKBASE_FIELD_MAPPINGS),
          where: query,
        }),
      });

      if (!response.ok) {
        throw new Error(`QuickBase API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.transformQuickBaseRecords(data.data);
    } catch (error) {
      console.error("Error fetching customer data from QuickBase:", error);
      throw error;
    }
  }

  // Sync customer data to local database
  async syncCustomerData(customerData: QuickBaseCustomerData[]): Promise<{
    success: boolean;
    totalRecordsProcessed: number;
    recordsCreated: number;
    recordsUpdated: number;
    errors: string[];
  }> {
    const result = {
      success: true,
      totalRecordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [] as string[],
    };

    try {
      for (const customer of customerData) {
        result.totalRecordsProcessed++;
        
        try {
          // Check if contact exists by QuickBase customer ID
          const existingContact = await this.findContactByQuickBaseId(customer.customerId);
          
          if (existingContact) {
            // Update existing contact
            await this.updateContactFromQuickBase(existingContact.id, customer);
            result.recordsUpdated++;
          } else {
            // Create new contact
            await this.createContactFromQuickBase(customer);
            result.recordsCreated++;
          }
        } catch (error) {
          const errorMessage = `Failed to sync customer ${customer.customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMessage);
          console.error(errorMessage);
        }
      }

      return result;
    } catch (error) {
      console.error("Error during customer data sync:", error);
      result.success = false;
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  // Private helper methods
  private buildQuery(filters?: Record<string, any>): string {
    if (!filters || Object.keys(filters).length === 0) {
      return "";
    }

    const conditions: string[] = [];
    
    if (filters.projectStatus) {
      conditions.push(`{${QUICKBASE_FIELD_MAPPINGS.projectStatus}} = "${filters.projectStatus}"`);
    }
    
    if (filters.projectCoordinatorId) {
      conditions.push(`{${QUICKBASE_FIELD_MAPPINGS.projectCoordinatorId}} = "${filters.projectCoordinatorId}"`);
    }
    
    if (filters.isStale !== undefined) {
      conditions.push(`{${QUICKBASE_FIELD_MAPPINGS.isStale}} = ${filters.isStale}`);
    }

    return conditions.join(" AND ");
  }

  private transformQuickBaseRecords(records: any[]): QuickBaseCustomerData[] {
    return records.map(record => ({
      customerId: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.customerId) || "",
      firstName: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.firstName) || "",
      lastName: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.lastName) || "",
      email: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.email),
      phone: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.phone),
      company: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.company),
      projectStatus: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.projectStatus) as ProjectStatus || "PRE_PTO",
      projectCoordinatorId: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.projectCoordinatorId),
      lastContactDate: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.lastContactDate),
      lastContactBy: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.lastContactBy),
      lastContactDepartment: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.lastContactDepartment),
      lastContactType: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.lastContactType),
      voicemailCallbackDue: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.voicemailCallbackDue),
      textResponseDue: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.textResponseDue),
      missedCallFollowupDue: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.missedCallFollowupDue),
      unreadCount: parseInt(this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.unreadCount) || "0"),
      status: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.status) || "Active",
      isStale: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.isStale) === "true",
      notes: this.getFieldValue(record, QUICKBASE_FIELD_MAPPINGS.notes),
    }));
  }

  private getFieldValue(record: any, fieldId: string): string | undefined {
    const field = record[fieldId];
    return field?.value?.toString();
  }

  // Database operations using Prisma
  private async findContactByQuickBaseId(customerId: string): Promise<Contact | null> {
    const { prisma } = await import("@/lib/db");
    return await prisma.contact.findFirst({
      where: { quickbaseId: customerId }
    });
  }

  private async updateContactFromQuickBase(contactId: string, customerData: QuickBaseCustomerData): Promise<void> {
    const { prisma } = await import("@/lib/db");

    // Look up coordinator by QuickBase User ID if provided
    let coordinatorId: string | null = null;
    if (customerData.projectCoordinatorId) {
      const coordinator = await prisma.user.findUnique({
        where: { quickbaseUserId: customerData.projectCoordinatorId }
      });
      coordinatorId = coordinator?.id || null;
    }

    await prisma.contact.update({
      where: { id: contactId },
      data: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        organization: customerData.company,
        projectStatus: customerData.projectStatus,
        projectCoordinatorId: coordinatorId,
        lastContactDate: customerData.lastContactDate ? new Date(customerData.lastContactDate) : null,
        lastContactBy: customerData.lastContactBy,
        lastContactDepartment: customerData.lastContactDepartment,
        lastContactType: customerData.lastContactType,
        voicemailCallbackDue: customerData.voicemailCallbackDue ? new Date(customerData.voicemailCallbackDue) : null,
        textResponseDue: customerData.textResponseDue ? new Date(customerData.textResponseDue) : null,
        missedCallFollowupDue: customerData.missedCallFollowupDue ? new Date(customerData.missedCallFollowupDue) : null,
        unreadCount: customerData.unreadCount,
        notes: customerData.notes,
        updatedAt: new Date()
      }
    });
  }

  private async createContactFromQuickBase(customerData: QuickBaseCustomerData): Promise<void> {
    const { prisma } = await import("@/lib/db");

    // Look up coordinator by QuickBase User ID if provided
    let coordinatorId: string | null = null;
    if (customerData.projectCoordinatorId) {
      const coordinator = await prisma.user.findUnique({
        where: { quickbaseUserId: customerData.projectCoordinatorId }
      });
      coordinatorId = coordinator?.id || null;
    }

    await prisma.contact.create({
      data: {
        quickbaseId: customerData.customerId,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone,
        organization: customerData.company,
        type: 'CUSTOMER',
        projectStatus: customerData.projectStatus,
        projectCoordinatorId: coordinatorId,
        lastContactDate: customerData.lastContactDate ? new Date(customerData.lastContactDate) : null,
        lastContactBy: customerData.lastContactBy,
        lastContactDepartment: customerData.lastContactDepartment,
        lastContactType: customerData.lastContactType,
        voicemailCallbackDue: customerData.voicemailCallbackDue ? new Date(customerData.voicemailCallbackDue) : null,
        textResponseDue: customerData.textResponseDue ? new Date(customerData.textResponseDue) : null,
        missedCallFollowupDue: customerData.missedCallFollowupDue ? new Date(customerData.missedCallFollowupDue) : null,
        unreadCount: customerData.unreadCount,
        notes: customerData.notes,
        isFavorite: false,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Find customer by phone number for call routing
   * This method is called by the routing engine to get customer data
   */
  async findCustomerByPhone(phoneNumber: string): Promise<CustomerContact | null> {
    try {
      const client = this.getQuickbaseClient();
      const qbCustomer = await client.getCustomerByPhone(phoneNumber, QUICKBASE_CONFIG.tableId || QUICKBASE_CONFIG.appId);
      
      if (!qbCustomer) {
        return null;
      }

      // Transform QBCustomer to CustomerContact format expected by routing
      const customerContact: CustomerContact = {
        id: qbCustomer.id,
        name: qbCustomer.name,
        phone: qbCustomer.phone,
        email: qbCustomer.email || null,
        type: 'CUSTOMER',
        projectStatus: (qbCustomer.projectStatus as ProjectStatus) || 'PRE_PTO',
        projectCoordinator: null,
        department: null,
        notes: null,
        tags: [],
        quickbaseId: qbCustomer.id,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        statusCategory: 'ACTIVE',
        isStale: false,
        unreadCount: 0,
        lastContact: qbCustomer.lastContact || null
      };

      // If customer has a project coordinator, look up the coordinator details
      if (qbCustomer.projectCoordinatorId) {
        const coordinator = await client.getAssignedPC(qbCustomer.id, QUICKBASE_CONFIG.tableId || QUICKBASE_CONFIG.appId);
        if (coordinator) {
          customerContact.projectCoordinator = {
            id: coordinator.id,
            name: coordinator.name,
            email: coordinator.email,
            department: null // Coordinator department not available in QB data
          };
        }
      }

      return customerContact;
    } catch (error) {
      Sentry.addBreadcrumb({
        category: 'quickbase',
        message: 'Customer lookup failed',
        level: 'error',
        data: { operation: 'findCustomerByPhone', error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.error('Error finding customer by phone:', error);
      return null;
    }
  }

  /**
   * Log call to Quickbase for compliance tracking
   */
  async logCallToQuickbase(call: Call, contact?: Contact, user?: User): Promise<void> {
    try {
      // Skip if no contact or contact has no Quickbase ID
      if (!contact?.quickbaseId) {
        return;
      }

      const communication: QBCommunication = {
        id: call.id,
        customerId: contact.quickbaseId,
        type: 'call',
        direction: call.direction.toLowerCase() as 'inbound' | 'outbound',
        timestamp: call.startedAt || call.createdAt,
        duration: call.durationSec,
        agentId: user?.quickbaseUserId || undefined,
        recordingUrl: call.recordingUrl || undefined,
        status: this.mapCallStatus(call.status),
        notes: `CallSid: ${call.twilioCallSid}, From: ${call.fromNumber}, To: ${call.toNumber}`
      };

      const client = this.getQuickbaseClient();
      await client.logCommunication(communication);
      
      console.log('Logged call to Quickbase:', call.twilioCallSid);
    } catch (error) {
      Sentry.addBreadcrumb({
        category: 'quickbase',
        message: 'Call logging failed',
        level: 'error',
        data: { callSid: call.twilioCallSid, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.error('Failed to log call to Quickbase:', error);
    }
  }

  /**
   * Log voicemail to Quickbase for compliance tracking
   */
  async logVoicemailToQuickbase(voicemail: Voicemail, call: Call, contact?: Contact, user?: User): Promise<void> {
    try {
      // Skip if no contact or contact has no Quickbase ID
      if (!contact?.quickbaseId) {
        return;
      }

      const communication: QBCommunication = {
        id: voicemail.id,
        customerId: contact.quickbaseId,
        type: 'voicemail',
        direction: call.direction.toLowerCase() as 'inbound' | 'outbound',
        timestamp: voicemail.createdAt,
        duration: voicemail.duration,
        agentId: user?.quickbaseUserId || undefined,
        recordingUrl: voicemail.audioUrl || undefined,
        status: 'completed', // Voicemail was successfully recorded
        notes: `Voicemail transcription: ${voicemail.transcription || 'Not available'}, Priority: ${voicemail.priority}`
      };

      const client = this.getQuickbaseClient();
      await client.logCommunication(communication);
      
      console.log('Logged voicemail to Quickbase:', voicemail.id);
    } catch (error) {
      Sentry.addBreadcrumb({
        category: 'quickbase',
        message: 'Voicemail logging failed',
        level: 'error',
        data: { voicemailId: voicemail.id, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.error('Failed to log voicemail to Quickbase:', error);
    }
  }

  /**
   * Log SMS to Quickbase for compliance tracking
   */
  async logSMSToQuickbase(message: Message, contact?: Contact, user?: User): Promise<void> {
    try {
      // Skip if no contact or contact has no Quickbase ID
      if (!contact?.quickbaseId) {
        return;
      }

      const communication: QBCommunication = {
        id: message.id,
        customerId: contact.quickbaseId,
        type: 'sms',
        direction: message.direction.toLowerCase() as 'inbound' | 'outbound',
        timestamp: message.sentAt || message.createdAt,
        duration: undefined, // SMS has no duration
        agentId: user?.quickbaseUserId || undefined,
        recordingUrl: undefined,
        status: this.mapMessageStatus(message.status),
        notes: `SMS Body: ${message.body ? message.body.substring(0, 500) : 'No body'}` // Truncate if too long
      };

      const client = this.getQuickbaseClient();
      await client.logCommunication(communication);
      
      console.log('Logged SMS to Quickbase:', message.id);
    } catch (error) {
      Sentry.addBreadcrumb({
        category: 'quickbase',
        message: 'SMS logging failed',
        level: 'error',
        data: { messageId: message.id, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      console.error('Failed to log SMS to Quickbase:', error);
    }
  }

  /**
   * Validate Quickbase configuration
   */
  static validateQuickbaseConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!QUICKBASE_CONFIG.realm || QUICKBASE_CONFIG.realm.trim() === '') {
      errors.push('QUICKBASE_REALM is required');
    }

    if (!QUICKBASE_CONFIG.userToken || QUICKBASE_CONFIG.userToken.trim() === '') {
      errors.push('QUICKBASE_USER_TOKEN is required');
    }

    if (!QUICKBASE_CONFIG.appId && !QUICKBASE_CONFIG.tableId) {
      errors.push('Either QUICKBASE_APP_ID or QUICKBASE_TABLE_ID is required');
    }

    if (!QUICKBASE_CONFIG.baseUrl || !this.isValidUrl(QUICKBASE_CONFIG.baseUrl)) {
      errors.push('QUICKBASE_BASE_URL must be a valid URL');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get QuickbaseClient instance with validated configuration
   */
  private getQuickbaseClient(): QuickbaseClient {
    const validation = QuickBaseService.validateQuickbaseConfig();
    if (!validation.valid) {
      throw new Error(`Invalid Quickbase configuration: ${validation.errors.join(', ')}`);
    }

    return new QuickbaseClient({
      realmHost: QUICKBASE_CONFIG.realm,
      userToken: QUICKBASE_CONFIG.userToken,
      appId: QUICKBASE_CONFIG.appId,
      tableIds: {
        communications: process.env.QUICKBASE_TABLE_COMMUNICATIONS
      }
    });
  }

  /**
   * Map call status to Quickbase communication status
   */
  private mapCallStatus(status: string): 'completed' | 'failed' | 'missed' {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'answered':
        return 'completed';
      case 'failed':
      case 'busy':
      case 'no-answer':
        return 'failed';
      case 'missed':
        return 'missed';
      default:
        return 'completed';
    }
  }

  /**
   * Map message status to Quickbase communication status
   */
  private mapMessageStatus(status: string): 'completed' | 'failed' | 'missed' {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'sent':
        return 'completed';
      case 'failed':
      case 'undelivered':
        return 'failed';
      default:
        return 'completed';
    }
  }

  /**
   * Check if URL is valid
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const quickBaseService = new QuickBaseService();
export const quickbaseService = quickBaseService; // Alias for backward compatibility

// Export utility functions
export async function syncQuickBaseCustomerData(filters?: Record<string, any>): Promise<{
  success: boolean;
  totalRecordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  errors: string[];
}> {
  try {
    const customerData = await quickBaseService.fetchCustomerData(filters);
    return await quickBaseService.syncCustomerData(customerData);
  } catch (error) {
    console.error("Error in syncQuickBaseCustomerData:", error);
    return {
      success: false,
      totalRecordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}