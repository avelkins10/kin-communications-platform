import { 
  QBRecord, 
  QBQueryRequest, 
  QBQueryResponse, 
  QBCustomer, 
  QBProjectCoordinator, 
  QBProject, 
  QBCommunication,
  QB_FIELD_IDS 
} from "@/types/quickbase";
import { normalizePhoneToE164, getPhoneQueryFormats } from "@/lib/utils/phone";

export interface QuickbaseClientOptions {
  realmHost: string;
  userToken: string;
  appId?: string;
  keyFieldId?: string; // Configurable key field ID for record identification
  tableIds?: {
    pc?: string;
    projects?: string;
    communications?: string;
  };
  fieldIds?: {
    communications?: {
      customer?: string;
      type?: string;
      direction?: string;
      timestamp?: string;
      duration?: string;
      agent?: string;
      notes?: string;
      recording?: string;
      status?: string;
    };
    pc?: {
      id?: string;
      name?: string;
      email?: string;
      phone?: string;
      availability?: string;
      assignedCustomers?: string;
      workload?: string;
    };
    projects?: {
      id?: string;
      customerId?: string;
      status?: string;
      stage?: string;
      startDate?: string;
      endDate?: string;
      coordinatorId?: string;
    };
  };
}

export class QuickbaseClient {
  private baseUrl: string;
  private token: string;
  private appId?: string;
  private keyFieldId: string;
  private tableIds: {
    pc: string;
    projects: string;
    communications: string;
  };
  private fieldIds: {
    communications: {
      customer: string;
      type: string;
      direction: string;
      timestamp: string;
      duration: string;
      agent: string;
      notes: string;
      recording: string;
      status: string;
    };
    pc: {
      id: string;
      name: string;
      email: string;
      phone: string;
      availability: string;
      assignedCustomers: string;
      workload: string;
    };
    projects: {
      id: string;
      customerId: string;
      status: string;
      stage: string;
      startDate: string;
      endDate: string;
      coordinatorId: string;
    };
  };
  
