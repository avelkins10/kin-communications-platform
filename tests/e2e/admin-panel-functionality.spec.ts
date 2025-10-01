import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('Admin Panel Functionality - Phase 8', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('User Management', () => {
    test('should create new user with proper role assignment', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Create new user
      await page.click('[data-testid="add-user-button"]');
      await page.fill('[data-testid="user-name"]', 'New Agent');
      await page.fill('[data-testid="user-email"]', 'newagent@example.com');
      await page.selectOption('[data-testid="user-role"]', 'agent');
      await page.fill('[data-testid="user-phone"]', '+15551234567');
      await page.click('[data-testid="save-user"]');

      // Verify user creation
      await expect(page.locator('[data-testid="user-list"]')).toContainText('New Agent');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('newagent@example.com');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('Agent');
    });

    test('should edit existing user information', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Edit user
      await page.click(`[data-testid="edit-user-${testData.users.agent.id}"]`);
      await page.fill('[data-testid="user-name"]', 'Updated Agent Name');
      await page.fill('[data-testid="user-email"]', 'updated@example.com');
      await page.click('[data-testid="save-user"]');

      // Verify user update
      await expect(page.locator('[data-testid="user-list"]')).toContainText('Updated Agent Name');
      await expect(page.locator('[data-testid="user-list"]')).toContainText('updated@example.com');
    });

    test('should delete user with confirmation', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Delete user
      await page.click(`[data-testid="delete-user-${testData.users.agent.id}"]`);
      await page.click('[data-testid="confirm-delete"]');

      // Verify user deletion
      await expect(page.locator('[data-testid="user-list"]')).not.toContainText(testData.users.agent.name);
    });

    test('should sync users with TaskRouter workers', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Sync with TaskRouter
      await page.click('[data-testid="sync-taskrouter-button"]');

      // Verify sync completion
      await expect(page.locator('[data-testid="sync-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="sync-timestamp"]')).toBeVisible();
    });

    test('should handle user role changes', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Change user role
      await page.click(`[data-testid="edit-user-${testData.users.agent.id}"]`);
      await page.selectOption('[data-testid="user-role"]', 'supervisor');
      await page.click('[data-testid="save-user"]');

      // Verify role change
      await expect(page.locator('[data-testid="user-list"]')).toContainText('Supervisor');
    });
  });

  test.describe('Phone Number Management', () => {
    test('should purchase new phone number', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/phone-numbers');

      // Purchase new number
      await page.click('[data-testid="purchase-number-button"]');
      await page.selectOption('[data-testid="area-code"]', '555');
      await page.click('[data-testid="search-numbers"]');

      // Select and purchase number
      await page.click('[data-testid="select-number"]');
      await page.click('[data-testid="purchase-selected"]');

      // Verify number purchase
      await expect(page.locator('[data-testid="phone-number-list"]')).toContainText('+1555');
      await expect(page.locator('[data-testid="purchase-success"]')).toBeVisible();
    });

    test('should configure phone number settings', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/phone-numbers');

      // Configure existing number
      await page.click(`[data-testid="configure-number-${testData.phoneNumbers.main}"]`);
      await page.fill('[data-testid="friendly-name"]', 'Main Business Line');
      await page.selectOption('[data-testid="voice-url"]', 'custom-voice-url');
      await page.selectOption('[data-testid="sms-url"]', 'custom-sms-url');
      await page.click('[data-testid="save-configuration"]');

      // Verify configuration
      await expect(page.locator('[data-testid="configuration-saved"]')).toBeVisible();
      await expect(page.locator('[data-testid="friendly-name-display"]')).toContainText('Main Business Line');
    });

    test('should release phone number', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/phone-numbers');

      // Release number
      await page.click(`[data-testid="release-number-${testData.phoneNumbers.temp}"]`);
      await page.fill('[data-testid="release-reason"]', 'No longer needed');
      await page.click('[data-testid="confirm-release"]');

      // Verify number release
      await expect(page.locator('[data-testid="release-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="phone-number-list"]')).not.toContainText(testData.phoneNumbers.temp);
    });

    test('should handle phone number purchase failures', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/phone-numbers');

      // Simulate purchase failure
      await qaHelpers.simulatePhoneNumberPurchaseFailure();

      // Attempt to purchase number
      await page.click('[data-testid="purchase-number-button"]');
      await page.selectOption('[data-testid="area-code"]', '555');
      await page.click('[data-testid="search-numbers"]');
      await page.click('[data-testid="select-number"]');
      await page.click('[data-testid="purchase-selected"]');

      // Verify error handling
      await expect(page.locator('[data-testid="purchase-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to purchase phone number');
    });
  });

  test.describe('Visual Routing Rule Builder', () => {
    test('should create routing rules with drag-and-drop interface', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/routing-rules');

      // Open visual builder
      await page.click('[data-testid="visual-rule-builder"]');
      await expect(page.locator('[data-testid="rule-builder-canvas"]')).toBeVisible();

      // Drag condition to canvas
      await page.dragAndDrop('[data-testid="condition-keyword"]', '[data-testid="rule-canvas"]');
      await expect(page.locator('[data-testid="keyword-condition"]')).toBeVisible();

      // Drag action to canvas
      await page.dragAndDrop('[data-testid="action-route-queue"]', '[data-testid="rule-canvas"]');
      await expect(page.locator('[data-testid="route-action"]')).toBeVisible();

      // Connect condition to action
      await page.dragAndDrop('[data-testid="condition-output"]', '[data-testid="action-input"]');
      await expect(page.locator('[data-testid="connection-line"]')).toBeVisible();
    });

    test('should configure routing rule parameters', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/routing-rules');

      // Create rule with visual builder
      await page.click('[data-testid="visual-rule-builder"]');
      await page.dragAndDrop('[data-testid="condition-keyword"]', '[data-testid="rule-canvas"]');
      await page.dragAndDrop('[data-testid="action-route-queue"]', '[data-testid="rule-canvas"]');

      // Configure keyword condition
      await page.click('[data-testid="keyword-condition"]');
      await page.fill('[data-testid="keyword-value"]', 'emergency');
      await page.selectOption('[data-testid="match-type"]', 'contains');

      // Configure route action
      await page.click('[data-testid="route-action"]');
      await page.selectOption('[data-testid="target-queue"]', 'emergency-queue');
      await page.fill('[data-testid="priority"]', '1');

      // Save rule
      await page.click('[data-testid="save-rule"]');

      // Verify rule configuration
      await expect(page.locator('[data-testid="rule-saved"]')).toBeVisible();
    });

    test('should test routing rules in visual builder', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/routing-rules');

      // Create and configure rule
      await page.click('[data-testid="visual-rule-builder"]');
      await page.dragAndDrop('[data-testid="condition-keyword"]', '[data-testid="rule-canvas"]');
      await page.dragAndDrop('[data-testid="action-route-queue"]', '[data-testid="rule-canvas"]');
      await page.click('[data-testid="keyword-condition"]');
      await page.fill('[data-testid="keyword-value"]', 'support');
      await page.click('[data-testid="route-action"]');
      await page.selectOption('[data-testid="target-queue"]', 'support-queue');

      // Test rule
      await page.click('[data-testid="test-rule"]');
      await page.fill('[data-testid="test-input"]', 'I need support with my account');
      await page.click('[data-testid="run-test"]');

      // Verify test results
      await expect(page.locator('[data-testid="test-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="test-result"]')).toContainText('support-queue');
    });

    test('should handle rule validation errors', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/routing-rules');

      // Create invalid rule
      await page.click('[data-testid="visual-rule-builder"]');
      await page.dragAndDrop('[data-testid="action-route-queue"]', '[data-testid="rule-canvas"]');
      // Don't configure the action properly

      // Try to save rule
      await page.click('[data-testid="save-rule"]');

      // Verify validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid rule configuration');
    });
  });

  test.describe('Business Hours Configuration', () => {
    test('should configure business hours for different days', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/business-hours');

      // Configure Monday hours
      await page.click('[data-testid="monday-hours"]');
      await page.fill('[data-testid="start-time"]', '09:00');
      await page.fill('[data-testid="end-time"]', '17:00');
      await page.check('[data-testid="monday-enabled"]');

      // Configure Friday hours
      await page.click('[data-testid="friday-hours"]');
      await page.fill('[data-testid="start-time"]', '09:00');
      await page.fill('[data-testid="end-time"]', '16:00');
      await page.check('[data-testid="friday-enabled"]');

      // Save configuration
      await page.click('[data-testid="save-business-hours"]');

      // Verify configuration
      await expect(page.locator('[data-testid="business-hours-saved"]')).toBeVisible();
    });

    test('should configure holiday schedules', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/business-hours');

      // Add holiday
      await page.click('[data-testid="add-holiday"]');
      await page.fill('[data-testid="holiday-name"]', 'Christmas Day');
      await page.fill('[data-testid="holiday-date"]', '2024-12-25');
      await page.selectOption('[data-testid="holiday-type"]', 'closed');
      await page.click('[data-testid="save-holiday"]');

      // Verify holiday configuration
      await expect(page.locator('[data-testid="holiday-list"]')).toContainText('Christmas Day');
      await expect(page.locator('[data-testid="holiday-list"]')).toContainText('2024-12-25');
    });

    test('should configure time zone settings', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/business-hours');

      // Set time zone
      await page.selectOption('[data-testid="time-zone"]', 'America/New_York');
      await page.click('[data-testid="save-time-zone"]');

      // Verify time zone setting
      await expect(page.locator('[data-testid="time-zone-saved"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-time-zone"]')).toContainText('America/New_York');
    });

    test('should handle business hours validation', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/business-hours');

      // Configure invalid hours (end before start)
      await page.click('[data-testid="monday-hours"]');
      await page.fill('[data-testid="start-time"]', '17:00');
      await page.fill('[data-testid="end-time"]', '09:00');
      await page.check('[data-testid="monday-enabled"]');

      // Try to save
      await page.click('[data-testid="save-business-hours"]');

      // Verify validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('End time must be after start time');
    });
  });

  test.describe('IVR Menu Designer', () => {
    test('should create IVR menu with multiple options', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/ivr');

      // Create new IVR menu
      await page.click('[data-testid="create-ivr-menu"]');
      await page.fill('[data-testid="menu-name"]', 'Main Menu');
      await page.fill('[data-testid="greeting-text"]', 'Thank you for calling KIN Communications');

      // Add menu options
      await page.click('[data-testid="add-menu-option"]');
      await page.fill('[data-testid="option-key"]', '1');
      await page.fill('[data-testid="option-text"]', 'Press 1 for Sales');
      await page.selectOption('[data-testid="option-action"]', 'route-to-queue');
      await page.selectOption('[data-testid="target-queue"]', 'sales-queue');

      await page.click('[data-testid="add-menu-option"]');
      await page.fill('[data-testid="option-key"]', '2');
      await page.fill('[data-testid="option-text"]', 'Press 2 for Support');
      await page.selectOption('[data-testid="option-action"]', 'route-to-queue');
      await page.selectOption('[data-testid="target-queue"]', 'support-queue');

      // Save IVR menu
      await page.click('[data-testid="save-ivr-menu"]');

      // Verify IVR menu creation
      await expect(page.locator('[data-testid="ivr-menu-saved"]')).toBeVisible();
      await expect(page.locator('[data-testid="menu-options"]')).toHaveCount(2);
    });

    test('should configure IVR menu with nested menus', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/ivr');

      // Create main menu
      await page.click('[data-testid="create-ivr-menu"]');
      await page.fill('[data-testid="menu-name"]', 'Main Menu');

      // Add option that leads to submenu
      await page.click('[data-testid="add-menu-option"]');
      await page.fill('[data-testid="option-key"]', '3');
      await page.fill('[data-testid="option-text"]', 'Press 3 for Technical Support');
      await page.selectOption('[data-testid="option-action"]', 'go-to-submenu');
      await page.selectOption('[data-testid="submenu"]', 'technical-support-menu');

      // Save main menu
      await page.click('[data-testid="save-ivr-menu"]');

      // Verify nested menu configuration
      await expect(page.locator('[data-testid="ivr-menu-saved"]')).toBeVisible();
      await expect(page.locator('[data-testid="submenu-reference"]')).toBeVisible();
    });

    test('should test IVR menu flow', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/ivr');

      // Create and configure IVR menu
      await page.click('[data-testid="create-ivr-menu"]');
      await page.fill('[data-testid="menu-name"]', 'Test Menu');
      await page.click('[data-testid="add-menu-option"]');
      await page.fill('[data-testid="option-key"]', '1');
      await page.fill('[data-testid="option-text"]', 'Press 1 for Sales');
      await page.selectOption('[data-testid="option-action"]', 'route-to-queue');
      await page.selectOption('[data-testid="target-queue"]', 'sales-queue');
      await page.click('[data-testid="save-ivr-menu"]');

      // Test IVR flow
      await page.click('[data-testid="test-ivr-menu"]');
      await page.click('[data-testid="simulate-call"]');
      await page.click('[data-testid="press-key-1"]');

      // Verify test results
      await expect(page.locator('[data-testid="test-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="routing-result"]')).toContainText('sales-queue');
    });

    test('should handle IVR menu validation', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/ivr');

      // Create invalid IVR menu (duplicate keys)
      await page.click('[data-testid="create-ivr-menu"]');
      await page.fill('[data-testid="menu-name"]', 'Invalid Menu');
      
      await page.click('[data-testid="add-menu-option"]');
      await page.fill('[data-testid="option-key"]', '1');
      await page.fill('[data-testid="option-text"]', 'Option 1');
      
      await page.click('[data-testid="add-menu-option"]');
      await page.fill('[data-testid="option-key"]', '1'); // Duplicate key
      await page.fill('[data-testid="option-text"]', 'Option 2');

      // Try to save
      await page.click('[data-testid="save-ivr-menu"]');

      // Verify validation error
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Duplicate option keys');
    });
  });

  test.describe('System Settings', () => {
    test('should configure system-wide settings', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/system');

      // Configure system settings
      await page.fill('[data-testid="company-name"]', 'KIN Communications Inc.');
      await page.fill('[data-testid="company-phone"]', '+15551234567');
      await page.fill('[data-testid="company-email"]', 'info@kincommunications.com');
      await page.selectOption('[data-testid="default-timezone"]', 'America/New_York');
      await page.fill('[data-testid="voicemail-timeout"]', '20');
      await page.click('[data-testid="save-system-settings"]');

      // Verify settings saved
      await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
    });

    test('should configure webhook settings', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/webhooks');

      // Configure webhook URLs
      await page.fill('[data-testid="voice-webhook-url"]', 'https://example.com/webhooks/voice');
      await page.fill('[data-testid="sms-webhook-url"]', 'https://example.com/webhooks/sms');
      await page.fill('[data-testid="status-webhook-url"]', 'https://example.com/webhooks/status');
      await page.click('[data-testid="save-webhook-settings"]');

      // Verify webhook configuration
      await expect(page.locator('[data-testid="webhooks-saved"]')).toBeVisible();
    });

    test('should configure security settings', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/security');

      // Configure security settings
      await page.check('[data-testid="require-2fa"]');
      await page.fill('[data-testid="session-timeout"]', '30');
      await page.check('[data-testid="enable-audit-logging"]');
      await page.click('[data-testid="save-security-settings"]');

      // Verify security configuration
      await expect(page.locator('[data-testid="security-saved"]')).toBeVisible();
    });

    test('should handle settings validation', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/system');

      // Configure invalid settings
      await page.fill('[data-testid="voicemail-timeout"]', 'invalid');
      await page.fill('[data-testid="company-email"]', 'invalid-email');

      // Try to save
      await page.click('[data-testid="save-system-settings"]');

      // Verify validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid email format');
    });
  });

  test.describe('Performance Monitoring Dashboard', () => {
    test('should display system performance metrics', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/performance');

      // Verify performance dashboard
      await expect(page.locator('[data-testid="performance-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="cpu-usage"]')).toBeVisible();
      await expect(page.locator('[data-testid="memory-usage"]')).toBeVisible();
      await expect(page.locator('[data-testid="disk-usage"]')).toBeVisible();
      await expect(page.locator('[data-testid="network-usage"]')).toBeVisible();
    });

    test('should display call volume statistics', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/performance');

      // Verify call statistics
      await expect(page.locator('[data-testid="call-statistics"]')).toBeVisible();
      await expect(page.locator('[data-testid="calls-today"]')).toBeVisible();
      await expect(page.locator('[data-testid="calls-this-week"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-call-duration"]')).toBeVisible();
    });

    test('should display error rates and alerts', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/performance');

      // Verify error monitoring
      await expect(page.locator('[data-testid="error-monitoring"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="active-alerts"]')).toBeVisible();
    });

    test('should configure performance alerts', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/performance');

      // Configure alert
      await page.click('[data-testid="add-performance-alert"]');
      await page.selectOption('[data-testid="alert-metric"]', 'cpu-usage');
      await page.fill('[data-testid="alert-threshold"]', '80');
      await page.selectOption('[data-testid="alert-severity"]', 'warning');
      await page.fill('[data-testid="alert-email"]', 'admin@example.com');
      await page.click('[data-testid="save-alert"]');

      // Verify alert configuration
      await expect(page.locator('[data-testid="alert-saved"]')).toBeVisible();
      await expect(page.locator('[data-testid="alert-list"]')).toContainText('CPU Usage > 80%');
    });
  });

  test.describe('Bulk Operations', () => {
    test('should perform bulk user operations', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Select multiple users
      await page.check('[data-testid="select-user-1"]');
      await page.check('[data-testid="select-user-2"]');
      await page.check('[data-testid="select-user-3"]');

      // Perform bulk operation
      await page.selectOption('[data-testid="bulk-action"]', 'change-role');
      await page.selectOption('[data-testid="new-role"]', 'agent');
      await page.click('[data-testid="execute-bulk-action"]');

      // Verify bulk operation
      await expect(page.locator('[data-testid="bulk-operation-complete"]')).toBeVisible();
    });

    test('should perform bulk phone number operations', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/phone-numbers');

      // Select multiple numbers
      await page.check('[data-testid="select-number-1"]');
      await page.check('[data-testid="select-number-2"]');

      // Perform bulk operation
      await page.selectOption('[data-testid="bulk-action"]', 'update-configuration');
      await page.fill('[data-testid="bulk-voice-url"]', 'https://example.com/voice');
      await page.click('[data-testid="execute-bulk-action"]');

      // Verify bulk operation
      await expect(page.locator('[data-testid="bulk-operation-complete"]')).toBeVisible();
    });

    test('should handle bulk operation errors', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Simulate bulk operation failure
      await qaHelpers.simulateBulkOperationFailure();

      // Select users and perform operation
      await page.check('[data-testid="select-user-1"]');
      await page.check('[data-testid="select-user-2"]');
      await page.selectOption('[data-testid="bulk-action"]', 'change-role');
      await page.selectOption('[data-testid="new-role"]', 'agent');
      await page.click('[data-testid="execute-bulk-action"]');

      // Verify error handling
      await expect(page.locator('[data-testid="bulk-operation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-details"]')).toBeVisible();
    });
  });

  test.describe('System Health Monitoring', () => {
    test('should display system health status', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/health');

      // Verify health dashboard
      await expect(page.locator('[data-testid="health-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="database-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="twilio-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="quickbase-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="taskrouter-status"]')).toBeVisible();
    });

    test('should display service uptime', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/health');

      // Verify uptime information
      await expect(page.locator('[data-testid="uptime-display"]')).toBeVisible();
      await expect(page.locator('[data-testid="uptime-percentage"]')).toBeVisible();
      await expect(page.locator('[data-testid="last-downtime"]')).toBeVisible();
    });

    test('should handle service outages', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/health');

      // Simulate service outage
      await qaHelpers.simulateServiceOutage('twilio');

      // Verify outage handling
      await expect(page.locator('[data-testid="twilio-status"]')).toHaveClass(/outage/);
      await expect(page.locator('[data-testid="outage-notification"]')).toBeVisible();
    });

    test('should provide system diagnostics', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/health');

      // Run diagnostics
      await page.click('[data-testid="run-diagnostics"]');

      // Verify diagnostics results
      await expect(page.locator('[data-testid="diagnostics-results"]')).toBeVisible();
      const diagnosticTestCount = await page.locator('[data-testid="diagnostic-test"]').count();
      expect(diagnosticTestCount).toBeGreaterThan(0);
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should restrict admin features to admin users only', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/settings');

      // Verify access restrictions
      await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
      await expect(page.locator('[data-testid="admin-panel"]')).not.toBeVisible();
    });

    test('should allow supervisor access to limited admin features', async () => {
      await qaHelpers.loginAs(page, 'supervisor');
      await page.goto('/dashboard/settings/users');

      // Verify limited access
      await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
      await expect(page.locator('[data-testid="system-settings"]')).not.toBeVisible();
    });

    test('should handle permission changes in real-time', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Change user role
      await page.click(`[data-testid="edit-user-${testData.users.agent.id}"]`);
      await page.selectOption('[data-testid="user-role"]', 'supervisor');
      await page.click('[data-testid="save-user"]');

      // Verify real-time permission update
      await expect(page.locator('[data-testid="permission-updated"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle configuration save failures', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/system');

      // Simulate save failure
      await qaHelpers.simulateConfigurationSaveFailure();

      // Try to save settings
      await page.fill('[data-testid="company-name"]', 'Test Company');
      await page.click('[data-testid="save-system-settings"]');

      // Verify error handling
      await expect(page.locator('[data-testid="save-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle external service failures', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/phone-numbers');

      // Simulate Twilio service failure
      await qaHelpers.simulateTwilioServiceFailure();

      // Try to purchase phone number
      await page.click('[data-testid="purchase-number-button"]');

      // Verify error handling
      await expect(page.locator('[data-testid="service-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Twilio service unavailable');
    });

    test('should handle validation errors gracefully', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/settings/users');

      // Try to create user with invalid data
      await page.click('[data-testid="add-user-button"]');
      await page.fill('[data-testid="user-name"]', ''); // Empty name
      await page.fill('[data-testid="user-email"]', 'invalid-email'); // Invalid email
      await page.click('[data-testid="save-user"]');

      // Verify validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
      await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    });
  });
});
