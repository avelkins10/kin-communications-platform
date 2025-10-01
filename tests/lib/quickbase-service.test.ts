import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { quickbaseService, QuickBaseService } from '@/lib/quickbase/service';
import { Call, Message, Voicemail, Contact, User } from '@prisma/client';
import { QBCustomer, QBCommunication } from '@/types/quickbase';

// Mock the QuickbaseClient
vi.mock('@/lib/quickbase/client', () => ({
  QuickbaseClient: vi.fn().mockImplementation(() => ({
    getCustomerByPhone: vi.fn(),
    getAssignedPC: vi.fn(),
    logCommunication: vi.fn()
  }))
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    call: {
      findUnique: vi.fn()
    },
    message: {
      findUnique: vi.fn()
    },
    voicemail: {
      findUnique: vi.fn()
    }
  }
}));

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn()
}));

describe('QuickbaseService', () => {
  let mockQuickbaseClient: any;
  let mockPrisma: any;
  let mockSentry: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Get mock instances
    const { QuickbaseClient } = require('@/lib/quickbase/client');
    mockQuickbaseClient = new QuickbaseClient();
    
    const { prisma } = require('@/lib/db');
    mockPrisma = prisma;
    
    const Sentry = require('@sentry/nextjs');
    mockSentry = Sentry;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findCustomerByPhone', () => {
    it('should successfully find customer with valid phone number', async () => {
      const mockQBCustomer: QBCustomer = {
        id: 'qb123',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        projectCoordinatorId: 'pc123',
        projectStatus: 'PRE_PTO'
      };

      const mockCoordinator = {
        id: 'pc123',
        name: 'Jane Smith',
        email: 'jane@example.com',
        availability: 'available' as const,
        assignedCustomers: ['qb123'],
        workload: 5
      };

      mockQuickbaseClient.getCustomerByPhone.mockResolvedValue(mockQBCustomer);
      mockQuickbaseClient.getAssignedPC.mockResolvedValue(mockCoordinator);

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toEqual({
        id: 'qb123',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        type: 'CUSTOMER',
        projectStatus: 'PRE_PTO',
        projectCoordinator: {
          id: 'pc123',
          name: 'Jane Smith',
          email: 'jane@example.com',
          department: null
        },
        department: null,
        notes: null,
        tags: [],
        quickbaseId: 'qb123',
        isFavorite: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        statusCategory: 'ACTIVE',
        isStale: false,
        unreadCount: 0,
        lastContact: null
      });

      expect(mockQuickbaseClient.getCustomerByPhone).toHaveBeenCalledWith('+1234567890', undefined);
      expect(mockQuickbaseClient.getAssignedPC).toHaveBeenCalledWith('qb123', undefined);
    });

    it('should return null when customer not found', async () => {
      mockQuickbaseClient.getCustomerByPhone.mockResolvedValue(null);

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toBeNull();
      expect(mockQuickbaseClient.getCustomerByPhone).toHaveBeenCalledWith('+1234567890', undefined);
    });

    it('should handle customer without project coordinator', async () => {
      const mockQBCustomer: QBCustomer = {
        id: 'qb123',
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com'
      };

      mockQuickbaseClient.getCustomerByPhone.mockResolvedValue(mockQBCustomer);

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result?.projectCoordinator).toBeNull();
      expect(mockQuickbaseClient.getAssignedPC).not.toHaveBeenCalled();
    });

    it('should handle Quickbase API errors gracefully', async () => {
      const error = new Error('Quickbase API error');
      mockQuickbaseClient.getCustomerByPhone.mockRejectedValue(error);

      const result = await quickbaseService.findCustomerByPhone('+1234567890');

      expect(result).toBeNull();
      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'quickbase',
        message: 'Customer lookup failed',
        level: 'error',
        data: { operation: 'findCustomerByPhone', error: 'Quickbase API error' }
      });
    });
  });

  describe('logCallToQuickbase', () => {
    const mockCall: Call = {
      id: 'call123',
      callSid: 'CA123',
      from: '+1234567890',
      to: '+0987654321',
      direction: 'INBOUND',
      status: 'COMPLETED',
      durationSec: 120,
      recordingUrl: 'https://example.com/recording.mp3',
      startedAt: new Date('2023-01-01T10:00:00Z'),
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:02:00Z'),
      contactId: 'contact123',
      userId: 'user123'
    } as Call;

    const mockContact: Contact = {
      id: 'contact123',
      quickbaseId: 'qb123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      email: 'john@example.com',
      type: 'CUSTOMER',
      organization: 'Acme Corp',
      department: 'Sales',
      notes: 'VIP customer',
      tags: ['vip'],
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: null,
      projectStatus: 'PRE_PTO',
      statusCategory: 'ACTIVE',
      isStale: false,
      unreadCount: 0,
      lastContactDate: null,
      lastContactBy: null,
      lastContactDepartment: null,
      lastContactType: null,
      voicemailCallbackDue: null,
      textResponseDue: null,
      missedCallFollowupDue: null,
      projectCoordinatorId: null
    } as Contact;

    const mockUser: User = {
      id: 'user123',
      email: 'agent@example.com',
      name: 'Agent Smith',
      quickbaseUserId: 'qbuser123',
      passwordHash: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      twilioWorkerSid: null,
      skills: [],
      department: 'Support'
    } as User;

    it('should successfully log call with all data', async () => {
      mockQuickbaseClient.logCommunication.mockResolvedValue({ rid: 123 });

      await quickbaseService.logCallToQuickbase(mockCall, mockContact, mockUser);

      expect(mockQuickbaseClient.logCommunication).toHaveBeenCalledWith({
        id: 'call123',
        customerId: 'qb123',
        type: 'call',
        direction: 'inbound',
        timestamp: mockCall.startedAt,
        duration: 120,
        agentId: 'qbuser123',
        recordingUrl: 'https://example.com/recording.mp3',
        status: 'completed',
        notes: 'CallSid: CA123, From: +1234567890, To: +0987654321'
      });
    });

    it('should skip logging when contact has no Quickbase ID', async () => {
      const contactWithoutQB = { ...mockContact, quickbaseId: null };

      await quickbaseService.logCallToQuickbase(mockCall, contactWithoutQB, mockUser);

      expect(mockQuickbaseClient.logCommunication).not.toHaveBeenCalled();
    });

    it('should handle logging without contact', async () => {
      await quickbaseService.logCallToQuickbase(mockCall, undefined, mockUser);

      expect(mockQuickbaseClient.logCommunication).not.toHaveBeenCalled();
    });

    it('should handle logging without user', async () => {
      mockQuickbaseClient.logCommunication.mockResolvedValue({ rid: 123 });

      await quickbaseService.logCallToQuickbase(mockCall, mockContact, undefined);

      expect(mockQuickbaseClient.logCommunication).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: undefined
        })
      );
    });

    it('should handle different call statuses', async () => {
      const testCases = [
        { status: 'COMPLETED', expected: 'completed' },
        { status: 'FAILED', expected: 'failed' },
        { status: 'MISSED', expected: 'missed' },
        { status: 'BUSY', expected: 'failed' },
        { status: 'NO-ANSWER', expected: 'failed' }
      ];

      for (const testCase of testCases) {
        const callWithStatus = { ...mockCall, status: testCase.status };
        mockQuickbaseClient.logCommunication.mockResolvedValue({ rid: 123 });

        await quickbaseService.logCallToQuickbase(callWithStatus, mockContact, mockUser);

        expect(mockQuickbaseClient.logCommunication).toHaveBeenCalledWith(
          expect.objectContaining({
            status: testCase.expected
          })
        );
      }
    });

    it('should handle Quickbase logging errors gracefully', async () => {
      const error = new Error('Quickbase logging failed');
      mockQuickbaseClient.logCommunication.mockRejectedValue(error);

      await quickbaseService.logCallToQuickbase(mockCall, mockContact, mockUser);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'quickbase',
        message: 'Call logging failed',
        level: 'error',
        data: { callSid: 'CA123', error: 'Quickbase logging failed' }
      });
    });
  });

  describe('logVoicemailToQuickbase', () => {
    const mockVoicemail: Voicemail = {
      id: 'vm123',
      callId: 'call123',
      audioUrl: 'https://example.com/voicemail.mp3',
      fromNumber: '+1234567890',
      duration: 60,
      contactId: 'contact123',
      priority: 'HIGH',
      transcription: 'Hello, this is a test voicemail',
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:01:00Z')
    } as Voicemail;

    const mockCall: Call = {
      id: 'call123',
      direction: 'INBOUND',
      status: 'VOICEMAIL'
    } as Call;

    const mockContact: Contact = {
      id: 'contact123',
      quickbaseId: 'qb123'
    } as Contact;

    const mockUser: User = {
      id: 'user123',
      quickbaseUserId: 'qbuser123'
    } as User;

    it('should successfully log voicemail with transcription', async () => {
      mockQuickbaseClient.logCommunication.mockResolvedValue({ rid: 123 });

      await quickbaseService.logVoicemailToQuickbase(mockVoicemail, mockCall, mockContact, mockUser);

      expect(mockQuickbaseClient.logCommunication).toHaveBeenCalledWith({
        id: 'vm123',
        customerId: 'qb123',
        type: 'voicemail',
        direction: 'inbound',
        timestamp: mockVoicemail.createdAt,
        duration: 60,
        agentId: 'qbuser123',
        recordingUrl: 'https://example.com/voicemail.mp3',
        status: 'completed',
        notes: 'Voicemail transcription: Hello, this is a test voicemail, Priority: HIGH'
      });
    });

    it('should handle voicemail without transcription', async () => {
      const voicemailWithoutTranscription = { ...mockVoicemail, transcription: null };
      mockQuickbaseClient.logCommunication.mockResolvedValue({ rid: 123 });

      await quickbaseService.logVoicemailToQuickbase(voicemailWithoutTranscription, mockCall, mockContact, mockUser);

      expect(mockQuickbaseClient.logCommunication).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Voicemail transcription: Not available, Priority: HIGH'
        })
      );
    });

    it('should skip logging when contact has no Quickbase ID', async () => {
      const contactWithoutQB = { ...mockContact, quickbaseId: null };

      await quickbaseService.logVoicemailToQuickbase(mockVoicemail, mockCall, contactWithoutQB, mockUser);

      expect(mockQuickbaseClient.logCommunication).not.toHaveBeenCalled();
    });
  });

  describe('logSMSToQuickbase', () => {
    const mockMessage: Message = {
      id: 'msg123',
      body: 'Hello, this is a test message',
      direction: 'INBOUND',
      status: 'DELIVERED',
      sentAt: new Date('2023-01-01T10:00:00Z'),
      createdAt: new Date('2023-01-01T10:00:00Z'),
      updatedAt: new Date('2023-01-01T10:00:00Z'),
      contactId: 'contact123',
      userId: 'user123'
    } as Message;

    const mockContact: Contact = {
      id: 'contact123',
      quickbaseId: 'qb123'
    } as Contact;

    const mockUser: User = {
      id: 'user123',
      quickbaseUserId: 'qbuser123'
    } as User;

    it('should successfully log SMS message', async () => {
      mockQuickbaseClient.logCommunication.mockResolvedValue({ rid: 123 });

      await quickbaseService.logSMSToQuickbase(mockMessage, mockContact, mockUser);

      expect(mockQuickbaseClient.logCommunication).toHaveBeenCalledWith({
        id: 'msg123',
        customerId: 'qb123',
        type: 'sms',
        direction: 'inbound',
        timestamp: mockMessage.sentAt,
        duration: undefined,
        agentId: 'qbuser123',
        recordingUrl: undefined,
        status: 'completed',
        notes: 'SMS Body: Hello, this is a test message'
      });
    });

    it('should truncate long message body', async () => {
      const longMessage = {
        ...mockMessage,
        body: 'A'.repeat(600) // Longer than 500 character limit
      };
      mockQuickbaseClient.logCommunication.mockResolvedValue({ rid: 123 });

      await quickbaseService.logSMSToQuickbase(longMessage, mockContact, mockUser);

      expect(mockQuickbaseClient.logCommunication).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.stringMatching(/^SMS Body: A{500}/)
        })
      );
    });

    it('should handle different message statuses', async () => {
      const testCases = [
        { status: 'DELIVERED', expected: 'completed' },
        { status: 'SENT', expected: 'completed' },
        { status: 'FAILED', expected: 'failed' },
        { status: 'UNDELIVERED', expected: 'failed' }
      ];

      for (const testCase of testCases) {
        const messageWithStatus = { ...mockMessage, status: testCase.status };
        mockQuickbaseClient.logCommunication.mockResolvedValue({ rid: 123 });

        await quickbaseService.logSMSToQuickbase(messageWithStatus, mockContact, mockUser);

        expect(mockQuickbaseClient.logCommunication).toHaveBeenCalledWith(
          expect.objectContaining({
            status: testCase.expected
          })
        );
      }
    });
  });

  describe('validateQuickbaseConfig', () => {
    it('should return valid for correct configuration', () => {
      // Mock environment variables
      vi.stubEnv('QUICKBASE_REALM', 'test-realm');
      vi.stubEnv('QUICKBASE_USER_TOKEN', 'test-token');
      vi.stubEnv('QUICKBASE_APP_ID', 'test-app-id');
      vi.stubEnv('QUICKBASE_BASE_URL', 'https://api.quickbase.com/v1');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for missing realm', () => {
      vi.stubEnv('QUICKBASE_REALM', '');
      vi.stubEnv('QUICKBASE_USER_TOKEN', 'test-token');
      vi.stubEnv('QUICKBASE_APP_ID', 'test-app-id');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('QUICKBASE_REALM is required');
    });

    it('should return invalid for missing user token', () => {
      vi.stubEnv('QUICKBASE_REALM', 'test-realm');
      vi.stubEnv('QUICKBASE_USER_TOKEN', '');
      vi.stubEnv('QUICKBASE_APP_ID', 'test-app-id');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('QUICKBASE_USER_TOKEN is required');
    });

    it('should return invalid for missing app ID and table ID', () => {
      vi.stubEnv('QUICKBASE_REALM', 'test-realm');
      vi.stubEnv('QUICKBASE_USER_TOKEN', 'test-token');
      vi.stubEnv('QUICKBASE_APP_ID', '');
      vi.stubEnv('QUICKBASE_TABLE_ID', '');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Either QUICKBASE_APP_ID or QUICKBASE_TABLE_ID is required');
    });

    it('should return invalid for invalid base URL', () => {
      vi.stubEnv('QUICKBASE_REALM', 'test-realm');
      vi.stubEnv('QUICKBASE_USER_TOKEN', 'test-token');
      vi.stubEnv('QUICKBASE_APP_ID', 'test-app-id');
      vi.stubEnv('QUICKBASE_BASE_URL', 'not-a-url');

      const result = QuickBaseService.validateQuickbaseConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('QUICKBASE_BASE_URL must be a valid URL');
    });
  });

  describe('error handling', () => {
    it('should not throw errors from logging methods', async () => {
      const mockCall: Call = {
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
      } as Call;

      const mockContact: Contact = {
        id: 'contact123',
        quickbaseId: 'qb123'
      } as Contact;

      // Mock QuickbaseClient to throw error
      mockQuickbaseClient.logCommunication.mockRejectedValue(new Error('Quickbase error'));

      // Should not throw
      await expect(quickbaseService.logCallToQuickbase(mockCall, mockContact, undefined)).resolves.not.toThrow();
    });

    it('should add Sentry breadcrumbs on errors', async () => {
      const mockCall: Call = {
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
      } as Call;

      const mockContact: Contact = {
        id: 'contact123',
        quickbaseId: 'qb123'
      } as Contact;

      const error = new Error('Quickbase error');
      mockQuickbaseClient.logCommunication.mockRejectedValue(error);

      await quickbaseService.logCallToQuickbase(mockCall, mockContact, undefined);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'quickbase',
        message: 'Call logging failed',
        level: 'error',
        data: { callSid: 'CA123', error: 'Quickbase error' }
      });
    });
  });
});
