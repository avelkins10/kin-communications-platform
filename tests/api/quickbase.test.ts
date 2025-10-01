import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { quickbaseService, QuickBaseService } from '@/lib/quickbase/service';
import { QBCustomer, QBCommunication } from '@/types/quickbase';

// Mock Quickbase API
const mockQuickbaseAPI = {
  customers: {
    search: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    getByPhone: vi.fn()
  },
  projects: {
    search: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  activities: {
    create: vi.fn(),
    search: vi.fn()
  },
  communications: {
    log: vi.fn()
  }
};

// Mock the Quickbase service
vi.mock('@/lib/quickbase', () => ({
  QuickbaseService: vi.fn().mockImplementation(() => mockQuickbaseAPI)
}));

describe('Quickbase API Integration', () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    
    // Clear mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('Customer Lookup', () => {
    it('should search customers by phone number', async () => {
      const mockCustomer = {
        id: 'QB_CUSTOMER_1',
        name: 'Test Company 1',
        phone: '+15551234567',
        email: 'customer1@example.com',
        address: '123 Test St, Test City, TC 12345',
        serviceType: 'residential',
        status: 'active'
      };

      mockQuickbaseAPI.customers.search.mockResolvedValue([mockCustomer]);

      const response = await fetch('/api/quickbase/customers?phone=+15551234567');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject(mockCustomer);
      expect(mockQuickbaseAPI.customers.search).toHaveBeenCalledWith({
        phone: '+15551234567'
      });
    });

    it('should handle customer search errors gracefully', async () => {
      mockQuickbaseAPI.customers.search.mockRejectedValue(new Error('Quickbase API Error'));

      const response = await fetch('/api/quickbase/customers?phone=+15551234567');
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Failed to search customers');
    });

    it('should validate phone number format', async () => {
      const response = await fetch('/api/quickbase/customers?phone=invalid-phone');
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid phone number format');
    });
  });

  describe('Project Management', () => {
    it('should create new project', async () => {
      const projectData = {
        customerId: 'QB_CUSTOMER_1',
        name: 'Service Call - Test Company 1',
        status: 'scheduled',
        assignedTo: 'Field Crew Member',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        description: 'Routine service call'
      };

      const mockProject = {
        id: 'QB_PROJECT_1',
        ...projectData
      };

      mockQuickbaseAPI.projects.create.mockResolvedValue(mockProject);

      const response = await fetch('/api/quickbase/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject(mockProject);
      expect(mockQuickbaseAPI.projects.create).toHaveBeenCalledWith(projectData);
    });

    it('should update project status', async () => {
      const projectId = 'QB_PROJECT_1';
      const updateData = { status: 'in_progress' };

      mockQuickbaseAPI.projects.update.mockResolvedValue({
        id: projectId,
        ...updateData
      });

      const response = await fetch(`/api/quickbase/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('in_progress');
      expect(mockQuickbaseAPI.projects.update).toHaveBeenCalledWith(projectId, updateData);
    });
  });

  describe('Activity Logging', () => {
    it('should log communication activity', async () => {
      const activityData = {
        projectId: 'QB_PROJECT_1',
        type: 'call',
        description: 'Customer called about service issue',
        timestamp: new Date().toISOString()
      };

      const mockActivity = {
        id: 'QB_ACTIVITY_1',
        ...activityData
      };

      mockQuickbaseAPI.activities.create.mockResolvedValue(mockActivity);

      const response = await fetch('/api/quickbase/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject(mockActivity);
      expect(mockQuickbaseAPI.activities.create).toHaveBeenCalledWith(activityData);
    });

    it('should search activities by project', async () => {
      const projectId = 'QB_PROJECT_1';
      const mockActivities = [
        {
          id: 'QB_ACTIVITY_1',
          projectId,
          type: 'call',
          description: 'Customer called about service issue',
          timestamp: '2024-01-01T10:00:00Z'
        }
      ];

      mockQuickbaseAPI.activities.search.mockResolvedValue(mockActivities);

      const response = await fetch(`/api/quickbase/communications?projectId=${projectId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].projectId).toBe(projectId);
      expect(mockQuickbaseAPI.activities.search).toHaveBeenCalledWith({
        projectId
      });
    });
  });

  describe('Data Synchronization', () => {
    it('should sync customer data', async () => {
      const mockCustomers = [
        {
          id: 'QB_CUSTOMER_1',
          name: 'Test Company 1',
          phone: '+15551234567',
          email: 'customer1@example.com'
        }
      ];

      mockQuickbaseAPI.customers.search.mockResolvedValue(mockCustomers);

      const response = await fetch('/api/quickbase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'customers' })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.synced).toBe(1);
    });

    it('should handle sync errors', async () => {
      mockQuickbaseAPI.customers.search.mockRejectedValue(new Error('Sync failed'));

      const response = await fetch('/api/quickbase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'customers' })
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain('Sync failed');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting gracefully', async () => {
      mockQuickbaseAPI.customers.search.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded'
      });

      const response = await fetch('/api/quickbase/customers?phone=+15551234567');
      
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toContain('Rate limit exceeded');
    });
  });

  describe('Authentication', () => {
    it('should handle authentication errors', async () => {
      mockQuickbaseAPI.customers.search.mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      });

      const response = await fetch('/api/quickbase/customers?phone=+15551234567');
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('findCustomerByPhone', () => {
    it('should successfully find customer with E.164 format phone', async () => {
      const mockQBCustomer: QBCustomer = {
        id: 'qb123',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        projectCoordinatorId: 'pc123',
        projectStatus: 'PRE_PTO'
      };

      mockQuickbaseAPI.customers.getByPhone.mockResolvedValue(mockQBCustomer);

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toBeTruthy();
      expect(result?.id).toBe('qb123');
      expect(result?.name).toBe('John Doe');
      expect(result?.type).toBe('CUSTOMER');
      expect(mockQuickbaseAPI.customers.getByPhone).toHaveBeenCalledWith('+1234567890');
    });

    it('should successfully find customer with 10-digit phone', async () => {
      const mockQBCustomer: QBCustomer = {
        id: 'qb123',
        name: 'John Doe',
        phone: '2345678901',
        email: 'john@example.com'
      };

      mockQuickbaseAPI.customers.getByPhone.mockResolvedValue(mockQBCustomer);

      const result = await quickbaseService.findCustomerByPhone('2345678901');

      expect(result).toBeTruthy();
      expect(result?.phone).toBe('2345678901');
    });

    it('should return null when customer not found', async () => {
      mockQuickbaseAPI.customers.getByPhone.mockResolvedValue(null);

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      mockQuickbaseAPI.customers.getByPhone.mockRejectedValue(new Error('API Error'));

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toBeNull();
    });
  });

  describe('Communication Logging', () => {
    const mockCall = {
      id: 'call123',
      callSid: 'CA123',
      from: '+1234567890',
      to: '+0987654321',
      direction: 'INBOUND',
      status: 'COMPLETED',
      durationSec: 120,
      recordingUrl: 'https://example.com/recording.mp3',
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      contactId: 'contact123',
      userId: 'user123'
    };

    const mockContact = {
      id: 'contact123',
      quickbaseId: 'qb123',
      firstName: 'John',
      lastName: 'Doe'
    };

    const mockUser = {
      id: 'user123',
      quickbaseUserId: 'qbuser123',
      name: 'Agent Smith'
    };

    it('should log call to Quickbase with complete data', async () => {
      mockQuickbaseAPI.communications.log.mockResolvedValue({ rid: 123 });

      await quickbaseService.logCallToQuickbase(mockCall, mockContact, mockUser);

      expect(mockQuickbaseAPI.communications.log).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'qb123',
          type: 'call',
          direction: 'inbound',
          duration: 120,
          agentId: 'qbuser123',
          status: 'completed'
        })
      );
    });

    it('should log voicemail to Quickbase', async () => {
      const mockVoicemail = {
        id: 'vm123',
        callId: 'call123',
        audioUrl: 'https://example.com/voicemail.mp3',
        duration: 60,
        transcription: 'Test voicemail',
        priority: 'HIGH',
        createdAt: new Date()
      };

      mockQuickbaseAPI.communications.log.mockResolvedValue({ rid: 123 });

      await quickbaseService.logVoicemailToQuickbase(mockVoicemail, mockCall, mockContact, mockUser);

      expect(mockQuickbaseAPI.communications.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'voicemail',
          duration: 60,
          status: 'completed',
          notes: expect.stringContaining('Test voicemail')
        })
      );
    });

    it('should log SMS to Quickbase', async () => {
      const mockMessage = {
        id: 'msg123',
        body: 'Test SMS message',
        direction: 'INBOUND',
        status: 'DELIVERED',
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        contactId: 'contact123',
        userId: 'user123'
      };

      mockQuickbaseAPI.communications.log.mockResolvedValue({ rid: 123 });

      await quickbaseService.logSMSToQuickbase(mockMessage, mockContact, mockUser);

      expect(mockQuickbaseAPI.communications.log).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sms',
          direction: 'inbound',
          status: 'completed',
          notes: expect.stringContaining('Test SMS message')
        })
      );
    });

    it('should skip logging when contact has no Quickbase ID', async () => {
      const contactWithoutQB = { ...mockContact, quickbaseId: null };

      await quickbaseService.logCallToQuickbase(mockCall, contactWithoutQB, mockUser);

      expect(mockQuickbaseAPI.communications.log).not.toHaveBeenCalled();
    });

    it('should handle logging errors gracefully', async () => {
      mockQuickbaseAPI.communications.log.mockRejectedValue(new Error('Logging failed'));

      await expect(quickbaseService.logCallToQuickbase(mockCall, mockContact, mockUser))
        .resolves.not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      vi.stubEnv('QUICKBASE_REALM', 'test-realm');
      vi.stubEnv('QUICKBASE_USER_TOKEN', 'test-token');
      vi.stubEnv('QUICKBASE_APP_ID', 'test-app-id');
      vi.stubEnv('QUICKBASE_BASE_URL', 'https://api.quickbase.com/v1');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing realm', () => {
      vi.stubEnv('QUICKBASE_REALM', '');
      vi.stubEnv('QUICKBASE_USER_TOKEN', 'test-token');
      vi.stubEnv('QUICKBASE_APP_ID', 'test-app-id');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('QUICKBASE_REALM is required');
    });

    it('should detect missing user token', () => {
      vi.stubEnv('QUICKBASE_REALM', 'test-realm');
      vi.stubEnv('QUICKBASE_USER_TOKEN', '');
      vi.stubEnv('QUICKBASE_APP_ID', 'test-app-id');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('QUICKBASE_USER_TOKEN is required');
    });

    it('should detect missing app ID and table ID', () => {
      vi.stubEnv('QUICKBASE_REALM', 'test-realm');
      vi.stubEnv('QUICKBASE_USER_TOKEN', 'test-token');
      vi.stubEnv('QUICKBASE_APP_ID', '');
      vi.stubEnv('QUICKBASE_TABLE_ID', '');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Either QUICKBASE_APP_ID or QUICKBASE_TABLE_ID is required');
    });

    it('should detect invalid base URL', () => {
      vi.stubEnv('QUICKBASE_REALM', 'test-realm');
      vi.stubEnv('QUICKBASE_USER_TOKEN', 'test-token');
      vi.stubEnv('QUICKBASE_APP_ID', 'test-app-id');
      vi.stubEnv('QUICKBASE_BASE_URL', 'not-a-url');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('QUICKBASE_BASE_URL must be a valid URL');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle 401 authentication errors', async () => {
      mockQuickbaseAPI.customers.getByPhone.mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      });

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toBeNull();
    });

    it('should handle 429 rate limiting', async () => {
      mockQuickbaseAPI.customers.getByPhone.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded'
      });

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toBeNull();
    });

    it('should handle 500 server errors', async () => {
      mockQuickbaseAPI.customers.getByPhone.mockRejectedValue({
        status: 500,
        message: 'Internal server error'
      });

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toBeNull();
    });

    it('should handle network timeouts', async () => {
      mockQuickbaseAPI.customers.getByPhone.mockRejectedValue(new Error('Network timeout'));

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toBeNull();
    });
  });
});
