import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('TaskRouter Functionality - Phase 7', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Intelligent Call Routing', () => {
    test('should route calls based on keyword detection', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Configure keyword-based routing rule
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'keyword');
      await page.fill('[data-testid="keyword-input"]', 'emergency');
      await page.selectOption('[data-testid="target-queue"]', 'emergency-queue');
      await page.click('[data-testid="save-rule"]');

      // Test routing with keyword
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone, 'I have an emergency situation');
      
      // Verify routing to emergency queue
      await expect(page.locator('[data-testid="emergency-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="routing-reason"]')).toContainText('Keyword: emergency');
    });

    test('should route calls based on customer type from Quickbase', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Configure customer type routing
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'customer-type');
      await page.selectOption('[data-testid="customer-type"]', 'vip');
      await page.selectOption('[data-testid="target-queue"]', 'vip-queue');
      await page.click('[data-testid="save-rule"]');

      // Test routing for VIP customer
      await qaHelpers.simulateInboundCall(testData.contacts.vipCustomer.phone);
      
      // Verify routing to VIP queue
      await expect(page.locator('[data-testid="vip-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="routing-reason"]')).toContainText('VIP Customer');
    });

    test('should route calls based on time of day', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Configure time-based routing
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'time-based');
      await page.fill('[data-testid="start-time"]', '17:00');
      await page.fill('[data-testid="end-time"]', '08:00');
      await page.selectOption('[data-testid="target-queue"]', 'after-hours-queue');
      await page.click('[data-testid="save-rule"]');

      // Test after-hours routing
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone, { time: '20:00' });
      
      // Verify routing to after-hours queue
      await expect(page.locator('[data-testid="after-hours-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="routing-reason"]')).toContainText('After Hours');
    });

    test('should route calls based on Project Coordinator availability', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Configure PC-based routing
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'project-coordinator');
      await page.selectOption('[data-testid="pc-assignment"]', 'auto-assign');
      await page.click('[data-testid="save-rule"]');

      // Test PC-based routing
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      
      // Verify routing based on PC availability
      await expect(page.locator('[data-testid="pc-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="assigned-pc"]')).toBeVisible();
    });

    test('should handle multiple routing rules with priority', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Configure multiple rules with different priorities
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'keyword');
      await page.fill('[data-testid="keyword-input"]', 'urgent');
      await page.selectOption('[data-testid="target-queue"]', 'urgent-queue');
      await page.fill('[data-testid="rule-priority"]', '1');
      await page.click('[data-testid="save-rule"]');

      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'customer-type');
      await page.selectOption('[data-testid="customer-type"]', 'standard');
      await page.selectOption('[data-testid="target-queue"]', 'standard-queue');
      await page.fill('[data-testid="rule-priority"]', '2');
      await page.click('[data-testid="save-rule"]');

      // Test with urgent keyword (should use higher priority rule)
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone, 'This is urgent');
      
      // Verify higher priority rule applied
      await expect(page.locator('[data-testid="urgent-queue"]')).toBeVisible();
    });
  });

  test.describe('Skills-Based Routing', () => {
    test('should route calls based on agent skills', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Configure skills-based routing
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'skills-based');
      await page.check('[data-testid="skill-technical"]');
      await page.selectOption('[data-testid="target-queue"]', 'technical-queue');
      await page.click('[data-testid="save-rule"]');

      // Test routing for technical call
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone, 'I need technical support');
      
      // Verify routing to technical queue
      await expect(page.locator('[data-testid="technical-queue"]')).toBeVisible();
    });

    test('should assign tasks to agents with matching skills', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/workers');

      // Configure agent skills
      await page.click(`[data-testid="worker-${testData.users.agent.id}"]`);
      await page.check('[data-testid="skill-technical"]');
      await page.check('[data-testid="skill-sales"]');
      await page.click('[data-testid="save-worker-skills"]');

      // Create task requiring technical skills
      await qaHelpers.simulateTaskCreation('technical-support', { requiredSkills: ['technical'] });

      // Verify task assigned to agent with matching skills
      await expect(page.locator('[data-testid="task-assigned"]')).toBeVisible();
      await expect(page.locator('[data-testid="assigned-agent"]')).toContainText(testData.users.agent.name);
    });

    test('should handle no available agents with required skills', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Create task requiring unavailable skills
      await qaHelpers.simulateTaskCreation('specialized-support', { requiredSkills: ['specialized'] });

      // Verify task queued for available agent
      await expect(page.locator('[data-testid="task-queued"]')).toBeVisible();
      await expect(page.locator('[data-testid="queue-reason"]')).toContainText('No agents with required skills available');
    });
  });

  test.describe('Worker Management', () => {
    test('should display worker status and activities', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Verify worker interface
      await expect(page.locator('[data-testid="worker-interface"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="current-activity"]')).toBeVisible();
      await expect(page.locator('[data-testid="task-queue"]')).toBeVisible();
    });

    test('should change worker status', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Change status to available
      await page.click('[data-testid="status-selector"]');
      await page.click('[data-testid="status-available"]');

      // Verify status change
      await expect(page.locator('[data-testid="current-status"]')).toContainText('Available');
      await expect(page.locator('[data-testid="status-indicator"]')).toHaveClass(/available/);
    });

    test('should change worker activity', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Change activity
      await page.click('[data-testid="activity-selector"]');
      await page.click('[data-testid="activity-break"]');

      // Verify activity change
      await expect(page.locator('[data-testid="current-activity"]')).toContainText('Break');
      await expect(page.locator('[data-testid="activity-indicator"]')).toHaveClass(/break/);
    });

    test('should handle worker offline status', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Set worker offline
      await page.click('[data-testid="status-selector"]');
      await page.click('[data-testid="status-offline"]');

      // Verify offline status
      await expect(page.locator('[data-testid="current-status"]')).toContainText('Offline');
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    });

    test('should display worker statistics', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Verify statistics display
      await expect(page.locator('[data-testid="worker-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="tasks-completed"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-handle-time"]')).toBeVisible();
      await expect(page.locator('[data-testid="availability-percentage"]')).toBeVisible();
    });
  });

  test.describe('Task Queue Operations', () => {
    test('should display task queue with pending tasks', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Create pending tasks
      await qaHelpers.simulateTaskCreation('customer-support');
      await qaHelpers.simulateTaskCreation('technical-support');

      // Verify task queue
      await expect(page.locator('[data-testid="task-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="pending-task"]')).toHaveCount(2);
    });

    test('should accept task from queue', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Create task
      await qaHelpers.simulateTaskCreation('customer-support');

      // Accept task
      await page.click('[data-testid="accept-task-button"]');

      // Verify task accepted
      await expect(page.locator('[data-testid="current-task"]')).toBeVisible();
      await expect(page.locator('[data-testid="task-status"]')).toContainText('In Progress');
    });

    test('should reject task from queue', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Create task
      await qaHelpers.simulateTaskCreation('customer-support');

      // Reject task
      await page.click('[data-testid="reject-task-button"]');
      await page.fill('[data-testid="rejection-reason"]', 'Not my area of expertise');
      await page.click('[data-testid="confirm-rejection"]');

      // Verify task rejected
      await expect(page.locator('[data-testid="task-rejected"]')).toBeVisible();
      await expect(page.locator('[data-testid="rejection-reason"]')).toContainText('Not my area of expertise');
    });

    test('should complete task', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Create and accept task
      await qaHelpers.simulateTaskCreation('customer-support');
      await page.click('[data-testid="accept-task-button"]');

      // Complete task
      await page.click('[data-testid="complete-task-button"]');
      await page.fill('[data-testid="completion-notes"]', 'Customer issue resolved');
      await page.click('[data-testid="confirm-completion"]');

      // Verify task completed
      await expect(page.locator('[data-testid="task-completed"]')).toBeVisible();
      await expect(page.locator('[data-testid="completion-notes"]')).toContainText('Customer issue resolved');
    });

    test('should handle task timeout', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Create task with short timeout
      await qaHelpers.simulateTaskCreation('customer-support', { timeout: 5000 });

      // Accept task
      await page.click('[data-testid="accept-task-button"]');

      // Wait for timeout
      await page.waitForTimeout(6000);

      // Verify task timeout
      await expect(page.locator('[data-testid="task-timeout"]')).toBeVisible();
      await expect(page.locator('[data-testid="timeout-notification"]')).toBeVisible();
    });
  });

  test.describe('Routing Rule Configuration', () => {
    test('should create routing rules with visual builder', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/rules');

      // Open visual rule builder
      await page.click('[data-testid="visual-rule-builder"]');
      await expect(page.locator('[data-testid="rule-builder-canvas"]')).toBeVisible();

      // Create rule using drag and drop
      await page.dragAndDrop('[data-testid="condition-keyword"]', '[data-testid="rule-canvas"]');
      await page.dragAndDrop('[data-testid="action-route-queue"]', '[data-testid="rule-canvas"]');

      // Configure rule
      await page.click('[data-testid="keyword-condition"]');
      await page.fill('[data-testid="keyword-value"]', 'billing');
      await page.click('[data-testid="route-action"]');
      await page.selectOption('[data-testid="target-queue"]', 'billing-queue');

      // Save rule
      await page.click('[data-testid="save-rule"]');

      // Verify rule created
      await expect(page.locator('[data-testid="rule-list"]')).toContainText('Keyword: billing');
    });

    test('should edit existing routing rules', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/rules');

      // Create initial rule
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'keyword');
      await page.fill('[data-testid="keyword-input"]', 'support');
      await page.selectOption('[data-testid="target-queue"]', 'support-queue');
      await page.click('[data-testid="save-rule"]');

      // Edit rule
      await page.click('[data-testid="edit-rule-button"]');
      await page.fill('[data-testid="keyword-input"]', 'customer-support');
      await page.click('[data-testid="save-rule"]');

      // Verify rule updated
      await expect(page.locator('[data-testid="rule-list"]')).toContainText('Keyword: customer-support');
    });

    test('should delete routing rules', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/rules');

      // Create rule
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'keyword');
      await page.fill('[data-testid="keyword-input"]', 'test');
      await page.selectOption('[data-testid="target-queue"]', 'test-queue');
      await page.click('[data-testid="save-rule"]');

      // Delete rule
      await page.click('[data-testid="delete-rule-button"]');
      await page.click('[data-testid="confirm-delete"]');

      // Verify rule deleted
      await expect(page.locator('[data-testid="rule-list"]')).not.toContainText('Keyword: test');
    });

    test('should test routing rules', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/rules');

      // Create rule
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'keyword');
      await page.fill('[data-testid="keyword-input"]', 'urgent');
      await page.selectOption('[data-testid="target-queue"]', 'urgent-queue');
      await page.click('[data-testid="save-rule"]');

      // Test rule
      await page.click('[data-testid="test-rule-button"]');
      await page.fill('[data-testid="test-input"]', 'This is urgent');
      await page.click('[data-testid="run-test"]');

      // Verify test results
      await expect(page.locator('[data-testid="test-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="test-result"]')).toContainText('urgent-queue');
    });
  });

  test.describe('Workflow Testing', () => {
    test('should test complete routing workflow', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/workflows');

      // Create workflow
      await page.click('[data-testid="create-workflow"]');
      await page.fill('[data-testid="workflow-name"]', 'Customer Support Workflow');
      
      // Add steps to workflow
      await page.click('[data-testid="add-step"]');
      await page.selectOption('[data-testid="step-type"]', 'condition');
      await page.selectOption('[data-testid="condition-type"]', 'customer-type');
      await page.selectOption('[data-testid="condition-value"]', 'vip');
      
      await page.click('[data-testid="add-step"]');
      await page.selectOption('[data-testid="step-type"]', 'action');
      await page.selectOption('[data-testid="action-type"]', 'route');
      await page.selectOption('[data-testid="target-queue"]', 'vip-queue');
      
      // Save workflow
      await page.click('[data-testid="save-workflow"]');

      // Test workflow
      await page.click('[data-testid="test-workflow"]');
      await page.fill('[data-testid="test-customer-type"]', 'vip');
      await page.click('[data-testid="run-workflow-test"]');

      // Verify workflow test results
      await expect(page.locator('[data-testid="workflow-test-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="workflow-result"]')).toContainText('vip-queue');
    });

    test('should handle workflow errors', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/workflows');

      // Create invalid workflow
      await page.click('[data-testid="create-workflow"]');
      await page.fill('[data-testid="workflow-name"]', 'Invalid Workflow');
      
      // Add invalid step
      await page.click('[data-testid="add-step"]');
      await page.selectOption('[data-testid="step-type"]', 'action');
      // Don't configure action properly
      
      // Try to save workflow
      await page.click('[data-testid="save-workflow"]');

      // Verify error handling
      await expect(page.locator('[data-testid="workflow-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid workflow configuration');
    });
  });

  test.describe('Real-time TaskRouter Events', () => {
    test('should receive real-time task assignments', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Simulate task assignment
      await qaHelpers.simulateTaskAssignment(testData.users.agent.id, 'customer-support');

      // Verify real-time task assignment
      await expect(page.locator('[data-testid="task-assignment-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="assigned-task"]')).toBeVisible();
    });

    test('should receive real-time queue updates', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Simulate queue update
      await qaHelpers.simulateQueueUpdate();

      // Verify real-time queue update
      await expect(page.locator('[data-testid="queue-update-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="queue-count"]')).toBeVisible();
    });

    test('should receive real-time worker status updates', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/workers');

      // Simulate worker status change
      await qaHelpers.simulateWorkerStatusChange(testData.users.agent.id, 'unavailable');

      // Verify real-time status update
      await expect(page.locator('[data-testid="worker-status-update"]')).toBeVisible();
      await expect(page.locator(`[data-testid="worker-${testData.users.agent.id}-status"]`)).toContainText('Unavailable');
    });
  });

  test.describe('Performance Under Load', () => {
    test('should handle multiple concurrent tasks', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Simulate multiple concurrent tasks
      await qaHelpers.simulateConcurrentTasks(10);

      // Verify system handles load
      await expect(page.locator('[data-testid="task-queue"]')).toBeVisible();
      await expect(page.locator('[data-testid="system-performance"]')).toBeVisible();
    });

    test('should maintain routing performance under load', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter');

      // Simulate high call volume
      await qaHelpers.simulateHighCallVolume(50);

      // Verify routing performance
      await expect(page.locator('[data-testid="routing-performance"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-routing-time"]')).toContainText(/\d+ms/);
    });

    test('should handle worker capacity limits', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/workers');

      // Set worker capacity
      await page.click(`[data-testid="worker-${testData.users.agent.id}"]`);
      await page.fill('[data-testid="max-tasks"]', '3');
      await page.click('[data-testid="save-worker-config"]');

      // Simulate tasks exceeding capacity
      await qaHelpers.simulateTasksExceedingCapacity(testData.users.agent.id, 5);

      // Verify capacity handling
      await expect(page.locator('[data-testid="capacity-exceeded"]')).toBeVisible();
      await expect(page.locator('[data-testid="queued-tasks"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle TaskRouter API failures', async () => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/taskrouter/worker');

      // Simulate API failure
      await qaHelpers.simulateTaskRouterAPIFailure();

      // Try to change status
      await page.click('[data-testid="status-selector"]');
      await page.click('[data-testid="status-available"]');

      // Verify error handling
      await expect(page.locator('[data-testid="api-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should handle worker synchronization failures', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/workers');

      // Simulate sync failure
      await qaHelpers.simulateWorkerSyncFailure();

      // Try to update worker
      await page.click(`[data-testid="worker-${testData.users.agent.id}"]`);
      await page.click('[data-testid="update-worker"]');

      // Verify error handling
      await expect(page.locator('[data-testid="sync-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="manual-sync-button"]')).toBeVisible();
    });

    test('should handle routing rule conflicts', async () => {
      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/taskrouter/rules');

      // Create conflicting rules
      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'keyword');
      await page.fill('[data-testid="keyword-input"]', 'support');
      await page.selectOption('[data-testid="target-queue"]', 'queue-1');
      await page.fill('[data-testid="rule-priority"]', '1');
      await page.click('[data-testid="save-rule"]');

      await page.click('[data-testid="add-routing-rule"]');
      await page.selectOption('[data-testid="rule-type"]', 'keyword');
      await page.fill('[data-testid="keyword-input"]', 'support');
      await page.selectOption('[data-testid="target-queue"]', 'queue-2');
      await page.fill('[data-testid="rule-priority"]', '1');
      await page.click('[data-testid="save-rule"]');

      // Verify conflict detection
      await expect(page.locator('[data-testid="rule-conflict"]')).toBeVisible();
      await expect(page.locator('[data-testid="conflict-resolution"]')).toBeVisible();
    });
  });
});

