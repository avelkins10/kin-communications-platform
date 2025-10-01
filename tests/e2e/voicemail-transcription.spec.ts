import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('Voicemail Transcription - Phase 5', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Voicemail Recording', () => {
    test('should record voicemail after configurable timeout', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate call that goes to voicemail
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="decline-call-button"]');

      // Simulate voicemail recording
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Hello, this is a test voicemail message. Please call me back at your earliest convenience.');

      // Verify voicemail appears in queue
      await page.goto('/dashboard/voicemails');
      await expect(page.locator('[data-testid="voicemail-queue"]')).toBeVisible();
      const voicemailItemCount = await page.locator('[data-testid="voicemail-item"]').count();
      expect(voicemailItemCount).toBeGreaterThan(0);
    });

    test('should handle voicemail recording with different timeout settings', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/voicemail');

      // Configure voicemail timeout
      await page.fill('[data-testid="voicemail-timeout"]', '15');
      await page.click('[data-testid="save-settings"]');

      // Verify timeout configuration
      await expect(page.locator('[data-testid="timeout-confirmation"]')).toBeVisible();

      // Test with new timeout
      await qaHelpers.loginAs(page, 'agent');
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail with custom timeout');

      await page.goto('/dashboard/voicemails');
      const voicemailItemCount = await page.locator('[data-testid="voicemail-item"]').count();
      expect(voicemailItemCount).toBeGreaterThan(0);
    });

    test('should record voicemail with caller identification', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate voicemail from known customer
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Hi, this is John from ABC Company. I need to discuss the project timeline.');

      // Verify voicemail with customer info
      await page.goto('/dashboard/voicemails');
      await expect(page.locator('[data-testid="voicemail-item"]').first()).toContainText(testData.contacts.customer.name);
      await expect(page.locator('[data-testid="voicemail-item"]').first()).toContainText(testData.contacts.customer.phone);
    });

    test('should handle voicemail from unknown caller', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate voicemail from unknown number
      await qaHelpers.simulateVoicemail('+15559999999', 'Hello, I am calling about your services. Please call me back.');

      // Verify unknown caller handling
      await page.goto('/dashboard/voicemails');
      await expect(page.locator('[data-testid="voicemail-item"]').first()).toContainText('Unknown Caller');
      await expect(page.locator('[data-testid="voicemail-item"]').first()).toContainText('+15559999999');
    });
  });

  test.describe('Automatic Transcription', () => {
    test('should transcribe voicemail automatically', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate voicemail with transcription
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Hello, this is a test voicemail for transcription. I need to schedule a meeting for next week.');

      // Verify transcription appears
      await page.goto('/dashboard/voicemails');
      await page.click('[data-testid="voicemail-item"]');
      await expect(page.locator('[data-testid="transcription-text"]')).toBeVisible();
      await expect(page.locator('[data-testid="transcription-text"]')).toContainText('Hello, this is a test voicemail for transcription');
    });

    test('should handle transcription accuracy and confidence scores', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate voicemail with low confidence transcription
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Mumbled speech that is hard to understand', { confidence: 0.3 });

      // Verify transcription with confidence indicator
      await page.goto('/dashboard/voicemails');
      await page.click('[data-testid="voicemail-item"]');
      await expect(page.locator('[data-testid="transcription-text"]')).toBeVisible();
      await expect(page.locator('[data-testid="confidence-indicator"]')).toHaveClass(/low-confidence/);
    });

    test('should allow manual transcription editing', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Create voicemail with transcription
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test message for manual editing');

      // Edit transcription
      await page.goto('/dashboard/voicemails');
      await page.click('[data-testid="voicemail-item"]');
      await page.click('[data-testid="edit-transcription-button"]');
      await page.fill('[data-testid="transcription-editor"]', 'Corrected transcription text');
      await page.click('[data-testid="save-transcription"]');

      // Verify edited transcription
      await expect(page.locator('[data-testid="transcription-text"]')).toContainText('Corrected transcription text');
      await expect(page.locator('[data-testid="edited-indicator"]')).toBeVisible();
    });

    test('should handle transcription failures gracefully', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate transcription failure
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test message', { transcriptionFailed: true });

      // Verify failure handling
      await page.goto('/dashboard/voicemails');
      await page.click('[data-testid="voicemail-item"]');
      await expect(page.locator('[data-testid="transcription-failed"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-transcription-button"]')).toBeVisible();
    });
  });

  test.describe('Voicemail Queue Management', () => {
    test('should display voicemail queue with proper information', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create multiple voicemails
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'First voicemail message');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'Second voicemail message');

      // Verify queue display
      await expect(page.locator('[data-testid="voicemail-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="voicemail-item"]')).toHaveCount(2);

      // Verify voicemail information
      const firstVoicemail = page.locator('[data-testid="voicemail-item"]').first();
      await expect(firstVoicemail.locator('[data-testid="caller-name"]')).toBeVisible();
      await expect(firstVoicemail.locator('[data-testid="caller-phone"]')).toBeVisible();
      await expect(firstVoicemail.locator('[data-testid="voicemail-time"]')).toBeVisible();
      await expect(firstVoicemail.locator('[data-testid="voicemail-duration"]')).toBeVisible();
    });

    test('should sort voicemails by priority and timestamp', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create voicemails with different priorities
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Regular priority voicemail');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'High priority voicemail', { priority: 'high' });

      // Verify sorting
      const firstVoicemail = page.locator('[data-testid="voicemail-item"]').first();
      await expect(firstVoicemail.locator('[data-testid="priority-indicator"]')).toHaveClass(/high-priority/);
    });

    test('should filter voicemails by status', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create voicemails with different statuses
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Unread voicemail');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'Read voicemail', { status: 'read' });

      // Filter by unread
      await page.selectOption('[data-testid="status-filter"]', 'unread');
      await page.click('[data-testid="apply-filter"]');

      // Verify filtered results
      await expect(page.locator('[data-testid="voicemail-item"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="unread-indicator"]')).toBeVisible();
    });

    test('should search voicemails by transcription content', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create voicemails with specific content
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'I need help with my project timeline');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'I want to discuss pricing options');

      // Search by transcription content
      await page.fill('[data-testid="search-input"]', 'project timeline');
      await page.click('[data-testid="search-button"]');

      // Verify search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="voicemail-item"]')).toHaveCount(1);
    });
  });

  test.describe('Read/Unread Status Management', () => {
    test('should mark voicemails as read when opened', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create unread voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Unread voicemail message');

      // Open voicemail
      await page.click('[data-testid="voicemail-item"]');

      // Verify marked as read
      await expect(page.locator('[data-testid="read-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="unread-indicator"]')).not.toBeVisible();
    });

    test('should mark voicemails as unread', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create read voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Read voicemail message', { status: 'read' });

      // Mark as unread
      await page.click('[data-testid="mark-unread-button"]');

      // Verify marked as unread
      await expect(page.locator('[data-testid="unread-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="read-indicator"]')).not.toBeVisible();
    });

    test('should display unread count in navigation', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Create unread voicemails
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'First unread voicemail');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'Second unread voicemail');

      // Verify unread count
      await expect(page.locator('[data-testid="voicemail-unread-count"]')).toContainText('2');
    });

    test('should bulk mark voicemails as read', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create multiple unread voicemails
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'First unread voicemail');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'Second unread voicemail');

      // Select all voicemails
      await page.check('[data-testid="select-all-voicemails"]');
      await page.click('[data-testid="bulk-mark-read"]');

      // Verify all marked as read
      await expect(page.locator('[data-testid="unread-indicator"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="read-indicator"]')).toHaveCount(2);
    });
  });

  test.describe('Voicemail Assignment', () => {
    test('should assign voicemail to specific agent', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Voicemail for assignment');

      // Assign voicemail
      await page.click('[data-testid="assign-voicemail-button"]');
      await page.selectOption('[data-testid="assignee-select"]', testData.users.agent2.id);
      await page.click('[data-testid="confirm-assignment"]');

      // Verify assignment
      await expect(page.locator('[data-testid="assigned-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="assignee-name"]')).toContainText(testData.users.agent2.name);
    });

    test('should auto-assign voicemails based on rules', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/voicemail');

      // Configure auto-assignment rule
      await page.click('[data-testid="add-assignment-rule"]');
      await page.selectOption('[data-testid="condition-type"]', 'customer-type');
      await page.selectOption('[data-testid="condition-value"]', 'vip');
      await page.selectOption('[data-testid="assignee"]', testData.users.agent2.id);
      await page.click('[data-testid="save-rule"]');

      // Test auto-assignment
      await qaHelpers.loginAs(page, 'agent');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'VIP voicemail for auto-assignment');

      // Verify auto-assignment
      await page.goto('/dashboard/voicemails');
      await expect(page.locator('[data-testid="assigned-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="assignee-name"]')).toContainText(testData.users.agent2.name);
    });

    test('should reassign voicemails', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create and assign voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Voicemail for reassignment');
      await page.click('[data-testid="assign-voicemail-button"]');
      await page.selectOption('[data-testid="assignee-select"]', testData.users.agent2.id);
      await page.click('[data-testid="confirm-assignment"]');

      // Reassign to different agent
      await page.click('[data-testid="reassign-button"]');
      await page.selectOption('[data-testid="assignee-select"]', testData.users.agent3.id);
      await page.click('[data-testid="confirm-reassignment"]');

      // Verify reassignment
      await expect(page.locator('[data-testid="assignee-name"]')).toContainText(testData.users.agent3.name);
    });
  });

  test.describe('One-Click Callback', () => {
    test('should initiate callback from voicemail', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Please call me back');

      // Initiate callback
      await page.click('[data-testid="callback-button"]');

      // Verify call initiation
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="caller-info"]')).toContainText(testData.contacts.customer.name);
    });

    test('should mark voicemail as resolved after callback', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Please call me back');

      // Initiate and complete callback
      await page.click('[data-testid="callback-button"]');
      await page.click('[data-testid="end-call-button"]');

      // Mark as resolved
      await page.click('[data-testid="mark-resolved-button"]');

      // Verify resolution
      await expect(page.locator('[data-testid="resolved-indicator"]')).toBeVisible();
    });

    test('should schedule callback for later', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Please call me back tomorrow');

      // Schedule callback
      await page.click('[data-testid="schedule-callback-button"]');
      await page.fill('[data-testid="callback-date"]', '2024-12-26');
      await page.fill('[data-testid="callback-time"]', '10:00');
      await page.click('[data-testid="confirm-schedule"]');

      // Verify scheduled callback
      await expect(page.locator('[data-testid="scheduled-callback"]')).toBeVisible();
      await expect(page.locator('[data-testid="callback-time"]')).toContainText('2024-12-26 10:00');
    });
  });

  test.describe('Email Notifications', () => {
    test('should send email notification for new voicemail', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/settings/notifications');

      // Enable email notifications
      await page.check('[data-testid="voicemail-email-notifications"]');
      await page.click('[data-testid="save-notification-settings"]');

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail for email notification');

      // Verify email notification sent
      await expect(page.locator('[data-testid="email-notification-sent"]')).toBeVisible();
    });

    test('should include transcription in email notification', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/settings/notifications');

      // Enable transcription in emails
      await page.check('[data-testid="include-transcription"]');
      await page.click('[data-testid="save-notification-settings"]');

      // Create voicemail with transcription
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail with transcription for email');

      // Verify email with transcription
      await expect(page.locator('[data-testid="email-with-transcription"]')).toBeVisible();
    });

    test('should handle email notification failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/settings/notifications');

      // Enable email notifications
      await page.check('[data-testid="voicemail-email-notifications"]');
      await page.click('[data-testid="save-notification-settings"]');

      // Simulate email failure
      await qaHelpers.simulateEmailFailure();

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail with email failure');

      // Verify failure handling
      await expect(page.locator('[data-testid="email-failure-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-email-button"]')).toBeVisible();
    });
  });

  test.describe('Bulk Actions', () => {
    test('should bulk delete voicemails', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create multiple voicemails
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'First voicemail');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'Second voicemail');

      // Select and delete voicemails
      await page.check('[data-testid="select-all-voicemails"]');
      await page.click('[data-testid="bulk-delete"]');
      await page.click('[data-testid="confirm-delete"]');

      // Verify deletion
      await expect(page.locator('[data-testid="voicemail-item"]')).toHaveCount(0);
    });

    test('should bulk mark voicemails as resolved', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create multiple voicemails
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'First voicemail');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'Second voicemail');

      // Select and mark as resolved
      await page.check('[data-testid="select-all-voicemails"]');
      await page.click('[data-testid="bulk-mark-resolved"]');

      // Verify resolution
      await expect(page.locator('[data-testid="resolved-indicator"]')).toHaveCount(2);
    });

    test('should bulk assign voicemails', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Create multiple voicemails
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'First voicemail');
      await qaHelpers.simulateVoicemail(testData.contacts.vipCustomer.phone, 'Second voicemail');

      // Select and assign
      await page.check('[data-testid="select-all-voicemails"]');
      await page.click('[data-testid="bulk-assign"]');
      await page.selectOption('[data-testid="assignee-select"]', testData.users.agent2.id);
      await page.click('[data-testid="confirm-bulk-assignment"]');

      // Verify assignment
      await expect(page.locator('[data-testid="assigned-indicator"]')).toHaveCount(2);
    });
  });

  test.describe('Integration with Call History', () => {
    test('should link voicemails to call history', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail for call history');

      // Verify voicemail appears in call history
      await expect(page.locator('[data-testid="call-record"]')).toContainText('Voicemail');
      await expect(page.locator('[data-testid="voicemail-link"]')).toBeVisible();
    });

    test('should display voicemail duration in call history', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Create voicemail with specific duration
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail', { duration: 45 });

      // Verify duration display
      await expect(page.locator('[data-testid="call-duration"]')).toContainText('0:45');
    });

    test('should allow playback from call history', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail for playback');

      // Play from call history
      await page.click('[data-testid="play-voicemail-button"]');

      // Verify playback
      await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle transcription service failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate transcription service failure
      await qaHelpers.simulateTranscriptionServiceFailure();

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail with transcription failure');

      // Verify failure handling
      await page.goto('/dashboard/voicemails');
      await page.click('[data-testid="voicemail-item"]');
      await expect(page.locator('[data-testid="transcription-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-transcription-button"]')).toBeVisible();
    });

    test('should handle audio file corruption', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate corrupted audio file
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail', { corrupted: true });

      // Verify error handling
      await page.goto('/dashboard/voicemails');
      await page.click('[data-testid="voicemail-item"]');
      await expect(page.locator('[data-testid="audio-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="audio-player"]')).not.toBeVisible();
    });

    test('should handle webhook processing failures', async () => {
      // Simulate webhook failure
      const response = await page.request.post('/api/webhooks/twilio/recording', {
        data: { invalid: 'webhook' },
        headers: { 'X-Twilio-Signature': 'invalid-signature' }
      });

      expect(response.status()).toBe(403);
    });
  });
});
