import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('SMS Messaging Integration - Phase 4', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Two-Way SMS Communication', () => {
    test('should send outbound SMS message', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Start new conversation
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Hello, this is a test message from KIN Communications.');
      await page.click('[data-testid="send-message-button"]');

      // Verify message sent
      await expect(page.locator('[data-testid="message-sent-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversation-thread"]')).toContainText('Hello, this is a test message from KIN Communications.');
    });

    test('should receive and display inbound SMS message', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Simulate inbound SMS
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Thank you for your message. I will get back to you soon.');

      // Verify message received
      await expect(page.locator('[data-testid="new-message-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversation-thread"]')).toContainText('Thank you for your message. I will get back to you soon.');
    });

    test('should maintain conversation threading', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Send initial message
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Initial message');
      await page.click('[data-testid="send-message-button"]');

      // Simulate response
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Response message');

      // Send follow-up
      await page.fill('[data-testid="message-text"]', 'Follow-up message');
      await page.click('[data-testid="send-message-button"]');

      // Verify conversation threading
      const messages = page.locator('[data-testid="message-bubble"]');
      await expect(messages).toHaveCount(3);
      await expect(messages.nth(0)).toContainText('Initial message');
      await expect(messages.nth(1)).toContainText('Response message');
      await expect(messages.nth(2)).toContainText('Follow-up message');
    });

    test('should display message timestamps and status', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Send message
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Test message with timestamp');
      await page.click('[data-testid="send-message-button"]');

      // Verify timestamp and status
      await expect(page.locator('[data-testid="message-timestamp"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-status"]')).toContainText('Delivered');
    });
  });

  test.describe('Message Templates', () => {
    test('should use predefined message templates', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Open template selector
      await page.click('[data-testid="template-button"]');
      await expect(page.locator('[data-testid="template-list"]')).toBeVisible();

      // Select a template
      await page.click('[data-testid="template-greeting"]');
      await expect(page.locator('[data-testid="message-text"]')).toContainText('Hello, thank you for contacting KIN Communications');

      // Customize template
      await page.fill('[data-testid="message-text"]', 'Hello John, thank you for contacting KIN Communications');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.click('[data-testid="send-message-button"]');

      // Verify customized message sent
      await expect(page.locator('[data-testid="message-sent-indicator"]')).toBeVisible();
    });

    test('should create and save custom templates', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/templates');

      // Create new template
      await page.click('[data-testid="add-template-button"]');
      await page.fill('[data-testid="template-name"]', 'Follow-up Template');
      await page.fill('[data-testid="template-content"]', 'Thank you for your inquiry. We will follow up within 24 hours.');
      await page.click('[data-testid="save-template"]');

      // Verify template created
      await expect(page.locator('[data-testid="template-list"]')).toContainText('Follow-up Template');
    });
  });

  test.describe('Bulk Messaging', () => {
    test('should send bulk messages to field crews', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/messages/bulk');

      // Select field crew group
      await page.check('[data-testid="field-crew-group"]');
      await page.fill('[data-testid="bulk-message-text"]', 'Field update: Please report your current status.');
      await page.click('[data-testid="send-bulk-button"]');

      // Verify bulk send confirmation
      await expect(page.locator('[data-testid="bulk-send-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="recipient-count"]')).toContainText('5 recipients');
    });

    test('should send bulk messages to sales reps', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/messages/bulk');

      // Select sales rep group
      await page.check('[data-testid="sales-rep-group"]');
      await page.fill('[data-testid="bulk-message-text"]', 'Sales meeting reminder: 2 PM today in conference room A.');
      await page.click('[data-testid="send-bulk-button"]');

      // Verify bulk send confirmation
      await expect(page.locator('[data-testid="bulk-send-confirmation"]')).toBeVisible();
    });

    test('should handle bulk messaging with custom recipient selection', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/messages/bulk');

      // Select custom recipients
      await page.click('[data-testid="custom-recipients"]');
      await page.check(`[data-testid="recipient-${testData.contacts.customer.id}"]`);
      await page.check(`[data-testid="recipient-${testData.contacts.vipCustomer.id}"]`);
      
      await page.fill('[data-testid="bulk-message-text"]', 'Custom message for selected recipients');
      await page.click('[data-testid="send-bulk-button"]');

      // Verify custom bulk send
      await expect(page.locator('[data-testid="bulk-send-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="recipient-count"]')).toContainText('2 recipients');
    });

    test('should schedule bulk messages for later delivery', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/messages/bulk');

      // Select recipients and message
      await page.check('[data-testid="field-crew-group"]');
      await page.fill('[data-testid="bulk-message-text"]', 'Scheduled message for tomorrow morning');
      
      // Set schedule
      await page.click('[data-testid="schedule-message"]');
      await page.fill('[data-testid="schedule-date"]', '2024-12-26');
      await page.fill('[data-testid="schedule-time"]', '08:00');
      await page.click('[data-testid="confirm-schedule"]');

      // Verify scheduled message
      await expect(page.locator('[data-testid="scheduled-message-confirmation"]')).toBeVisible();
      await expect(page.locator('[data-testid="scheduled-time"]')).toContainText('2024-12-26 08:00');
    });
  });

  test.describe('Message Status Tracking', () => {
    test('should track message delivery status', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Send message
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Message for status tracking');
      await page.click('[data-testid="send-message-button"]');

      // Verify initial status
      await expect(page.locator('[data-testid="message-status"]')).toContainText('Sending');

      // Simulate status webhook updates
      await qaHelpers.simulateMessageStatusUpdate('delivered');
      await expect(page.locator('[data-testid="message-status"]')).toContainText('Delivered');

      await qaHelpers.simulateMessageStatusUpdate('read');
      await expect(page.locator('[data-testid="message-status"]')).toContainText('Read');
    });

    test('should handle failed message delivery', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Send message to invalid number
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', '+15559999999');
      await page.fill('[data-testid="message-text"]', 'Message to invalid number');
      await page.click('[data-testid="send-message-button"]');

      // Simulate delivery failure
      await qaHelpers.simulateMessageStatusUpdate('failed');

      // Verify failure handling
      await expect(page.locator('[data-testid="message-status"]')).toContainText('Failed');
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should retry failed messages', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Create failed message scenario
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Message to retry');
      await page.click('[data-testid="send-message-button"]');

      // Simulate failure and retry
      await qaHelpers.simulateMessageStatusUpdate('failed');
      await page.click('[data-testid="retry-button"]');

      // Verify retry attempt
      await expect(page.locator('[data-testid="message-status"]')).toContainText('Sending');
    });
  });

  test.describe('Contact Management Integration', () => {
    test('should auto-populate contact information in messages', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Start message with existing contact
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);

      // Verify contact info auto-populated
      await expect(page.locator('[data-testid="contact-name"]')).toContainText(testData.contacts.customer.name);
      await expect(page.locator('[data-testid="contact-company"]')).toContainText(testData.contacts.customer.company);
    });

    test('should create new contact from unknown number', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Simulate inbound SMS from unknown number
      await qaHelpers.simulateInboundSMS('+15558888888', 'Hello, I am a new customer');

      // Verify new contact prompt
      await expect(page.locator('[data-testid="new-contact-prompt"]')).toBeVisible();
      
      // Create new contact
      await page.click('[data-testid="create-contact-button"]');
      await page.fill('[data-testid="contact-name"]', 'New Customer');
      await page.fill('[data-testid="contact-company"]', 'New Company');
      await page.click('[data-testid="save-contact"]');

      // Verify contact created
      await expect(page.locator('[data-testid="contact-created-confirmation"]')).toBeVisible();
    });

    test('should link messages to contact history', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // View contact details
      await page.click(`[data-testid="contact-${testData.contacts.customer.id}"]`);
      await page.click('[data-testid="message-history-tab"]');

      // Verify message history
      await expect(page.locator('[data-testid="message-history"]')).toBeVisible();
      const messageItemCount = await page.locator('[data-testid="message-item"]').count();
      expect(messageItemCount).toBeGreaterThan(0);
    });
  });

  test.describe('Media Messages', () => {
    test('should send images in SMS messages', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Start new message
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      
      // Attach image
      await page.click('[data-testid="attach-media-button"]');
      await page.setInputFiles('[data-testid="file-input"]', 'tests/fixtures/test-image.jpg');
      
      // Send message with image
      await page.fill('[data-testid="message-text"]', 'Here is the image you requested');
      await page.click('[data-testid="send-message-button"]');

      // Verify image message sent
      await expect(page.locator('[data-testid="message-sent-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="image-attachment"]')).toBeVisible();
    });

    test('should receive and display image messages', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Simulate inbound image message
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Here is the photo', {
        mediaUrl: 'https://example.com/test-image.jpg'
      });

      // Verify image message received
      await expect(page.locator('[data-testid="new-message-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="image-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    });

    test('should handle multiple media attachments', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Start new message
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      
      // Attach multiple files
      await page.click('[data-testid="attach-media-button"]');
      await page.setInputFiles('[data-testid="file-input"]', [
        'tests/fixtures/test-image1.jpg',
        'tests/fixtures/test-image2.jpg'
      ]);

      // Verify multiple attachments
      await expect(page.locator('[data-testid="attachment-preview"]')).toHaveCount(2);
    });
  });

  test.describe('Message Search and Filtering', () => {
    test('should search messages by content', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Search for specific message content
      await page.fill('[data-testid="search-input"]', 'test message');
      await page.click('[data-testid="search-button"]');

      // Verify search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      const messageItemCount = await page.locator('[data-testid="message-item"]').count();
      expect(messageItemCount).toBeGreaterThan(0);
    });

    test('should filter messages by date range', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Set date filter
      await page.fill('[data-testid="date-from"]', '2024-01-01');
      await page.fill('[data-testid="date-to"]', '2024-12-31');
      await page.click('[data-testid="apply-filter"]');

      // Verify filtered results
      const messageItemCount = await page.locator('[data-testid="message-item"]').count();
      expect(messageItemCount).toBeGreaterThan(0);
    });

    test('should filter messages by contact', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Filter by specific contact
      await page.selectOption('[data-testid="contact-filter"]', testData.contacts.customer.id);
      await page.click('[data-testid="apply-filter"]');

      // Verify filtered results
      const messageItemCount = await page.locator('[data-testid="message-item"]').count();
      expect(messageItemCount).toBeGreaterThan(0);
      await expect(page.locator('[data-testid="contact-name"]')).toContainText(testData.contacts.customer.name);
    });
  });

  test.describe('Real-time Updates', () => {
    test('should receive real-time message notifications', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate real-time message
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Real-time test message');

      // Verify real-time notification
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-title"]')).toContainText('New Message');
    });

    test('should update message status in real-time', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Send message
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Real-time status test');
      await page.click('[data-testid="send-message-button"]');

      // Simulate real-time status update
      await qaHelpers.simulateMessageStatusUpdate('delivered');

      // Verify real-time status update
      await expect(page.locator('[data-testid="message-status"]')).toContainText('Delivered');
    });

    test('should sync messages across multiple browser sessions', async () => {
      // Create second browser context
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (!page2) return;

      // Login on both pages
      await qaHelpers.loginAs(page, 'agent');
      await qaHelpers.loginAs(page2, 'agent');
      
      await page.goto('/dashboard/messages');
      await page2.goto('/dashboard/messages');

      // Send message from first page
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Cross-session sync test');
      await page.click('[data-testid="send-message-button"]');

      // Verify message appears on second page
      await expect(page2.locator('[data-testid="conversation-thread"]')).toContainText('Cross-session sync test');

      await context2?.close();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle message sending failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Simulate sending failure
      await qaHelpers.simulateMessageSendingFailure();

      // Attempt to send message
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Message that will fail');
      await page.click('[data-testid="send-message-button"]');

      // Verify error handling
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to send message');
    });

    test('should handle webhook processing failures', async () => {
      // Simulate webhook failure
      const response = await page.request.post('/api/webhooks/twilio/sms', {
        data: { invalid: 'webhook' },
        headers: { 'X-Twilio-Signature': 'invalid-signature' }
      });

      expect(response.status()).toBe(403);
    });

    test('should handle network connectivity issues', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Simulate network failure
      await page.context().setOffline(true);

      // Attempt to send message
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Message during network failure');
      await page.click('[data-testid="send-message-button"]');

      // Verify offline handling
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-queued"]')).toBeVisible();

      // Restore connectivity
      await page.context().setOffline(false);
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    });
  });
});