  constructor(opts: QuickbaseClientOptions) {
    this.baseUrl = `https://${opts.realmHost}`;
    this.token = opts.userToken;
    this.appId = opts.appId;
    
    // Set key field ID from options or environment variable, default to "rid" for record ID
    this.keyFieldId = opts.keyFieldId || process.env.QUICKBASE_KEY_FID || "rid";
    
    // Set table IDs from options or environment variables
    this.tableIds = {
      pc: opts.tableIds?.pc || process.env.QUICKBASE_TABLE_PC || "pc_table_id",
      projects: opts.tableIds?.projects || process.env.QUICKBASE_TABLE_PROJECTS || "projects_table_id",
      communications: opts.tableIds?.communications || process.env.QUICKBASE_TABLE_COMMUNICATIONS || "communications_table_id"
    };
    
    // Set field IDs from options or environment variables
    this.fieldIds = {
      communications: {
        customer: opts.fieldIds?.communications?.customer || process.env.QUICKBASE_FID_CUSTOMER || "fid_1",
        type: opts.fieldIds?.communications?.type || process.env.QUICKBASE_FID_TYPE || "fid_2",
        direction: opts.fieldIds?.communications?.direction || process.env.QUICKBASE_FID_DIRECTION || "fid_3",
        timestamp: opts.fieldIds?.communications?.timestamp || process.env.QUICKBASE_FID_TIMESTAMP || "fid_4",
        duration: opts.fieldIds?.communications?.duration || process.env.QUICKBASE_FID_DURATION || "fid_5",
        agent: opts.fieldIds?.communications?.agent || process.env.QUICKBASE_FID_AGENT || "fid_6",
        notes: opts.fieldIds?.communications?.notes || process.env.QUICKBASE_FID_NOTES || "fid_7",
        recording: opts.fieldIds?.communications?.recording || process.env.QUICKBASE_FID_RECORDING || "fid_8",
        status: opts.fieldIds?.communications?.status || process.env.QUICKBASE_FID_STATUS || "fid_9"
      },
      pc: {
        id: opts.fieldIds?.pc?.id || process.env.QUICKBASE_FID_PC_ID || "1",
        name: opts.fieldIds?.pc?.name || process.env.QUICKBASE_FID_PC_NAME || "2",
        email: opts.fieldIds?.pc?.email || process.env.QUICKBASE_FID_PC_EMAIL || "3",
        phone: opts.fieldIds?.pc?.phone || process.env.QUICKBASE_FID_PC_PHONE || "4",
        availability: opts.fieldIds?.pc?.availability || process.env.QUICKBASE_FID_PC_AVAILABILITY || "5",
        assignedCustomers: opts.fieldIds?.pc?.assignedCustomers || process.env.QUICKBASE_FID_PC_ASSIGNED_CUSTOMERS || "6",
        workload: opts.fieldIds?.pc?.workload || process.env.QUICKBASE_FID_PC_WORKLOAD || "7"
      },
      projects: {
        id: opts.fieldIds?.projects?.id || process.env.QUICKBASE_FID_PROJECT_ID || "1",
        customerId: opts.fieldIds?.projects?.customerId || process.env.QUICKBASE_FID_PROJECT_CUSTOMER_ID || "2",
        status: opts.fieldIds?.projects?.status || process.env.QUICKBASE_FID_PROJECT_STATUS || "3",
        stage: opts.fieldIds?.projects?.stage || process.env.QUICKBASE_FID_PROJECT_STAGE || "4",
        startDate: opts.fieldIds?.projects?.startDate || process.env.QUICKBASE_FID_PROJECT_START_DATE || "5",
        endDate: opts.fieldIds?.projects?.endDate || process.env.QUICKBASE_FID_PROJECT_END_DATE || "6",
        coordinatorId: opts.fieldIds?.projects?.coordinatorId || process.env.QUICKBASE_FID_PROJECT_COORDINATOR_ID || "7"
      }
    };
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      "QB-Realm-Hostname": this.baseUrl.replace(/^https:\/\//, ""),
      Authorization: `QB-USER-TOKEN ${this.token}`
    } as const;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`Quickbase GET ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Quickbase POST ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Quickbase PUT ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }

  async delete<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(`Quickbase DELETE ${path} failed: ${res.status}`);
    return (await res.json()) as T;
  }

  // Helper method to build where clause for record identification
  private buildRecordWhereClause(recordId: string): string {
    if (this.keyFieldId === "rid") {
      return `{rid.EX.'${recordId}'}`;
    } else {
      return `{${this.keyFieldId}.EX.'${recordId}'}`;
    }
  }

  // Query records from a table
  async queryRecords(request: QBQueryRequest): Promise<QBQueryResponse> {
    return this.post<QBQueryResponse>("/v1/records/query", request);
  }

  // Get a single record by ID using POST query
  async getRecord(tableId: string, recordId: string, selectFields?: number[]): Promise<QBRecord> {
    const whereClause = this.buildRecordWhereClause(recordId);
    
    const query: QBQueryRequest = {
      from: tableId,
      select: selectFields || [], // If no fields specified, will return all fields
      where: whereClause,
      options: { top: 1 }
    };

    const response = await this.queryRecords(query);
    
    if (response.data.length === 0) {
      throw new Error(`Record with ID ${recordId} not found in table ${tableId}`);
    }
    
    return response.data[0];
  }

  // Create a new record
  async createRecord(tableId: string, data: Record<string, unknown>): Promise<{ rid: number }> {
    return this.post<{ rid: number }>("/v1/records", { 
      to: tableId, 
      data: [data] 
    });
  }

  // Update an existing record
  async updateRecord(tableId: string, recordId: string, data: Record<string, unknown>): Promise<{ rid: number }> {
    return this.post<{ rid: number }>("/v1/records", { 
      to: tableId, 
      data: [{ rid: parseInt(recordId), ...data }] 
    });
  }

  // Delete a record using DELETE endpoint
  async deleteRecord(tableId: string, recordId: string): Promise<void> {
    const whereClause = this.buildRecordWhereClause(recordId);
    
    return this.delete<void>("/v1/records", {
      from: tableId,
      where: whereClause
    });
  }

  // Customer lookup by phone number (Field 148)
  async getCustomerByPhone(phone: string, tableId?: string): Promise<QBCustomer | null> {
    const targetTableId = tableId || this.appId;
    if (!targetTableId) throw new Error("Table ID is required for customer lookup");

    try {
      // Get multiple phone formats to try
      const phoneFormats = getPhoneQueryFormats(phone);
      
      // Try each format until we find a match
      for (const phoneFormat of phoneFormats) {
        const query: QBQueryRequest = {
          from: targetTableId,
          select: [QB_FIELD_IDS.CUSTOMER_PHONE, QB_FIELD_IDS.PROJECT_COORDINATOR, QB_FIELD_IDS.PROJECT_STATUS],
          where: `{${QB_FIELD_IDS.CUSTOMER_PHONE}.EX.'${phoneFormat}'}`,
          options: { top: 1 }
        };

        const response = await this.queryRecords(query);
        
        if (response.data.length > 0) {
          const record = response.data[0];
          return this.mapRecordToCustomer(record);
        }
      }
      
      // No match found with any format
      return null;
    } catch (error) {
      console.error("Error looking up customer by phone:", error);
      throw new Error("Failed to lookup customer by phone");
    }
  }

  // Get customer by ID
  async getCustomerById(customerId: string, tableId?: string): Promise<QBCustomer | null> {
    const targetTableId = tableId || this.appId;
    if (!targetTableId) throw new Error("Table ID is required for customer lookup");

    try {
      const record = await this.getRecord(targetTableId, customerId);
      return this.mapRecordToCustomer(record);
    } catch (error) {
      console.error("Error looking up customer by ID:", error);
      return null;
    }
  }

  // Get customer by email
  async getCustomerByEmail(email: string, tableId?: string, emailFieldId?: string): Promise<QBCustomer | null> {
    const targetTableId = tableId || this.appId;
    if (!targetTableId) throw new Error("Table ID is required for customer lookup");

    try {
      // Use provided email field ID or default to field 3 (common email field)
      const emailFid = emailFieldId || process.env.QUICKBASE_FID_EMAIL || "3";
      
      const query: QBQueryRequest = {
        from: targetTableId,
        select: [QB_FIELD_IDS.CUSTOMER_PHONE, QB_FIELD_IDS.PROJECT_COORDINATOR, QB_FIELD_IDS.PROJECT_STATUS, parseInt(emailFid)],
        where: `{${emailFid}.EX.'${email}'}`,
        options: { top: 1 }
      };

      const response = await this.queryRecords(query);
      
      if (response.data.length === 0) {
        return null;
      }

      const record = response.data[0];
      return this.mapRecordToCustomer(record);
    } catch (error) {
      console.error("Error looking up customer by email:", error);
      return null;
    }
  }

  // Get assigned Project Coordinator (Field 346)
  async getAssignedPC(customerId: string, tableId?: string): Promise<QBProjectCoordinator | null> {
    const targetTableId = tableId || this.appId;
    if (!targetTableId) throw new Error("Table ID is required for PC lookup");

    try {
      const customer = await this.getCustomerById(customerId, targetTableId);
      if (!customer?.projectCoordinatorId) {
        return null;
      }

      // Look up PC details in PC table
      const pcQuery: QBQueryRequest = {
        from: this.tableIds.pc,
        select: [
          parseInt(this.fieldIds.pc.id), 
          parseInt(this.fieldIds.pc.name), 
          parseInt(this.fieldIds.pc.email), 
          parseInt(this.fieldIds.pc.phone), 
          parseInt(this.fieldIds.pc.availability),
          parseInt(this.fieldIds.pc.assignedCustomers),
          parseInt(this.fieldIds.pc.workload)
        ],
        where: `{${this.fieldIds.pc.id}.EX.'${customer.projectCoordinatorId}'}`,
        options: { top: 1 }
      };

      const response = await this.queryRecords(pcQuery);
      
      if (response.data.length === 0) {
        return null;
      }

      return this.mapRecordToProjectCoordinator(response.data[0]);
    } catch (error) {
      console.error("Error looking up assigned PC:", error);
      return null;
    }
  }

  // Get Project Coordinator by email
  async getPCByEmail(email: string, tableId?: string): Promise<QBProjectCoordinator | null> {
    const targetTableId = tableId || this.tableIds.pc;
    if (!targetTableId) throw new Error("Table ID is required for PC lookup");

    try {
      const pcQuery: QBQueryRequest = {
        from: targetTableId,
        select: [
          parseInt(this.fieldIds.pc.id), 
          parseInt(this.fieldIds.pc.name), 
          parseInt(this.fieldIds.pc.email), 
          parseInt(this.fieldIds.pc.phone), 
          parseInt(this.fieldIds.pc.availability),
          parseInt(this.fieldIds.pc.assignedCustomers),
          parseInt(this.fieldIds.pc.workload)
        ],
        where: `{${this.fieldIds.pc.email}.EX.'${email}'}`,
        options: { top: 1 }
      };

      const response = await this.queryRecords(pcQuery);
      
      if (response.data.length === 0) {
        return null;
      }

      return this.mapRecordToProjectCoordinator(response.data[0]);
    } catch (error) {
      console.error("Error looking up PC by email:", error);
      return null;
    }
  }

  // Log communication activity
  async logCommunication(communication: QBCommunication, tableId?: string): Promise<{ rid: number }> {
    const targetTableId = tableId || this.tableIds.communications;
    if (!targetTableId) throw new Error("Table ID is required for communication logging");

    try {
      const data = {
        [this.fieldIds.communications.customer]: communication.customerId,
        [this.fieldIds.communications.type]: communication.type,
        [this.fieldIds.communications.direction]: communication.direction,
        [this.fieldIds.communications.timestamp]: communication.timestamp.toISOString(),
        [this.fieldIds.communications.duration]: communication.duration,
        [this.fieldIds.communications.agent]: communication.agentId,
        [this.fieldIds.communications.notes]: communication.notes,
        [this.fieldIds.communications.recording]: communication.recordingUrl,
        [this.fieldIds.communications.status]: communication.status
      };

      return await this.createRecord(targetTableId, data);
    } catch (error) {
      console.error("Error logging communication:", error);
      throw new Error("Failed to log communication activity");
    }
  }

  // Get project stage (Field 255)
  async getProjectStage(customerId: string, tableId?: string): Promise<string | null> {
    const targetTableId = tableId || this.appId;
    if (!targetTableId) throw new Error("Table ID is required for project lookup");

    try {
      const customer = await this.getCustomerById(customerId, targetTableId);
      return customer?.projectStatus || null;
    } catch (error) {
      console.error("Error getting project stage:", error);
      return null;
    }
  }

  // Get project details
  async getProjectDetails(customerId: string, tableId?: string): Promise<QBProject | null> {
    const targetTableId = tableId || this.tableIds.projects;
    if (!targetTableId) throw new Error("Table ID is required for project lookup");

    try {
      const projectQuery: QBQueryRequest = {
        from: targetTableId,
        select: [
          parseInt(this.fieldIds.projects.id),
          parseInt(this.fieldIds.projects.customerId),
          parseInt(this.fieldIds.projects.status),
          parseInt(this.fieldIds.projects.stage),
          parseInt(this.fieldIds.projects.startDate),
          parseInt(this.fieldIds.projects.endDate),
          parseInt(this.fieldIds.projects.coordinatorId)
        ],
        where: `{${this.fieldIds.projects.customerId}.EX.'${customerId}'}`,
        options: { top: 1 }
      };

      const response = await this.queryRecords(projectQuery);
      
      if (response.data.length === 0) {
        return null;
      }

      return this.mapRecordToProject(response.data[0]);
    } catch (error) {
      console.error("Error getting project details:", error);
      return null;
    }
  }

  // Helper methods to map QB records to typed objects
  private mapRecordToCustomer(record: QBRecord): QBCustomer {
    return {
      id: record.rid?.toString() || "",
      name: (record.fid_1 as string) || "", // Adjust field IDs as needed
      phone: (record[`fid_${QB_FIELD_IDS.CUSTOMER_PHONE}`] as string) || "",
      email: (record.fid_3 as string) || undefined,
      address: (record.fid_4 as string) || undefined,
      projectCoordinatorId: (record[`fid_${QB_FIELD_IDS.PROJECT_COORDINATOR}`] as string) || undefined,
      projectStatus: (record[`fid_${QB_FIELD_IDS.PROJECT_STATUS}`] as string) || undefined,
      lastContact: record.fid_5 ? new Date(record.fid_5 as string) : undefined,
      communicationCount: (record.fid_6 as number) || 0
    };
  }

  private mapRecordToProjectCoordinator(record: QBRecord): QBProjectCoordinator {
    const idField = `fid_${this.fieldIds.pc.id}` as const;
    const nameField = `fid_${this.fieldIds.pc.name}` as const;
    const emailField = `fid_${this.fieldIds.pc.email}` as const;
    const phoneField = `fid_${this.fieldIds.pc.phone}` as const;
    const availabilityField = `fid_${this.fieldIds.pc.availability}` as const;
    const assignedCustomersField = `fid_${this.fieldIds.pc.assignedCustomers}` as const;
    const workloadField = `fid_${this.fieldIds.pc.workload}` as const;
    
    return {
      id: record.rid?.toString() || "",
      name: (record[nameField] as string) || "",
      email: (record[emailField] as string) || "",
      phone: (record[phoneField] as string) || undefined,
      availability: (record[availabilityField] as string) || "offline",
      assignedCustomers: (record[assignedCustomersField] as string)?.split(",") || [],
      workload: (record[workloadField] as number) || 0
    };
  }

  private mapRecordToProject(record: QBRecord): QBProject {
    const idField = `fid_${this.fieldIds.projects.id}` as const;
    const customerIdField = `fid_${this.fieldIds.projects.customerId}` as const;
    const statusField = `fid_${this.fieldIds.projects.status}` as const;
    const stageField = `fid_${this.fieldIds.projects.stage}` as const;
    const startDateField = `fid_${this.fieldIds.projects.startDate}` as const;
    const endDateField = `fid_${this.fieldIds.projects.endDate}` as const;
    const coordinatorIdField = `fid_${this.fieldIds.projects.coordinatorId}` as const;
    
    return {
      id: record.rid?.toString() || "",
      customerId: (record[customerIdField] as string) || "",
      status: (record[statusField] as string) || "",
      stage: (record[stageField] as string) || "",
      startDate: record[startDateField] ? new Date(record[startDateField] as string) : undefined,
      endDate: record[endDateField] ? new Date(record[endDateField] as string) : undefined,
      milestones: [], // This would need additional querying
      coordinatorId: (record[coordinatorIdField] as string) || undefined
    };
  }
}


