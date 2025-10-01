// KIN Communications Platform - QA Helpers
// Comprehensive test utilities for E2E testing with simulation capabilities

import { Page, expect } from '@playwright/test';
import { TEST_CONFIG, AuthHelper, DatabaseHelper, TestUtils } from './test-helpers';
import TD from './test-data';

// Test mode configuration
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';
const BASE_URL = TEST_CONFIG.baseUrl;

// Twilio signature computation helper
export function computeTwilioSignature(url: string, params: Record<string, string>, authToken: string): string {
  const crypto = require('crypto');
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  const signature = crypto
    .createHmac('sha1', authToken)
    .update(url + sortedParams)
    .digest('base64');
  return signature;
}

// Main QA helpers object
export const qaHelpers = {
  // Data seeding and cleanup
  async seedTestData() {
    const db = new DatabaseHelper();
    try {
      // Create test users
      const users = {};
      for (const [role, userData] of Object.entries(TD.TEST_USERS)) {
        users[role] = await db.createTestUser(userData);
      }

      // Create test contacts
      const contacts = {};
      for (const [key, contactData] of Object.entries(TD.TEST_CONTACTS)) {
        contacts[key] = await db.createTestContact(contactData);
      }

      // Create test calls
      const calls = {};
      for (const [key, callData] of Object.entries(TD.TEST_CALLS)) {
        calls[key] = await db.createTestCall(callData);
      }

      // Create test messages
      const messages = {};
      for (const [key, messageData] of Object.entries(TD.TEST_MESSAGES)) {
        messages[key] = await db.createTestMessage(messageData);
      }

      // Create test voicemails
      const voicemails = {};
      for (const [key, voicemailData] of Object.entries(TD.TEST_VOICEMAILS)) {
        voicemails[key] = await db.createTestVoicemail(voicemailData);
      }

      return {
        users,
        contacts,
        calls,
        messages,
        voicemails,
        quickbase: TD.TEST_QUICKBASE_DATA,
        taskrouter: TD.TEST_TASKROUTER_DATA,
        admin: TD.TEST_ADMIN_CONFIGURATION
      };
    } finally {
      await db.cleanup();
    }
  },

  async setupTestEnvironment(page: Page) {
    // Set base URL and clear any existing state
    await page.goto(BASE_URL);
    
    // Clear localStorage and sessionStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Set test mode flag
    await page.addInitScript(() => {
      window.TEST_MODE = true;
    });

    // Wait for any initial loading to complete
    await page.waitForLoadState('networkidle');
  },

  async cleanupTestData() {
    const db = new DatabaseHelper();
    try {
      // Clean up test data in reverse order of creation
      await db.prisma.voicemail.deleteMany({
        where: { sid: { startsWith: 'VM_test_' } }
      });
      await db.prisma.message.deleteMany({
        where: { sid: { startsWith: 'SM_test_' } }
      });
      await db.prisma.call.deleteMany({
        where: { sid: { startsWith: 'CA_test_' } }
      });
      await db.prisma.contact.deleteMany({
        where: { phone: { startsWith: '+1555' } }
      });
      await db.prisma.user.deleteMany({
        where: { email: { contains: '@example.com' } }
      });
    } finally {
      await db.cleanup();
    }
  },

  // Authentication helpers
  loginAs: (page: Page, role: 'admin' | 'agent' | 'supervisor') => 
    AuthHelper.loginAs(page, role),

  // Simulation helpers - these POST to test-only API endpoints
  // Overloaded method to handle both signatures
  async simulateInboundCall(phoneNumberOrOpts: string | { phone: string; time?: string; context?: string }, contextOrOpts?: string | { time?: string; context?: string }) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    let phoneNumber: string;
    let context: string;
    let time: string | undefined;

    if (typeof phoneNumberOrOpts === 'string') {
      // Legacy signature: simulateInboundCall(phoneNumber, context)
      phoneNumber = phoneNumberOrOpts;
      context = typeof contextOrOpts === 'string' ? contextOrOpts : 'Test inbound call simulation';
    } else {
      // New object signature: simulateInboundCall({ phone, time?, context? })
      phoneNumber = phoneNumberOrOpts.phone;
      context = phoneNumberOrOpts.context || 'Test inbound call simulation';
      time = phoneNumberOrOpts.time;
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: phoneNumber,
        to: TEST_CONFIG.testPhoneNumbers.main,
        direction: 'inbound',
        context,
        time
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate inbound call: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateInboundSMS(phoneNumber: string, message: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: phoneNumber,
        to: TEST_CONFIG.testPhoneNumbers.main,
        body: message,
        direction: 'inbound'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate inbound SMS: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateVoicemail(phoneNumber: string, transcription: string, duration: number = 30) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/voicemail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: phoneNumber,
        to: TEST_CONFIG.testPhoneNumbers.main,
        transcription,
        duration,
        recordingUrl: `https://test.example.com/voicemails/test_${Date.now()}.mp3`
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate voicemail: ${response.statusText}`);
    }

    return response.json();
  },

  // Overloaded method to handle both signatures
  async simulateMessageStatusUpdate(messageSidOrStatus: string, status?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    let messageSid: string;
    let actualStatus: string;

    if (status === undefined) {
      // Called with just status - resolve latest message SID
      const resolveResponse = await fetch(`${BASE_URL}/api/test/resolve/latest-message`);
      if (!resolveResponse.ok) {
        throw new Error('Failed to resolve latest message SID');
      }
      const resolveData = await resolveResponse.json();
      messageSid = resolveData.messageSid;
      actualStatus = messageSidOrStatus;
    } else {
      // Called with both messageSid and status
      messageSid = messageSidOrStatus;
      actualStatus = status;
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/message-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageSid,
        status: actualStatus,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate message status update: ${response.statusText}`);
    }

    return response.json();
  },

  // Overloaded method to handle both signatures
  async simulateQueueUpdate(opts?: { queue?: string; count?: number; availableAgents?: number; averageWaitTime?: number } | { queueCount?: number }) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    let queueId: string;
    let waitingCount: number;
    let availableAgents: number;
    let averageWaitTime: number | undefined;

    if (opts && 'queueCount' in opts) {
      // Legacy signature: simulateQueueUpdate({ queueCount: 5 })
      queueId = 'support_queue';
      waitingCount = opts.queueCount;
      availableAgents = 1;
    } else if (opts) {
      // New object signature: simulateQueueUpdate({ queue, count, availableAgents, averageWaitTime })
      queueId = opts.queue || 'support_queue';
      waitingCount = opts.count || 0;
      availableAgents = opts.availableAgents || 1;
      averageWaitTime = opts.averageWaitTime;
    } else {
      // Default values
      queueId = 'support_queue';
      waitingCount = 0;
      availableAgents = 1;
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/queue-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queueId,
        waitingCount,
        availableAgents,
        averageWaitTime,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate queue update: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateHighLoad(concurrentUsers: number = 50) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/high-load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concurrentUsers,
        duration: 30000, // 30 seconds
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate high load: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateWebhookFailure(webhookType: string = 'voice') {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/webhook-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhookType,
        errorType: 'timeout',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate webhook failure: ${response.statusText}`);
    }

    return response.json();
  },

  // Webhook testing helpers
  async testWebhookWithSignature(url: string, payload: Record<string, any>, authToken: string) {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      params.append(key, String(value));
    });

    const signature = computeTwilioSignature(url, Object.fromEntries(params), authToken);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      body: params.toString()
    });

    return response;
  },

  // Helper to create form data and signature for webhook tests
  createWebhookTestData(payload: Record<string, any>, endpoint: string, authToken?: string) {
    const webhookUrl = `${BASE_URL}${endpoint}`;
    const token = authToken || process.env.TWILIO_AUTH_TOKEN || 'test-auth-token';
    
    const formData = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const signature = computeTwilioSignature(webhookUrl, payload, token);

    return {
      formData: formData.toString(),
      signature,
      webhookUrl
    };
  },

  // Performance testing helpers
  async measurePageLoadTime(page: Page, url: string): Promise<number> {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    return endTime - startTime;
  },

  async measureApiResponseTime(endpoint: string): Promise<number> {
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}${endpoint}`);
    const endTime = Date.now();
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    return endTime - startTime;
  },

  // Cross-browser testing helpers
  async testWebRTCSupport(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return !!(window.RTCPeerConnection || 
                window.webkitRTCPeerConnection || 
                window.mozRTCPeerConnection);
    });
  },

  async testSocketIOSupport(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      return typeof window.io !== 'undefined';
    });
  },

  // Utility helpers
  async waitForSocketConnection(page: Page, timeout: number = 10000) {
    await page.waitForFunction(() => {
      return window.socket && window.socket.connected;
    }, { timeout });
  },

  async waitForElement(page: Page, selector: string, timeout: number = 10000) {
    await page.waitForSelector(selector, { timeout });
  },

  async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ 
      path: `tests/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  },

  // Additional simulation helpers for comprehensive testing
  async simulateCallFailure(callSid?: string, reason?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/call-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callSid,
        reason: reason || 'Network error',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate call failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateServiceOutage(service?: string, duration?: number) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/service-outage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: service || 'twilio',
        duration: duration || 300000, // 5 minutes
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate service outage: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateServiceRecovery(service?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/service-recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: service || 'twilio',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate service recovery: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateCallDuration(callSid?: string, duration?: number) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/call-duration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callSid,
        duration: duration || 120, // 2 minutes
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate call duration: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateQuickbaseDataUpdate(recordId?: string, fieldUpdates?: Record<string, any>) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/quickbase-data-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordId,
        fieldUpdates: fieldUpdates || { status: 'updated' },
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate Quickbase data update: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateIframeLoadingFailure(iframeUrl?: string, errorType?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/iframe-loading-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        iframeUrl: iframeUrl || 'https://test.example.com/iframe',
        errorType: errorType || 'timeout',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate iframe loading failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateTaskCreation(taskType?: string, options?: { requiredSkills?: string[], timeout?: number, priority?: string }) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/task-creation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskType: taskType || 'customer-support',
        priority: options?.priority || 'normal',
        requiredSkills: options?.requiredSkills || [],
        timeout: options?.timeout || 300000, // 5 minutes
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate task creation: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateTaskAssignment(workerId?: string, taskType?: string, priority?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/task-assignment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: workerId || 'test-worker',
        taskType: taskType || 'customer-support',
        priority: priority || 'normal',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate task assignment: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateWorkerStatusChange(workerId?: string, status?: string, activity?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/worker-status-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: workerId || 'test-worker',
        status: status || 'available',
        activity: activity || 'idle',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate worker status change: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateConcurrentTasks(taskCount?: number, taskType?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/concurrent-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskCount: taskCount || 10,
        taskType: taskType || 'customer-support',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate concurrent tasks: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateHighCallVolume(callCount?: number, duration?: number) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/high-call-volume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callCount: callCount || 50,
        duration: duration || 300000, // 5 minutes
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate high call volume: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateTasksExceedingCapacity(workerId?: string, taskCount?: number, maxCapacity?: number) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/tasks-exceeding-capacity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: workerId || 'test-worker',
        taskCount: taskCount || 5,
        maxCapacity: maxCapacity || 3,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate tasks exceeding capacity: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateTaskRouterAPIFailure(errorType?: string, duration?: number) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/taskrouter-api-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorType: errorType || 'timeout',
        duration: duration || 60000, // 1 minute
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate TaskRouter API failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateWorkerSyncFailure(workerId?: string, errorType?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/worker-sync-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: workerId || 'test-worker',
        errorType: errorType || 'connection-timeout',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate worker sync failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulatePhoneNumberPurchaseFailure(phoneNumber?: string, errorType?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/phone-number-purchase-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: phoneNumber || '+15551234567',
        errorType: errorType || 'insufficient-funds',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate phone number purchase failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateTwilioServiceFailure(service?: string, errorType?: string, duration?: number) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/twilio-service-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: service || 'voice',
        errorType: errorType || 'api-timeout',
        duration: duration || 300000, // 5 minutes
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate Twilio service failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateConfigurationSaveFailure(configType?: string, errorType?: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/configuration-save-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        configType: configType || 'system-settings',
        errorType: errorType || 'database-error',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate configuration save failure: ${response.statusText}`);
    }

    return response.json();
  },

  // Additional helpers for specific test scenarios
  async simulateMessageSendingFailure() {
    return this.simulateTwilioServiceFailure('sms', 'api-error');
  },

  async simulateCallQualityUpdate(quality: string) {
    // This would emit a call quality update event
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }
    // Implementation would emit socket event for call quality
    return { success: true, quality };
  },

  async simulatePresenceStatusChange(status: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }
    // Implementation would emit socket event for presence change
    return { success: true, status };
  },

  async simulateBulkOperationFailure() {
    return this.simulateConfigurationSaveFailure('bulk-operations', 'database-lock');
  },

  async simulateWebhookProcessingError() {
    return this.simulateWebhookFailure('voice', 'processing-error');
  },

  async simulateWebhookTimeout() {
    return this.simulateWebhookFailure('voice', 'timeout');
  },

  async simulateUnauthorizedIP() {
    // This would simulate an unauthorized IP scenario
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }
    return { success: true, message: 'Unauthorized IP simulation triggered' };
  },

  async simulateSecurityEvent(eventType: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }
    // Implementation would emit security event
    return { success: true, eventType };
  },

  async simulateSuspiciousPattern() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }
    // Implementation would emit suspicious activity event
    return { success: true, message: 'Suspicious pattern simulation triggered' };
  },

  // Socket-related simulators
  async simulateSocketConnectionFailure() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/socket-connection-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate socket connection failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateSocketDisconnection() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/socket-disconnection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate socket disconnection: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateSocketReconnection() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/socket-reconnection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate socket reconnection: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateMultipleConnectionFailures(count: number = 3) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/multiple-connection-failures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate multiple connection failures: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateSocketError(errorType: string = 'connection-timeout') {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/socket-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorType,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate socket error: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateRoomJoinFailure(roomId: string = 'test-room') {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/room-join-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate room join failure: ${response.statusText}`);
    }

    return response.json();
  },

  // Queue-related simulators
  async simulateQueueOverflow(overflowCount: number = 10) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/queue-overflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        overflowCount,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate queue overflow: ${response.statusText}`);
    }

    return response.json();
  },

  // Call-related simulators
  async simulateCallStatusChange(status: string = 'on-hold') {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/call-status-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate call status change: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateCallDurationUpdate(duration: number = 60) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/call-duration-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duration,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate call duration update: ${response.statusText}`);
    }

    return response.json();
  },

  // Event-related simulators
  async simulateEventBroadcast(eventType: string = 'system-maintenance', data: any = { message: 'System maintenance in 5 minutes' }) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/event-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        data,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate event broadcast: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateBroadcastFailure() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/broadcast-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate broadcast failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateActivity(activityType: string = 'call-started', data: any = {}) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityType,
        data,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate activity: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateMultipleActivities(count: number = 50) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/multiple-activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate multiple activities: ${response.statusText}`);
    }

    return response.json();
  },

  // Message-related simulators
  async simulateMessageDeliveryFailure() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/message-delivery-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate message delivery failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateEventProcessingFailure() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/event-processing-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate event processing failure: ${response.statusText}`);
    }

    return response.json();
  },

  // Quickbase-related simulators
  async simulateRealTimeUpdate(customerId: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/real-time-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate real-time update: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateConcurrentUpdates(customerId: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/concurrent-updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate concurrent updates: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateRapidUpdates(customerId: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/rapid-updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate rapid updates: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateSyncConflict(customerId: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/sync-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate sync conflict: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateSyncFailure() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/sync-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate sync failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateQuickbaseAPIError() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/quickbase-api-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate Quickbase API error: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateRateLimiting() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/rate-limiting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate rate limiting: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateCacheInvalidation(customerId: string) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/cache-invalidation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate cache invalidation: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateLargeDatasetQuery() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/large-dataset-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate large dataset query: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateCorruptedCustomerData() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/corrupted-customer-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate corrupted customer data: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateMissingRequiredFields() {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/missing-required-fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate missing required fields: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateQuickbaseDataChange(customerId: string, changes: any) {
    if (!TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${BASE_URL}/api/test/simulate/quickbase-data-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        changes,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate Quickbase data change: ${response.statusText}`);
    }

    return response.json();
  },

  // Test data generation
  generateTestData(type: string, count: number = 1) {
    return TestUtils.generateTestData(type, count);
  }
};

export default qaHelpers;
