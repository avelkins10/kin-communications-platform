import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('Real-time Features - Phase 9', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Socket.io Connectivity', () => {
    test('should establish Socket.io connection on page load', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Verify Socket.io connection
      await expect(page.locator('[data-testid="socket-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');
    });

    test('should handle Socket.io connection failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate Socket.io connection failure
      await qaHelpers.simulateSocketConnectionFailure();
      
      await page.goto('/dashboard');

      // Verify connection failure handling
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Disconnected');
      await expect(page.locator('[data-testid="connection-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="reconnect-button"]')).toBeVisible();
    });

    test('should automatically reconnect Socket.io connection', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate connection loss
      await qaHelpers.simulateSocketDisconnection();
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Disconnected');

      // Simulate reconnection
      await qaHelpers.simulateSocketReconnection();
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');
    });

    test('should handle multiple Socket.io connection attempts', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate multiple connection failures
      await qaHelpers.simulateMultipleConnectionFailures();
      
      await page.goto('/dashboard');

      // Verify retry mechanism
      await expect(page.locator('[data-testid="connection-retry"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-count"]')).toContainText('3');
    });
  });

  test.describe('Live Queue Updates', () => {
    test('should display live queue updates in real-time', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Verify initial queue display
      await expect(page.locator('[data-testid="live-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="queue-count"]')).toBeVisible();

      // Simulate queue update
      await qaHelpers.simulateQueueUpdate({ count: 5 });

      // Verify real-time update
      await expect(page.locator('[data-testid="queue-count"]')).toContainText('5');
      await expect(page.locator('[data-testid="queue-updated"]')).toBeVisible();
    });

    test('should update queue status for different queues', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate updates for different queues
      await qaHelpers.simulateQueueUpdate({ queue: 'sales', count: 3 });
      await qaHelpers.simulateQueueUpdate({ queue: 'support', count: 7 });

      // Verify queue-specific updates
      await expect(page.locator('[data-testid="sales-queue-count"]')).toContainText('3');
      await expect(page.locator('[data-testid="support-queue-count"]')).toContainText('7');
    });

    test('should handle queue overflow scenarios', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate queue overflow
      await qaHelpers.simulateQueueOverflow();

      // Verify overflow handling
      await expect(page.locator('[data-testid="queue-overflow-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="overflow-count"]')).toContainText('50+');
    });

    test('should display queue wait times', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate queue with wait time
      await qaHelpers.simulateQueueUpdate({ 
        queue: 'support', 
        count: 8, 
        averageWaitTime: 300 
      });

      // Verify wait time display
      await expect(page.locator('[data-testid="average-wait-time"]')).toContainText('5:00');
      await expect(page.locator('[data-testid="wait-time-indicator"]')).toBeVisible();
    });
  });

  test.describe('Presence Indicators', () => {
    test('should display user presence status', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/team');

      // Verify presence indicators
      await expect(page.locator('[data-testid="presence-indicators"]')).toBeVisible();
      await expect(page.locator('[data-testid="online-status"]')).toContainText('Online');
      await expect(page.locator('[data-testid="status-indicator"]')).toHaveClass(/online/);
    });

    test('should update presence status in real-time', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/team');

      // Simulate status change
      await qaHelpers.simulatePresenceStatusChange('away');

      // Verify real-time status update
      await expect(page.locator('[data-testid="online-status"]')).toContainText('Away');
      await expect(page.locator('[data-testid="status-indicator"]')).toHaveClass(/away/);
    });

    test('should display team member presence', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/team');

      // Verify team member presence
      await expect(page.locator('[data-testid="team-member-presence"]')).toBeVisible();
      const memberOnlineCount = await page.locator('[data-testid="member-online"]').count();
      expect(memberOnlineCount).toBeGreaterThan(0);
      const memberAwayCount = await page.locator('[data-testid="member-away"]').count();
      expect(memberAwayCount).toBeGreaterThan(0);
    });

    test('should handle presence status changes across users', async () => {
      // Create second browser context
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (!page2) return;

      // Login on both pages
      await qaHelpers.loginAs(page, 'agent');
      await qaHelpers.loginAs(page2, 'agent2');
      
      await page.goto('/dashboard/team');
      await page2.goto('/dashboard/team');

      // Change status on second page
      await page2.click('[data-testid="status-selector"]');
      await page2.click('[data-testid="status-busy"]');

      // Verify status change appears on first page
      await expect(page.locator('[data-testid="agent2-status"]')).toContainText('Busy');

      await context2?.close();
    });
  });

  test.describe('Real-time Call Status Changes', () => {
    test('should update call status in real-time', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify initial call status
      await expect(page.locator('[data-testid="call-status"]')).toContainText('Connected');

      // Simulate call status change
      await qaHelpers.simulateCallStatusChange('on-hold');

      // Verify real-time status update
      await expect(page.locator('[data-testid="call-status"]')).toContainText('On Hold');
    });

    test('should display call duration updates', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Simulate call duration updates
      await qaHelpers.simulateCallDurationUpdate(60); // 1 minute
      await expect(page.locator('[data-testid="call-duration"]')).toContainText('1:00');

      await qaHelpers.simulateCallDurationUpdate(120); // 2 minutes
      await expect(page.locator('[data-testid="call-duration"]')).toContainText('2:00');
    });

    test('should handle call transfer status updates', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start call and initiate transfer
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');
      await page.click('[data-testid="transfer-button"]');

      // Simulate transfer status updates
      await qaHelpers.simulateCallStatusChange('transferring');
      await expect(page.locator('[data-testid="call-status"]')).toContainText('Transferring');

      await qaHelpers.simulateCallStatusChange('transferred');
      await expect(page.locator('[data-testid="call-status"]')).toContainText('Transferred');
    });

    test('should display call quality indicators', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Start call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Simulate call quality updates
      await qaHelpers.simulateCallQualityUpdate('excellent');
      await expect(page.locator('[data-testid="call-quality"]')).toHaveClass(/excellent/);

      await qaHelpers.simulateCallQualityUpdate('poor');
      await expect(page.locator('[data-testid="call-quality"]')).toHaveClass(/poor/);
    });
  });

  test.describe('Instant Notifications', () => {
    test('should receive instant voicemail notifications', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate new voicemail
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'New voicemail message');

      // Verify instant notification
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-title"]')).toContainText('New Voicemail');
      await expect(page.locator('[data-testid="notification-message"]')).toContainText('New voicemail message');
    });

    test('should receive instant SMS notifications', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate new SMS
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'New SMS message');

      // Verify instant notification
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-title"]')).toContainText('New Message');
      await expect(page.locator('[data-testid="notification-message"]')).toContainText('New SMS message');
    });

    test('should receive instant call notifications', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate incoming call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);

      // Verify instant notification
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-title"]')).toContainText('Incoming Call');
      await expect(page.locator('[data-testid="caller-info"]')).toContainText(testData.contacts.customer.name);
    });

    test('should handle notification dismissal', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate notification
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test notification');

      // Dismiss notification
      await page.click('[data-testid="dismiss-notification"]');

      // Verify notification dismissed
      await expect(page.locator('[data-testid="notification-toast"]')).not.toBeVisible();
    });

    test('should handle multiple concurrent notifications', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate multiple notifications
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'First voicemail');
      await qaHelpers.simulateInboundSMS(testData.contacts.vipCustomer.phone, 'Second SMS');
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);

      // Verify multiple notifications
      await expect(page.locator('[data-testid="notification-toast"]')).toHaveCount(3);
      await expect(page.locator('[data-testid="notification-queue"]')).toBeVisible();
    });
  });

  test.describe('Multi-user Synchronization', () => {
    test('should sync data across multiple browser sessions', async () => {
      // Create second browser context
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (!page2) return;

      // Login on both pages
      await qaHelpers.loginAs(page, 'agent');
      await qaHelpers.loginAs(page2, 'agent2');
      
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

    test('should sync call status across users', async () => {
      // Create second browser context
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (!page2) return;

      // Login on both pages
      await qaHelpers.loginAs(page, 'agent');
      await qaHelpers.loginAs(page2, 'agent2');
      
      await page.goto('/dashboard');
      await page2.goto('/dashboard/team');

      // Start call on first page
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify call status appears on second page
      await expect(page2.locator('[data-testid="agent-call-status"]')).toContainText('On Call');

      await context2?.close();
    });

    test('should sync queue updates across users', async () => {
      // Create second browser context
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (!page2) return;

      // Login on both pages
      await qaHelpers.loginAs(page, 'agent');
      await qaHelpers.loginAs(page2, 'agent2');
      
      await page.goto('/dashboard');
      await page2.goto('/dashboard');

      // Simulate queue update
      await qaHelpers.simulateQueueUpdate({ count: 10 });

      // Verify queue update appears on both pages
      await expect(page.locator('[data-testid="queue-count"]')).toContainText('10');
      await expect(page2.locator('[data-testid="queue-count"]')).toContainText('10');

      await context2?.close();
    });

    test('should handle user disconnection gracefully', async () => {
      // Create second browser context
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (!page2) return;

      // Login on both pages
      await qaHelpers.loginAs(page, 'agent');
      await qaHelpers.loginAs(page2, 'agent2');
      
      await page.goto('/dashboard/team');
      await page2.goto('/dashboard/team');

      // Close second page (simulate disconnection)
      await context2?.close();

      // Verify user appears offline on first page
      await expect(page.locator('[data-testid="agent2-status"]')).toContainText('Offline');
    });
  });

  test.describe('Room Management', () => {
    test('should join appropriate Socket.io rooms', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Verify room membership
      await expect(page.locator('[data-testid="room-membership"]')).toBeVisible();
      await expect(page.locator('[data-testid="agent-room"]')).toBeVisible();
      await expect(page.locator('[data-testid="team-room"]')).toBeVisible();
    });

    test('should leave rooms on page navigation', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Verify initial room membership
      await expect(page.locator('[data-testid="room-membership"]')).toBeVisible();

      // Navigate to different page
      await page.goto('/dashboard/settings');

      // Verify room cleanup
      await expect(page.locator('[data-testid="room-cleanup"]')).toBeVisible();
    });

    test('should handle room join failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate room join failure
      await qaHelpers.simulateRoomJoinFailure();
      
      await page.goto('/dashboard');

      // Verify error handling
      await expect(page.locator('[data-testid="room-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-join-button"]')).toBeVisible();
    });
  });

  test.describe('Event Broadcasting', () => {
    test('should broadcast events to appropriate users', async () => {
      // Create second browser context
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (!page2) return;

      // Login on both pages
      await qaHelpers.loginAs(page, 'agent');
      await qaHelpers.loginAs(page2, 'agent2');
      
      await page.goto('/dashboard');
      await page2.goto('/dashboard');

      // Broadcast event from first page
      await qaHelpers.simulateEventBroadcast('system-maintenance', { message: 'System maintenance in 5 minutes' });

      // Verify event received on second page
      await expect(page2.locator('[data-testid="broadcast-event"]')).toBeVisible();
      await expect(page2.locator('[data-testid="broadcast-message"]')).toContainText('System maintenance in 5 minutes');

      await context2?.close();
    });

    test('should handle broadcast event failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate broadcast failure
      await qaHelpers.simulateBroadcastFailure();

      // Attempt to broadcast event
      await qaHelpers.simulateEventBroadcast('test-event', { message: 'Test message' });

      // Verify error handling
      await expect(page.locator('[data-testid="broadcast-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-broadcast-button"]')).toBeVisible();
    });

    test('should filter events based on user roles', async () => {
      // Create second browser context
      const context2 = await page.context().browser()?.newContext();
      const page2 = await context2?.newPage();
      
      if (!page2) return;

      // Login with different roles
      await qaHelpers.loginAs(page, 'admin');
      await qaHelpers.loginAs(page2, 'agent');
      
      await page.goto('/dashboard');
      await page2.goto('/dashboard');

      // Broadcast admin-only event
      await qaHelpers.simulateEventBroadcast('admin-alert', { message: 'Admin only message' }, { roles: ['admin'] });

      // Verify event filtering
      await expect(page.locator('[data-testid="broadcast-event"]')).toBeVisible();
      await expect(page2.locator('[data-testid="broadcast-event"]')).not.toBeVisible();

      await context2?.close();
    });
  });

  test.describe('Activity Feed', () => {
    test('should display real-time activity feed', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/activity');

      // Verify activity feed
      await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
      const activityItemCount = await page.locator('[data-testid="activity-item"]').count();
      expect(activityItemCount).toBeGreaterThan(0);
    });

    test('should update activity feed in real-time', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/activity');

      // Simulate new activity
      await qaHelpers.simulateActivity('call-started', { 
        user: testData.users.agent.name, 
        customer: testData.contacts.customer.name 
      });

      // Verify real-time update
      await expect(page.locator('[data-testid="activity-item"]').first()).toContainText('Call started');
      await expect(page.locator('[data-testid="activity-item"]').first()).toContainText(testData.contacts.customer.name);
    });

    test('should filter activity feed by type', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/activity');

      // Filter by call activities
      await page.selectOption('[data-testid="activity-filter"]', 'calls');

      // Verify filtered results
      const activityItemCount = await page.locator('[data-testid="activity-item"]').count();
      expect(activityItemCount).toBeGreaterThan(0);
      await expect(page.locator('[data-testid="activity-type"]')).toContainText('Call');
    });

    test('should handle activity feed pagination', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/activity');

      // Simulate many activities
      await qaHelpers.simulateMultipleActivities(50);

      // Verify pagination
      await expect(page.locator('[data-testid="activity-pagination"]')).toBeVisible();
      await expect(page.locator('[data-testid="load-more-button"]')).toBeVisible();

      // Load more activities
      await page.click('[data-testid="load-more-button"]');
      const activityItemCount = await page.locator('[data-testid="activity-item"]').count();
      expect(activityItemCount).toBeGreaterThan(10);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle Socket.io connection errors gracefully', async () => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate connection error
      await qaHelpers.simulateSocketError();
      
      await page.goto('/dashboard');

      // Verify error handling
      await expect(page.locator('[data-testid="connection-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Connection error');
      await expect(page.locator('[data-testid="retry-connection-button"]')).toBeVisible();
    });

    test('should handle message delivery failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate message delivery failure
      await qaHelpers.simulateMessageDeliveryFailure();

      // Attempt to send message
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Test message');

      // Verify error handling
      await expect(page.locator('[data-testid="delivery-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-delivery-button"]')).toBeVisible();
    });

    test('should handle event processing failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate event processing failure
      await qaHelpers.simulateEventProcessingFailure();

      // Simulate event
      await qaHelpers.simulateQueueUpdate();

      // Verify error handling
      await expect(page.locator('[data-testid="event-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-log"]')).toBeVisible();
    });

    test('should recover from temporary service outages', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate service outage
      await qaHelpers.simulateServiceOutage();

      // Verify outage handling
      await expect(page.locator('[data-testid="service-outage"]')).toBeVisible();
      await expect(page.locator('[data-testid="outage-message"]')).toContainText('Service temporarily unavailable');

      // Simulate service recovery
      await qaHelpers.simulateServiceRecovery();

      // Verify recovery
      await expect(page.locator('[data-testid="service-outage"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="service-recovered"]')).toBeVisible();
    });
  });
});
