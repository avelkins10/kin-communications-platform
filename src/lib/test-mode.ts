/**
 * Test Mode Utility
 * 
 * This utility provides functions to check if the application is running in test mode
 * and to bypass external API calls when testing.
 */

export const TEST_MODE = process.env.TEST_MODE === 'true' || process.env.NODE_ENV === 'test';

/**
 * Check if the application is running in test mode
 */
export function isTestMode(): boolean {
  return TEST_MODE;
}

/**
 * Execute a function only if not in test mode, otherwise return a mock response
 */
export async function executeIfNotTestMode<T>(
  externalCall: () => Promise<T>,
  mockResponse: T
): Promise<T> {
  if (isTestMode()) {
    console.log('[TEST_MODE] Bypassing external call, returning mock response');
    return mockResponse;
  }
  
  return await externalCall();
}

/**
 * Execute a function only if not in test mode, otherwise return a mock response (sync version)
 */
export function executeIfNotTestModeSync<T>(
  externalCall: () => T,
  mockResponse: T
): T {
  if (isTestMode()) {
    console.log('[TEST_MODE] Bypassing external call, returning mock response');
    return mockResponse;
  }
  
  return externalCall();
}

/**
 * Mock responses for common external services
 */
export const MOCK_RESPONSES = {
  // Twilio mock responses
  twilio: {
    call: {
      sid: 'CA_TEST_' + Date.now(),
      status: 'ringing',
      direction: 'outbound',
      from: '+15551234567',
      to: '+15559876543',
      startTime: new Date().toISOString(),
    },
    message: {
      sid: 'SM_TEST_' + Date.now(),
      status: 'sent',
      direction: 'outbound',
      from: '+15551234567',
      to: '+15559876543',
      body: 'Test message',
      dateCreated: new Date().toISOString(),
    },
    recording: {
      sid: 'RE_TEST_' + Date.now(),
      status: 'completed',
      duration: '120',
      url: 'https://api.twilio.com/test/recording.mp3',
    }
  },
  
  // Quickbase mock responses
  quickbase: {
    customer: {
      id: 'test-customer-123',
      name: 'Test Customer',
      phone: '+15551234567',
      email: 'test@example.com',
      address: '123 Test St, Test City, TC 12345',
      lastContact: new Date().toISOString(),
      communicationCount: 5,
    },
    projectCoordinator: {
      id: 'test-pc-123',
      name: 'Test Project Coordinator',
      email: 'pc@example.com',
      phone: '+15559876543',
      availability: 'available',
      workload: 10,
    },
    project: {
      id: 'test-project-123',
      status: 'active',
      stage: 'planning',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  },
  
  // TaskRouter mock responses
  taskRouter: {
    task: {
      sid: 'WT_TEST_' + Date.now(),
      assignmentStatus: 'pending',
      attributes: {
        type: 'support',
        customer: 'Test Customer',
        priority: 'normal',
      },
      dateCreated: new Date().toISOString(),
    },
    worker: {
      sid: 'WK_TEST_' + Date.now(),
      friendlyName: 'Test Worker',
      activitySid: 'WA_available',
      attributes: {
        skills: ['support', 'sales'],
        languages: ['en'],
      },
    }
  }
};

/**
 * Generate a mock Twilio CallSid
 */
export function generateMockTwilioCallSid(): string {
  return `CA_TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a mock Twilio MessageSid
 */
export function generateMockTwilioMessageSid(): string {
  return `SM_TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a mock Twilio RecordingSid
 */
export function generateMockTwilioRecordingSid(): string {
  return `RE_TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a mock TaskRouter TaskSid
 */
export function generateMockTaskSid(): string {
  return `WT_TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a mock TaskRouter WorkerSid
 */
export function generateMockWorkerSid(): string {
  return `WK_TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log test mode activity
 */
export function logTestModeActivity(service: string, action: string, details?: any): void {
  if (isTestMode()) {
    console.log(`[TEST_MODE] ${service}: ${action}`, details ? JSON.stringify(details, null, 2) : '');
  }
}
