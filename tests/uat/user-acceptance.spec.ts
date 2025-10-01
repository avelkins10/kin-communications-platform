import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('User Acceptance Testing (UAT)', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Agent User Stories', () => {
    test('As an agent, I should be able to handle incoming calls efficiently', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate incoming call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      
      // Verify call notification appears
      await expect(page.locator('[data-testid="incoming-call-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="customer-info"]')).toContainText(testData.contacts.customer.name);

      // Answer the call
      await page.click('[data-testid="answer-call-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();

      // Test call controls
      await page.click('[data-testid="mute-button"]');
      await expect(page.locator('[data-testid="mute-indicator"]')).toBeVisible();

      await page.click('[data-testid="hold-button"]');
      await expect(page.locator('[data-testid="hold-indicator"]')).toBeVisible();

      // End the call
      await page.click('[data-testid="end-call-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).not.toBeVisible();

      // Verify call appears in history
      await page.goto('/dashboard/calls');
      await expect(page.locator('[data-testid="calls-table"]')).toBeVisible();
      const callRecordCount = await page.locator('[data-testid="call-record"]').count();
      expect(callRecordCount).toBeGreaterThan(0);
    });

    test('As an agent, I should be able to send and receive SMS messages', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Send outbound SMS
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone);
      await page.fill('[data-testid="message-text"]', 'Hello, this is a test message from KIN Communications.');
      await page.click('[data-testid="send-message-button"]');

      // Verify message sent
      await expect(page.locator('[data-testid="message-sent-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversation-thread"]')).toContainText('Hello, this is a test message from KIN Communications.');

      // Simulate inbound SMS
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Thank you for your message. I will get back to you soon.');

      // Verify message received
      await expect(page.locator('[data-testid="new-message-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="conversation-thread"]')).toContainText('Thank you for your message. I will get back to you soon.');
    });

    test('As an agent, I should be able to process voicemails with transcription', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Simulate voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Hello, this is a test voicemail message. I need help with my service.');

      // Verify voicemail appears in queue
      await expect(page.locator('[data-testid="voicemail-queue"]')).toBeVisible();
      const voicemailItemCount = await page.locator('[data-testid="voicemail-item"]').count();
      expect(voicemailItemCount).toBeGreaterThan(0);

      // Test voicemail processing
      await page.click('[data-testid="voicemail-item"]');
      await expect(page.locator('[data-testid="transcription-text"]')).toBeVisible();
      await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();

      // Test one-click callback
      await page.click('[data-testid="callback-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
    });

    test('As an agent, I should see customer context during interactions', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate call with customer
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify customer context panel
      await expect(page.locator('[data-testid="customer-context-panel"]')).toBeVisible();
      await expect(page.locator('[data-testid="quickbase-iframe"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-coordinator"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-status"]')).toBeVisible();
    });
  });

  test.describe('Supervisor User Stories', () => {
    test('As a supervisor, I should be able to monitor team performance', async () => {
      await qaHelpers.loginAs(page, 'supervisor');
      await page.goto('/dashboard/team');

      // Verify team dashboard
      await expect(page.locator('[data-testid="team-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="agent-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="queue-metrics"]')).toBeVisible();
      await expect(page.locator('[data-testid="performance-metrics"]')).toBeVisible();

      // Test real-time updates
      await qaHelpers.simulateQueueUpdate('support_queue', 5, 3);
      await expect(page.locator('[data-testid="queue-count"]')).toHaveText('5');
      await expect(page.locator('[data-testid="available-agents"]')).toHaveText('3');
    });

    test('As a supervisor, I should be able to assign tasks to agents', async () => {
      await qaHelpers.loginAs(page, 'supervisor');
      await page.goto('/dashboard/taskrouter');

      // Create new task
      await page.click('[data-testid="create-task-button"]');
      await page.fill('[data-testid="task-name"]', 'Follow up with VIP customer');
      await page.fill('[data-testid="task-description"]', 'Customer called about service issue, needs follow up');
      await page.selectOption('[data-testid="task-priority"]', 'high');
      await page.selectOption('[data-testid="task-assignee"]', testData.users.agent.id);
      await page.click('[data-testid="create-task-confirm-button"]');

      // Verify task created
      await expect(page.locator('[data-testid="task-created"]')).toBeVisible();
      await expect(page.locator('[data-testid="task-list"]')).toContainText('Follow up with VIP customer');
    });

    test('As a supervisor, I should be able to configure routing rules', async () => {
      await qaHelpers.loginAs(page, 'supervisor');
      await page.goto('/dashboard/taskrouter/routing-rules');

      // Create routing rule
      await page.click('[data-testid="create-rule-button"]');
      await page.fill('[data-testid="rule-name"]', 'Emergency Routing');
      await page.fill('[data-testid="rule-condition"]', 'priority == "emergency"');
      await page.selectOption('[data-testid="rule-action"]', 'route_to_emergency_queue');
      await page.fill('[data-testid="rule-priority"]', '1');
      await page.click('[data-testid="save-rule-button"]');

      // Verify rule created
      await expect(page.locator('[data-testid="rule-created"]')).toBeVisible();
      await expect(page.locator('[data-testid="routing-rules-list"]')).toContainText('Emergency Routing');
    });
  });

  test.describe('Admin User Stories', () => {
    test('As an admin, I should be able to manage users and permissions', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Create new user
      await page.click('[data-testid="add-user-button"]');
      await page.fill('[data-testid="user-name"]', 'New Test Agent');
      await page.fill('[data-testid="user-email"]', 'newagent@example.com');
      await page.selectOption('[data-testid="user-role"]', 'agent');
      await page.click('[data-testid="save-user"]');

      // Verify user created
      await expect(page.locator('[data-testid="user-list"]')).toContainText('New Test Agent');

      // Test TaskRouter sync
      await page.click('[data-testid="sync-taskrouter-button"]');
      await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
    });

    test('As an admin, I should be able to configure phone numbers', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/phone-numbers');

      // Purchase new phone number
      await page.click('[data-testid="purchase-number-button"]');
      await page.selectOption('[data-testid="area-code"]', '555');
      await page.click('[data-testid="search-numbers"]');
      await page.click('[data-testid="purchase-selected"]');

      // Verify phone number configuration
      await expect(page.locator('[data-testid="phone-number-list"]')).toContainText('+1555');

      // Configure webhook URLs
      await page.click('[data-testid="configure-webhooks"]');
      await page.fill('[data-testid="voice-webhook"]', 'https://test.ngrok.io/api/webhooks/twilio/voice');
      await page.fill('[data-testid="sms-webhook"]', 'https://test.ngrok.io/api/webhooks/twilio/sms');
      await page.click('[data-testid="save-webhooks"]');

      // Verify webhook configuration
      await expect(page.locator('[data-testid="webhook-saved"]')).toBeVisible();
    });

    test('As an admin, I should be able to configure business hours and IVR', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/business-hours');

      // Configure business hours
      await page.check('[data-testid="monday-enabled"]');
      await page.fill('[data-testid="monday-start"]', '09:00');
      await page.fill('[data-testid="monday-end"]', '17:00');
      await page.click('[data-testid="save-business-hours"]');

      // Verify business hours saved
      await expect(page.locator('[data-testid="business-hours-saved"]')).toBeVisible();

      // Configure IVR
      await page.goto('/dashboard/settings/ivr');
      await page.fill('[data-testid="welcome-message"]', 'Thank you for calling KIN Communications. Please listen to the following options.');
      await page.click('[data-testid="add-ivr-option"]');
      await page.fill('[data-testid="option-1-key"]', '1');
      await page.fill('[data-testid="option-1-description"]', 'Press 1 for Sales');
      await page.selectOption('[data-testid="option-1-destination"]', 'sales');
      await page.click('[data-testid="save-ivr"]');

      // Verify IVR configuration
      await expect(page.locator('[data-testid="ivr-saved"]')).toBeVisible();
    });
  });

  test.describe('Field Crew User Stories', () => {
    test('As a field crew member, I should be able to receive task assignments', async () => {
      await qaHelpers.loginAs(page, 'field_crew');
      await page.goto('/dashboard/tasks');

      // Verify task assignments
      await expect(page.locator('[data-testid="task-assignments"]')).toBeVisible();
      const taskItemCount = await page.locator('[data-testid="task-item"]').count();
      expect(taskItemCount).toBeGreaterThan(0);

      // Accept task
      await page.click('[data-testid="accept-task-button"]');
      await expect(page.locator('[data-testid="task-accepted"]')).toBeVisible();

      // Update task status
      await page.selectOption('[data-testid="task-status"]', 'in_progress');
      await page.fill('[data-testid="task-notes"]', 'Started work on customer site');
      await page.click('[data-testid="update-task-button"]');

      // Verify task updated
      await expect(page.locator('[data-testid="task-updated"]')).toBeVisible();
    });

    test('As a field crew member, I should be able to communicate with the office', async () => {
      await qaHelpers.loginAs(page, 'field_crew');
      await page.goto('/dashboard/messages');

      // Send message to office
      await page.click('[data-testid="new-message-button"]');
      await page.fill('[data-testid="recipient-phone"]', testData.contacts.salesRep.phone);
      await page.fill('[data-testid="message-text"]', 'On site at customer location, starting work');
      await page.click('[data-testid="send-message-button"]');

      // Verify message sent
      await expect(page.locator('[data-testid="message-sent-indicator"]')).toBeVisible();

      // Receive message from office
      await qaHelpers.simulateInboundSMS(testData.contacts.salesRep.phone, 'Thanks for the update. Let us know when you finish.');
      await expect(page.locator('[data-testid="new-message-notification"]')).toBeVisible();
    });
  });

  test.describe('Sales Rep User Stories', () => {
    test('As a sales rep, I should be able to manage customer relationships', async () => {
      await qaHelpers.loginAs(page, 'sales_rep');
      await page.goto('/dashboard/contacts');

      // Search for customer
      await page.fill('[data-testid="customer-search"]', testData.contacts.customer.phone);
      await page.click('[data-testid="search-button"]');

      // Verify customer data
      await expect(page.locator('[data-testid="customer-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-coordinator"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-status"]')).toBeVisible();

      // Log activity
      await page.click('[data-testid="log-activity-button"]');
      await page.selectOption('[data-testid="activity-type"]', 'call');
      await page.fill('[data-testid="activity-description"]', 'Followed up with customer about service');
      await page.click('[data-testid="save-activity-button"]');

      // Verify activity logged
      await expect(page.locator('[data-testid="activity-logged"]')).toBeVisible();
    });

    test('As a sales rep, I should be able to initiate outbound calls', async () => {
      await qaHelpers.loginAs(page, 'sales_rep');
      await page.goto('/dashboard/contacts');

      // Find customer and initiate call
      await page.click(`[data-testid="call-contact-${testData.contacts.customer.id}"]`);
      
      // Verify call initiation
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="call-status"]')).toContainText('Connecting');
      await expect(page.locator('[data-testid="caller-info"]')).toContainText(testData.contacts.customer.name);
    });
  });

  test.describe('Cross-Functional User Stories', () => {
    test('Users should see real-time updates across the platform', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Verify real-time queue display
      await expect(page.locator('[data-testid="live-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="queue-count"]')).toBeVisible();

      // Simulate queue update
      await qaHelpers.simulateQueueUpdate();
      
      // Verify real-time update
      await expect(page.locator('[data-testid="queue-count"]')).toHaveText(/\d+/);

      // Test presence indicators
      await page.goto('/dashboard/team');
      await expect(page.locator('[data-testid="presence-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="online-status"]')).toContainText('Online');
    });

    test('Users should be able to handle multiple concurrent operations', async () => {
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

    test('Users should have access to comprehensive help and documentation', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Access help system
      await page.click('[data-testid="help-button"]');
      await expect(page.locator('[data-testid="help-panel"]')).toBeVisible();

      // Search help
      await page.fill('[data-testid="help-search"]', 'making calls');
      await page.click('[data-testid="help-search-button"]');
      await expect(page.locator('[data-testid="help-results"]')).toBeVisible();

      // Access documentation
      await page.click('[data-testid="documentation-link"]');
      await expect(page.locator('[data-testid="documentation-content"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('Users should handle network connectivity issues gracefully', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate network failure
      await page.context().setOffline(true);
      
      // Verify offline handling
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Restore connectivity
      await page.context().setOffline(false);
      await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    });

    test('Users should handle webhook failures gracefully', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate webhook failure
      await qaHelpers.simulateWebhookFailure();
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('Users should handle high load scenarios', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate high load
      await qaHelpers.simulateHighLoad();

      // Verify UI remains responsive
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
    });
  });
});
