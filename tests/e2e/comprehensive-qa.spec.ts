import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('KIN Communications Platform - Comprehensive QA', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.afterEach(async () => {
    await qaHelpers.cleanupTestData();
  });

  test.describe('Phase 1-2: Authentication & User Management', () => {
    test('should handle complete user authentication workflow', async () => {
      // Test login with valid credentials
      await page.goto('/login');
      await page.fill('[data-testid="email"]', testData.users.admin.email);
      await page.fill('[data-testid="password"]', testData.users.admin.password);
      await page.click('[data-testid="login-button"]');
      
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('should validate role-based access control', async () => {
      // Test admin access
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings');
      await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();

      // Test agent access restrictions
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/settings');
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    });
  });

  test.describe('Phase 3: Voice Calling Integration', () => {
    test('should handle complete outbound call workflow', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Initiate outbound call
      await page.click('[data-testid="new-call-button"]');
      await page.fill('[data-testid="phone-number"]', testData.contacts.customer.phone);
      await page.click('[data-testid="call-button"]');

      // Verify call initiation
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="call-status"]')).toContainText('Connecting');

      // Test call controls
      await page.click('[data-testid="mute-button"]');
      await expect(page.locator('[data-testid="mute-indicator"]')).toBeVisible();

      await page.click('[data-testid="hold-button"]');
      await expect(page.locator('[data-testid="hold-indicator"]')).toBeVisible();

      // End call
      await page.click('[data-testid="end-call-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).not.toBeVisible();
    });

    test('should handle inbound call with customer identification', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate inbound call webhook
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      
      // Verify call notification
      await expect(page.locator('[data-testid="incoming-call-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-info"]')).toContainText(testData.contacts.customer.name);

      // Answer call
      await page.click('[data-testid="answer-call-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
    });

    test('should record calls and display in history', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Verify call history displays
      await expect(page.locator('[data-testid="calls-table"]')).toBeVisible();
      const callRecordCount = await page.locator('[data-testid="call-record"]').count();
      expect(callRecordCount).toBeGreaterThan(0);

      // Test recording playback
      await page.click('[data-testid="play-recording-button"]');
      await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();
    });
  });

  test.describe('Phase 4: SMS Messaging Integration', () => {
    test('should handle two-way SMS with conversation threading', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Start new conversation
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Test message from QA');
      await page.click('[data-testid="send-message-button"]');

      // Verify message sent
      await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();

      // Simulate inbound SMS
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Reply from customer');
      
      // Verify conversation threading
      await expect(page.locator('[data-testid="conversation-thread"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-bubble"]')).toHaveCount(2);
    });

    test('should handle bulk messaging to field crews', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/messages/bulk');

      // Select field crew recipients
      await page.check('[data-testid="field-crew-group"]');
      await page.fill('[data-testid="bulk-message-text"]', 'Field update message');
      await page.click('[data-testid="send-bulk-button"]');

      // Verify bulk send confirmation
      await expect(page.locator('[data-testid="bulk-send-confirmation"]')).toBeVisible();
    });
  });

  test.describe('Phase 5: Voicemail Transcription', () => {
    test('should handle voicemail recording and transcription', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Simulate voicemail webhook
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail message');

      // Verify voicemail appears in queue
      await expect(page.locator('[data-testid="voicemail-queue"]')).toBeVisible();
      const voicemailItemCount = await page.locator('[data-testid="voicemail-item"]').count();
      expect(voicemailItemCount).toBeGreaterThan(0);

      // Test transcription display
      await page.click('[data-testid="voicemail-item"]');
      await expect(page.locator('[data-testid="transcription-text"]')).toBeVisible();
      await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();
    });

    test('should handle voicemail assignment and callback', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Assign voicemail
      await page.click('[data-testid="assign-voicemail-button"]');
      await page.selectOption('[data-testid="assignee-select"]', testData.users.agent.id);
      await page.click('[data-testid="confirm-assignment"]');

      // Verify assignment
      await expect(page.locator('[data-testid="assigned-indicator"]')).toBeVisible();

      // Test one-click callback
      await page.click('[data-testid="callback-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
    });
  });

  test.describe('Phase 6: Quickbase Integration', () => {
    test('should lookup customer data by phone number', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer by phone
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify customer data display
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-coordinator"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-status"]')).toBeVisible();
    });

    test('should display customer context panel during calls', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate call with customer
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify customer context panel
      await expect(page.locator('[data-testid="customer-context-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="quickbase-iframe"]')).toBeVisible();
    });
  });

  test.describe('Phase 7: TaskRouter Functionality', () => {
    test('should handle intelligent call routing', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Configure routing rules
      await page.click('[data-testid="routing-rules-button"]');
      await page.fill('[data-testid="keyword-input"]', 'emergency');
      await page.selectOption('[data-testid="target-queue"]', 'emergency-queue');
      await page.click('[data-testid="save-rule"]');

      // Test routing with keyword
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone, 'emergency situation');
      
      // Verify routing to correct queue
      await expect(page.locator('[data-testid="emergency-queue"]')).toBeVisible();
    });

    test('should manage worker status and activities', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Change worker status
      await page.click('[data-testid="status-selector"]');
      await page.click('[data-testid="status-available"]');

      // Verify status update
      await expect(page.locator('[data-testid="current-status"]')).toContainText('Available');

      // Test activity management
      await page.click('[data-testid="activities-button"]');
      await expect(page.locator('[data-testid="activities-list"]')).toBeVisible();
    });
  });

  test.describe('Phase 8: Admin Panel Functionality', () => {
    test('should manage users and TaskRouter worker sync', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Create new user
      await page.click('[data-testid="add-user-button"]');
      await page.fill('[data-testid="user-name"]', 'Test Agent');
      await page.fill('[data-testid="user-email"]', 'testagent@example.com');
      await page.selectOption('[data-testid="user-role"]', 'agent');
      await page.click('[data-testid="save-user"]');

      // Verify user creation
      await expect(page.locator('[data-testid="user-list"]')).toContainText('Test Agent');

      // Test TaskRouter sync
      await page.click('[data-testid="sync-taskrouter-button"]');
      await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
    });

    test('should configure phone numbers and routing rules', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/phone-numbers');

      // Purchase new phone number
      await page.click('[data-testid="purchase-number-button"]');
      await page.selectOption('[data-testid="area-code"]', '555');
      await page.click('[data-testid="search-numbers"]');
      await page.click('[data-testid="purchase-selected"]');

      // Verify phone number configuration
      await expect(page.locator('[data-testid="phone-number-list"]')).toContainText('+1555');
    });
  });

  test.describe('Phase 9: Real-time Features', () => {
    test('should display live queue updates', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Verify real-time queue display
      await expect(page.locator('[data-testid="live-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="queue-count"]')).toBeVisible();

      // Simulate queue update
      await qaHelpers.simulateQueueUpdate();
      
      // Verify real-time update
      await expect(page.locator('[data-testid="queue-count"]')).toHaveText(/\d+/);
    });

    test('should show presence indicators', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/team');

      // Verify presence indicators
      await expect(page.locator('[data-testid="presence-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="online-status"]')).toContainText('Online');
    });

    test('should handle real-time notifications', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate incoming call notification
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      
      // Verify real-time notification
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-title"]')).toContainText('Incoming Call');
    });
  });

  test.describe('Phase 10: Performance & Optimization', () => {
    test('should handle concurrent operations efficiently', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate multiple concurrent operations
      const operations = [
        qaHelpers.simulateInboundCall(testData.contacts.customer.phone),
        qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Test message'),
        qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail')
      ];

      await Promise.all(operations);

      // Verify all operations completed
      await expect(page.locator('[data-testid="call-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="sms-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="voicemail-notification"]')).toBeVisible();
    });

    test('should maintain responsive UI under load', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate high load
      await qaHelpers.simulateHighLoad();

      // Verify UI remains responsive
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
    });
  });

  test.describe('Integration & Error Handling', () => {
    test('should handle webhook failures gracefully', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate webhook failure
      await qaHelpers.simulateWebhookFailure();
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should validate webhook security', async () => {
      // Test invalid webhook signature
      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: { invalid: 'payload' },
        headers: { 'X-Twilio-Signature': 'invalid-signature' }
      });

      expect(response.status()).toBe(403);
    });

    test('should handle network connectivity issues', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate network failure
      await page.context().setOffline(true);
      
      // Verify offline handling
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Restore connectivity
      await page.context().setOffline(false);
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    });
  });
});
