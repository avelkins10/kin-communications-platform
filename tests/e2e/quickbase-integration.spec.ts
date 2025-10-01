import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('Quickbase Integration - Phase 6', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Customer Data Lookup', () => {
    test('should lookup customer by phone number (Field 148)', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer by phone number
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify customer data retrieved
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-name"]')).toContainText(testData.contacts.customer.name);
      await expect(page.locator('[data-testid="customer-company"]')).toContainText(testData.contacts.customer.company);
      await expect(page.locator('[data-testid="customer-phone"]')).toContainText(testData.contacts.customer.phone);
    });

    test('should retrieve Project Coordinator assignment (Field 346)', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify Project Coordinator information
      await expect(page.locator('[data-testid="project-coordinator"]')).toBeVisible();
      await expect(page.locator('[data-testid="pc-name"]')).toContainText(testData.contacts.customer.projectCoordinator.name);
      await expect(page.locator('[data-testid="pc-email"]')).toContainText(testData.contacts.customer.projectCoordinator.email);
      await expect(page.locator('[data-testid="pc-phone"]')).toContainText(testData.contacts.customer.projectCoordinator.phone);
    });

    test('should retrieve project status (Field 255)', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify project status
      await expect(page.locator('[data-testid="project-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="status-value"]')).toContainText(testData.contacts.customer.projectStatus);
      await expect(page.locator('[data-testid="status-date"]')).toBeVisible();
    });

    test('should handle customer not found scenarios', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for non-existent customer
      await page.fill('[data-testid="phone-search"]', '+15559999999');
      await page.click('[data-testid="search-button"]');

      // Verify not found handling
      await expect(page.locator('[data-testid="customer-not-found"]')).toBeVisible();
      await expect(page.locator('[data-testid="create-new-contact-prompt"]')).toBeVisible();
    });

    test('should display complete customer profile', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify complete profile display
      await expect(page.locator('[data-testid="customer-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-details"]')).toBeVisible();
      await expect(page.locator('[data-testid="communication-history"]')).toBeVisible();
    });
  });

  test.describe('Automatic Customer Identification', () => {
    test('should identify customer during inbound calls', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate inbound call from known customer
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);

      // Verify automatic customer identification
      await expect(page.locator('[data-testid="incoming-call-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="caller-name"]')).toContainText(testData.contacts.customer.name);
      await expect(page.locator('[data-testid="caller-company"]')).toContainText(testData.contacts.customer.company);
    });

    test('should identify customer during SMS conversations', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Simulate inbound SMS from known customer
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Hello, I need help with my project');

      // Verify automatic customer identification
      await expect(page.locator('[data-testid="conversation-thread"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-context"]')).toContainText(testData.contacts.customer.name);
    });

    test('should identify customer during voicemail', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate voicemail from known customer
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Hi, this is John from ABC Company');

      // Verify automatic customer identification
      await page.goto('/dashboard/voicemails');
      await expect(page.locator('[data-testid="voicemail-item"]').first()).toContainText(testData.contacts.customer.name);
    });
  });

  test.describe('Customer Context Panel', () => {
    test('should display customer context panel during calls', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start call with customer
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify customer context panel
      await expect(page.locator('[data-testid="customer-context-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-summary"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-summary"]')).toBeVisible();
    });

    test('should display Quickbase iframe integration', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start call with customer
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify Quickbase iframe
      await expect(page.locator('[data-testid="quickbase-iframe"]')).toBeVisible();
      await expect(page.locator('[data-testid="iframe-loading"]')).not.toBeVisible();
    });

    test('should update context panel with real-time data', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start call with customer
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Simulate data update in Quickbase
      await qaHelpers.simulateQuickbaseDataUpdate(testData.contacts.customer.id);

      // Verify real-time update
      await expect(page.locator('[data-testid="data-updated-indicator"]')).toBeVisible();
    });

    test('should handle iframe loading failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate iframe loading failure
      await qaHelpers.simulateIframeLoadingFailure();

      // Start call with customer
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify error handling
      await expect(page.locator('[data-testid="iframe-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-iframe-button"]')).toBeVisible();
    });
  });

  test.describe('Communication Activity Logging', () => {
    test('should log call activity to Quickbase', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start and end call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');
      await page.click('[data-testid="end-call-button"]');

      // Verify activity logging
      await expect(page.locator('[data-testid="activity-logged"]')).toBeVisible();
      await expect(page.locator('[data-testid="log-type"]')).toContainText('Call');
    });

    test('should log SMS activity to Quickbase', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Send SMS
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Test message for activity logging');
      await page.click('[data-testid="send-message-button"]');

      // Verify activity logging
      await expect(page.locator('[data-testid="activity-logged"]')).toBeVisible();
      await expect(page.locator('[data-testid="log-type"]')).toContainText('SMS');
    });

    test('should log voicemail activity to Quickbase', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Create voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail for activity logging');

      // Verify activity logging
      await expect(page.locator('[data-testid="activity-logged"]')).toBeVisible();
      await expect(page.locator('[data-testid="log-type"]')).toContainText('Voicemail');
    });

    test('should include call duration and outcome in logs', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start and end call with specific duration
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');
      
      // Simulate call duration
      await qaHelpers.simulateCallDuration(120); // 2 minutes
      await page.click('[data-testid="end-call-button"]');

      // Verify detailed logging
      await expect(page.locator('[data-testid="activity-logged"]')).toBeVisible();
      await expect(page.locator('[data-testid="call-duration"]')).toContainText('2:00');
      await expect(page.locator('[data-testid="call-outcome"]')).toContainText('Completed');
    });
  });

  test.describe('Data Synchronization', () => {
    test('should sync customer data changes', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Simulate data change in Quickbase
      await qaHelpers.simulateQuickbaseDataChange(testData.contacts.customer.id, {
        projectStatus: 'In Progress',
        lastUpdated: new Date().toISOString()
      });

      // Verify data sync
      await expect(page.locator('[data-testid="data-sync-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="status-value"]')).toContainText('In Progress');
    });

    test('should handle sync conflicts', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Simulate sync conflict
      await qaHelpers.simulateSyncConflict(testData.contacts.customer.id);

      // Verify conflict resolution
      await expect(page.locator('[data-testid="sync-conflict-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="resolve-conflict-button"]')).toBeVisible();
    });

    test('should retry failed sync operations', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Simulate sync failure
      await qaHelpers.simulateSyncFailure();

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify retry mechanism
      await expect(page.locator('[data-testid="sync-failed"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-sync-button"]')).toBeVisible();

      // Retry sync
      await page.click('[data-testid="retry-sync-button"]');
      await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test('should receive real-time Quickbase updates', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Simulate real-time update
      await qaHelpers.simulateRealTimeUpdate(testData.contacts.customer.id);

      // Verify real-time update
      await expect(page.locator('[data-testid="real-time-update"]')).toBeVisible();
      await expect(page.locator('[data-testid="update-timestamp"]')).toBeVisible();
    });

    test('should handle multiple concurrent updates', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Simulate multiple concurrent updates
      await qaHelpers.simulateConcurrentUpdates(testData.contacts.customer.id);

      // Verify all updates processed
      await expect(page.locator('[data-testid="update-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="processed-updates"]')).toContainText('3');
    });

    test('should maintain data consistency during updates', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Simulate rapid updates
      await qaHelpers.simulateRapidUpdates(testData.contacts.customer.id);

      // Verify data consistency
      await expect(page.locator('[data-testid="data-consistent"]')).toBeVisible();
      await expect(page.locator('[data-testid="inconsistent-data"]')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle Quickbase API errors', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Simulate API error
      await qaHelpers.simulateQuickbaseAPIError();

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify error handling
      await expect(page.locator('[data-testid="api-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Quickbase API error');
    });

    test('should handle network connectivity issues', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Simulate network failure
      await page.context().setOffline(true);

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify offline handling
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="cached-data"]')).toBeVisible();

      // Restore connectivity
      await page.context().setOffline(false);
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    });

    test('should handle authentication failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Simulate authentication failure
      await qaHelpers.simulateAuthenticationFailure();

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify authentication error handling
      await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="reauthenticate-button"]')).toBeVisible();
    });

    test('should handle rate limiting', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Simulate rate limiting
      await qaHelpers.simulateRateLimiting();

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify rate limiting handling
      await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-after"]')).toBeVisible();
    });
  });

  test.describe('Performance and Caching', () => {
    test('should cache customer data for performance', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // First search (should cache data)
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();

      // Second search (should use cache)
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify cache usage
      await expect(page.locator('[data-testid="cached-data-indicator"]')).toBeVisible();
    });

    test('should handle cache invalidation', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Search and cache data
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();

      // Simulate data change and cache invalidation
      await qaHelpers.simulateCacheInvalidation(testData.contacts.customer.id);

      // Search again
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify fresh data
      await expect(page.locator('[data-testid="fresh-data-indicator"]')).toBeVisible();
    });

    test('should handle large dataset queries efficiently', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Simulate large dataset query
      await qaHelpers.simulateLargeDatasetQuery();

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify efficient handling
      await expect(page.locator('[data-testid="query-performance"]')).toBeVisible();
      await expect(page.locator('[data-testid="response-time"]')).toContainText(/\d+ms/);
    });
  });

  test.describe('Data Validation', () => {
    test('should validate phone number format', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Test invalid phone number
      await page.fill('[data-testid="phone-search"]', 'invalid-phone');
      await page.click('[data-testid="search-button"]');

      // Verify validation
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid phone number format');
    });

    test('should validate customer data integrity', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Simulate corrupted customer data
      await qaHelpers.simulateCorruptedCustomerData();

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify data integrity handling
      await expect(page.locator('[data-testid="data-integrity-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="repair-data-button"]')).toBeVisible();
    });

    test('should handle missing required fields', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Simulate customer with missing required fields
      await qaHelpers.simulateMissingRequiredFields();

      // Search for customer
      await page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify missing fields handling
      await expect(page.locator('[data-testid="missing-fields-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="incomplete-data-indicator"]')).toBeVisible();
    });
  });
});

