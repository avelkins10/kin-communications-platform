import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('Voice Calling Integration - Phase 3', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Outbound Call Functionality', () => {
    test('should initiate outbound call from contact list', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Find and click call button for customer
      await page.click(`[data-testid="call-contact-${testData.contacts.customer.id}"]`);
      
      // Verify call initiation
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="call-status"]')).toContainText('Connecting');
      await expect(page.locator('[data-testid="caller-info"]')).toContainText(testData.contacts.customer.name);
    });

    test('should initiate outbound call with manual number entry', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Click new call button
      await page.click('[data-testid="new-call-button"]');
      
      // Enter phone number manually
      await page.fill('[data-testid="phone-number-input"]', '+15551234567');
      await page.click('[data-testid="call-button"]');

      // Verify call initiation
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="phone-display"]')).toContainText('+15551234567');
    });

    test('should handle call initiation errors gracefully', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Attempt call with invalid number
      await page.click('[data-testid="new-call-button"]');
      await page.fill('[data-testid="phone-number-input"]', 'invalid');
      await page.click('[data-testid="call-button"]');

      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid phone number');
    });
  });

  test.describe('Inbound Call Handling', () => {
    test('should display incoming call notification with customer info', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate inbound call from known customer
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      
      // Verify call notification
      await expect(page.locator('[data-testid="incoming-call-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="caller-name"]')).toContainText(testData.contacts.customer.name);
      await expect(page.locator('[data-testid="caller-phone"]')).toContainText(testData.contacts.customer.phone);
    });

    test('should handle unknown caller identification', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate inbound call from unknown number
      await qaHelpers.simulateInboundCall('+15559999999');
      
      // Verify unknown caller handling
      await expect(page.locator('[data-testid="incoming-call-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="caller-name"]')).toContainText('Unknown Caller');
      await expect(page.locator('[data-testid="caller-phone"]')).toContainText('+15559999999');
    });

    test('should answer incoming call successfully', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate and answer inbound call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify call answered
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="call-status"]')).toContainText('Connected');
    });

    test('should decline incoming call', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate and decline inbound call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="decline-call-button"]');

      // Verify call declined
      await expect(page.locator('[data-testid="incoming-call-notification"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="call-controls"]')).not.toBeVisible();
    });
  });

  test.describe('Call Controls', () => {
    test.beforeEach(async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');
      
      // Start a call for testing controls
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');
    });

    test('should mute and unmute call', async () => {
      // Test mute functionality
      await page.click('[data-testid="mute-button"]');
      await expect(page.locator('[data-testid="mute-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="mute-button"]')).toHaveClass(/active/);

      // Test unmute functionality
      await page.click('[data-testid="mute-button"]');
      await expect(page.locator('[data-testid="mute-indicator"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="mute-button"]')).not.toHaveClass(/active/);
    });

    test('should hold and resume call', async () => {
      // Test hold functionality
      await page.click('[data-testid="hold-button"]');
      await expect(page.locator('[data-testid="hold-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="call-status"]')).toContainText('On Hold');

      // Test resume functionality
      await page.click('[data-testid="hold-button"]');
      await expect(page.locator('[data-testid="hold-indicator"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="call-status"]')).toContainText('Connected');
    });

    test('should transfer call to another agent', async () => {
      // Initiate transfer
      await page.click('[data-testid="transfer-button"]');
      await expect(page.locator('[data-testid="transfer-modal"]')).toBeVisible();

      // Select transfer target
      await page.selectOption('[data-testid="transfer-target"]', testData.users.agent2.id);
      await page.click('[data-testid="confirm-transfer"]');

      // Verify transfer initiated
      await expect(page.locator('[data-testid="transfer-status"]')).toContainText('Transferring');
    });

    test('should end call successfully', async () => {
      // End the call
      await page.click('[data-testid="end-call-button"]');

      // Verify call ended
      await expect(page.locator('[data-testid="call-controls"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="call-ended-notification"]')).toBeVisible();
    });
  });

  test.describe('Call Recording', () => {
    test('should record calls automatically', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start and end a call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');
      
      // Wait for call to be established
      await expect(page.locator('[data-testid="recording-indicator"]')).toBeVisible();
      
      // End call
      await page.click('[data-testid="end-call-button"]');

      // Verify recording created
      await page.goto('/dashboard/calls');
      await expect(page.locator('[data-testid="recording-available"]')).toBeVisible();
    });

    test('should display dual-channel recording controls', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Find a call with recording
      await page.click('[data-testid="play-recording-button"]');
      
      // Verify dual-channel player
      await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();
      await expect(page.locator('[data-testid="channel-selector"]')).toBeVisible();
      await expect(page.locator('[data-testid="agent-channel"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-channel"]')).toBeVisible();
    });

    test('should play recording with proper controls', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Play recording
      await page.click('[data-testid="play-recording-button"]');
      
      // Test playback controls
      await expect(page.locator('[data-testid="play-pause-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
      await expect(page.locator('[data-testid="volume-control"]')).toBeVisible();
      await expect(page.locator('[data-testid="speed-control"]')).toBeVisible();
    });
  });

  test.describe('Call History', () => {
    test('should display call history with proper information', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Verify call history table
      await expect(page.locator('[data-testid="calls-table"]')).toBeVisible();
      const callRecordCount = await page.locator('[data-testid="call-record"]').count();
      expect(callRecordCount).toBeGreaterThan(0);

      // Verify call record details
      const firstCall = page.locator('[data-testid="call-record"]').first();
      await expect(firstCall.locator('[data-testid="caller-name"]')).toBeVisible();
      await expect(firstCall.locator('[data-testid="call-time"]')).toBeVisible();
      await expect(firstCall.locator('[data-testid="call-duration"]')).toBeVisible();
      await expect(firstCall.locator('[data-testid="call-status"]')).toBeVisible();
    });

    test('should filter call history by date range', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Set date filter
      await page.fill('[data-testid="date-from"]', '2024-01-01');
      await page.fill('[data-testid="date-to"]', '2024-12-31');
      await page.click('[data-testid="apply-filter"]');

      // Verify filtered results
      const callRecordCount = await page.locator('[data-testid="call-record"]').count();
      expect(callRecordCount).toBeGreaterThan(0);
    });

    test('should search call history by caller name or number', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Search by caller name
      await page.fill('[data-testid="search-input"]', testData.contacts.customer.name);
      await page.click('[data-testid="search-button"]');

      // Verify search results
      const callRecordCount = await page.locator('[data-testid="call-record"]').count();
      expect(callRecordCount).toBeGreaterThan(0);
      await expect(page.locator('[data-testid="caller-name"]')).toContainText(testData.contacts.customer.name);
    });
  });

  test.describe('TaskRouter Integration', () => {
    test('should route calls based on customer data', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Configure routing rule based on customer type
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="condition-type"]', 'customer-type');
      await page.selectOption('[data-testid="condition-value"]', 'vip');
      await page.selectOption('[data-testid="target-queue"]', 'vip-queue');
      await page.click('[data-testid="save-rule"]');

      // Simulate call from VIP customer
      await qaHelpers.simulateInboundCall(testData.contacts.vipCustomer.phone);
      
      // Verify routing to VIP queue
      await expect(page.locator('[data-testid="vip-queue"]')).toBeVisible();
    });

    test('should route calls based on time of day', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Configure time-based routing
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="condition-type"]', 'time-of-day');
      await page.fill('[data-testid="start-time"]', '17:00');
      await page.fill('[data-testid="end-time"]', '08:00');
      await page.selectOption('[data-testid="target-queue"]', 'after-hours-queue');
      await page.click('[data-testid="save-rule"]');

      // Simulate after-hours call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone, { time: '20:00' });
      
      // Verify routing to after-hours queue
      await expect(page.locator('[data-testid="after-hours-queue"]')).toBeVisible();
    });

    test('should handle worker availability for call routing', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Set worker to unavailable
      await page.click('[data-testid="status-selector"]');
      await page.click('[data-testid="status-unavailable"]');

      // Verify worker status update
      await expect(page.locator('[data-testid="current-status"]')).toContainText('Unavailable');

      // Simulate call - should not route to unavailable worker
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      
      // Verify call routed to available worker
      await expect(page.locator('[data-testid="call-notification"]')).not.toBeVisible();
    });
  });

  test.describe('Webhook Security', () => {
    test('should validate Twilio webhook signatures', async () => {
      // Test with invalid signature
      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: { CallSid: 'test-call-sid' },
        headers: { 'X-Twilio-Signature': 'invalid-signature' }
      });

      expect(response.status()).toBe(403);
    });

    test('should handle malformed webhook payloads', async () => {
      // Test with malformed payload
      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: { invalid: 'payload' },
        headers: { 'X-Twilio-Signature': 'valid-signature' }
      });

      expect(response.status()).toBe(400);
    });

    test('should process valid webhook payloads', async () => {
      // Test with valid payload
      const validPayload = {
        CallSid: 'test-call-sid',
        From: testData.contacts.customer.phone,
        To: '+15551234567',
        CallStatus: 'ringing'
      };

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: validPayload,
        headers: { 'X-Twilio-Signature': 'valid-signature' }
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work with WebRTC in Chrome', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test WebRTC functionality
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify WebRTC connection
      await expect(page.locator('[data-testid="webrtc-status"]')).toContainText('Connected');
    });

    test('should handle audio permissions', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Grant audio permissions
      await page.context().grantPermissions(['microphone']);

      // Test call with audio
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify audio is working
      await expect(page.locator('[data-testid="audio-indicator"]')).toBeVisible();
    });
  });

  test.describe('Error Scenarios', () => {
    test('should handle call failures gracefully', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Simulate call failure
      await qaHelpers.simulateCallFailure();
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Call failed');
    });

    test('should handle network connectivity issues during calls', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start a call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Simulate network failure
      await page.context().setOffline(true);
      
      // Verify offline handling
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="call-status"]')).toContainText('Connection Lost');
    });

    test('should recover from temporary service outages', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate service outage
      await qaHelpers.simulateServiceOutage();
      
      // Verify outage handling
      await expect(page.locator('[data-testid="service-outage-notification"]')).toBeVisible();
      
      // Simulate service recovery
      await qaHelpers.simulateServiceRecovery();
      
      // Verify recovery
      await expect(page.locator('[data-testid="service-outage-notification"]')).not.toBeVisible();
    });
  });
});
