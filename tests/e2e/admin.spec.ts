import { test, expect } from '@playwright/test'

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to admin settings page
    await page.goto('/dashboard/settings')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display admin panel navigation', async ({ page }) => {
    // Check if admin navigation is visible
    await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible()
    
    // Check if all admin sections are present
    await expect(page.locator('[data-testid="nav-users"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-phone-numbers"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-routing-rules"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-business-hours"]')).toBeVisible()
    await expect(page.locator('[data-testid="nav-system-settings"]')).toBeVisible()
  })

  test('should manage users', async ({ page }) => {
    // Click on Users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Check if users table is displayed
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible()
    
    // Check if add user button is present
    await expect(page.locator('[data-testid="add-user-button"]')).toBeVisible()
  })

  test('should add new user', async ({ page }) => {
    // Navigate to users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Click add user button
    await page.locator('[data-testid="add-user-button"]').click()
    
    // Fill user form
    await page.locator('[data-testid="user-name-input"]').fill('John Doe')
    await page.locator('[data-testid="user-email-input"]').fill('john.doe@example.com')
    await page.locator('[data-testid="user-role-select"]').selectOption('USER')
    await page.locator('[data-testid="user-department-input"]').fill('Sales')
    
    // Submit form
    await page.locator('[data-testid="save-user-button"]').click()
    
    // Check if user is added
    await expect(page.locator('[data-testid="user-success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="users-table"]')).toContainText('John Doe')
  })

  test('should edit existing user', async ({ page }) => {
    // Navigate to users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Click edit button on first user
    await page.locator('[data-testid="edit-user-button"]').first().click()
    
    // Update user information
    await page.locator('[data-testid="user-name-input"]').fill('Jane Smith')
    await page.locator('[data-testid="user-role-select"]').selectOption('ADMIN')
    
    // Save changes
    await page.locator('[data-testid="save-user-button"]').click()
    
    // Check if changes are saved
    await expect(page.locator('[data-testid="user-success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="users-table"]')).toContainText('Jane Smith')
  })

  test('should delete user', async ({ page }) => {
    // Navigate to users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Click delete button on first user
    await page.locator('[data-testid="delete-user-button"]').first().click()
    
    // Confirm deletion
    await page.locator('[data-testid="confirm-delete-button"]').click()
    
    // Check if user is deleted
    await expect(page.locator('[data-testid="user-success-message"]')).toBeVisible()
  })

  test('should manage phone numbers', async ({ page }) => {
    // Click on Phone Numbers section
    await page.locator('[data-testid="nav-phone-numbers"]').click()
    
    // Check if phone numbers table is displayed
    await expect(page.locator('[data-testid="phone-numbers-table"]')).toBeVisible()
    
    // Check if add phone number button is present
    await expect(page.locator('[data-testid="add-phone-button"]')).toBeVisible()
  })

  test('should add new phone number', async ({ page }) => {
    // Navigate to phone numbers section
    await page.locator('[data-testid="nav-phone-numbers"]').click()
    
    // Click add phone number button
    await page.locator('[data-testid="add-phone-button"]').click()
    
    // Fill phone number form
    await page.locator('[data-testid="phone-number-input"]').fill('+15551234567')
    await page.locator('[data-testid="phone-label-input"]').fill('Main Office')
    await page.locator('[data-testid="phone-type-select"]').selectOption('VOICE')
    
    // Submit form
    await page.locator('[data-testid="save-phone-button"]').click()
    
    // Check if phone number is added
    await expect(page.locator('[data-testid="phone-success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="phone-numbers-table"]')).toContainText('+15551234567')
  })

  test('should configure routing rules', async ({ page }) => {
    // Click on Routing Rules section
    await page.locator('[data-testid="nav-routing-rules"]').click()
    
    // Check if routing rules builder is displayed
    await expect(page.locator('[data-testid="routing-rules-builder"]')).toBeVisible()
    
    // Check if add rule button is present
    await expect(page.locator('[data-testid="add-rule-button"]')).toBeVisible()
  })

  test('should create routing rule', async ({ page }) => {
    // Navigate to routing rules section
    await page.locator('[data-testid="nav-routing-rules"]').click()
    
    // Click add rule button
    await page.locator('[data-testid="add-rule-button"]').click()
    
    // Configure rule conditions
    await page.locator('[data-testid="rule-condition-select"]').selectOption('TIME_OF_DAY')
    await page.locator('[data-testid="rule-condition-value"]').fill('09:00-17:00')
    
    // Configure rule actions
    await page.locator('[data-testid="rule-action-select"]').selectOption('ROUTE_TO_USER')
    await page.locator('[data-testid="rule-action-value"]').selectOption('user-1')
    
    // Set rule priority
    await page.locator('[data-testid="rule-priority-input"]').fill('1')
    
    // Save rule
    await page.locator('[data-testid="save-rule-button"]').click()
    
    // Check if rule is created
    await expect(page.locator('[data-testid="rule-success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="routing-rules-list"]')).toContainText('TIME_OF_DAY')
  })

  test('should edit routing rule', async ({ page }) => {
    // Navigate to routing rules section
    await page.locator('[data-testid="nav-routing-rules"]').click()
    
    // Click edit button on first rule
    await page.locator('[data-testid="edit-rule-button"]').first().click()
    
    // Update rule
    await page.locator('[data-testid="rule-priority-input"]').fill('2')
    
    // Save changes
    await page.locator('[data-testid="save-rule-button"]').click()
    
    // Check if changes are saved
    await expect(page.locator('[data-testid="rule-success-message"]')).toBeVisible()
  })

  test('should delete routing rule', async ({ page }) => {
    // Navigate to routing rules section
    await page.locator('[data-testid="nav-routing-rules"]').click()
    
    // Click delete button on first rule
    await page.locator('[data-testid="delete-rule-button"]').first().click()
    
    // Confirm deletion
    await page.locator('[data-testid="confirm-delete-button"]').click()
    
    // Check if rule is deleted
    await expect(page.locator('[data-testid="rule-success-message"]')).toBeVisible()
  })

  test('should configure business hours', async ({ page }) => {
    // Click on Business Hours section
    await page.locator('[data-testid="nav-business-hours"]').click()
    
    // Check if business hours form is displayed
    await expect(page.locator('[data-testid="business-hours-form"]')).toBeVisible()
    
    // Check if all days are present
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    for (const day of days) {
      await expect(page.locator(`[data-testid="business-hours-${day.toLowerCase()}"]`)).toBeVisible()
    }
  })

  test('should set business hours for weekdays', async ({ page }) => {
    // Navigate to business hours section
    await page.locator('[data-testid="nav-business-hours"]').click()
    
    // Set Monday hours
    await page.locator('[data-testid="monday-start-time"]').fill('09:00')
    await page.locator('[data-testid="monday-end-time"]').fill('17:00')
    await page.locator('[data-testid="monday-enabled"]').check()
    
    // Set Tuesday hours
    await page.locator('[data-testid="tuesday-start-time"]').fill('09:00')
    await page.locator('[data-testid="tuesday-end-time"]').fill('17:00')
    await page.locator('[data-testid="tuesday-enabled"]').check()
    
    // Save business hours
    await page.locator('[data-testid="save-business-hours-button"]').click()
    
    // Check if business hours are saved
    await expect(page.locator('[data-testid="business-hours-success-message"]')).toBeVisible()
  })

  test('should set after-hours routing', async ({ page }) => {
    // Navigate to business hours section
    await page.locator('[data-testid="nav-business-hours"]').click()
    
    // Configure after-hours routing
    await page.locator('[data-testid="after-hours-action-select"]').selectOption('VOICEMAIL')
    await page.locator('[data-testid="after-hours-message-textarea"]').fill('We are currently closed. Please leave a message.')
    
    // Save after-hours settings
    await page.locator('[data-testid="save-after-hours-button"]').click()
    
    // Check if after-hours settings are saved
    await expect(page.locator('[data-testid="after-hours-success-message"]')).toBeVisible()
  })

  test('should configure system settings', async ({ page }) => {
    // Click on System Settings section
    await page.locator('[data-testid="nav-system-settings"]').click()
    
    // Check if system settings form is displayed
    await expect(page.locator('[data-testid="system-settings-form"]')).toBeVisible()
    
    // Check if all setting categories are present
    await expect(page.locator('[data-testid="general-settings"]')).toBeVisible()
    await expect(page.locator('[data-testid="notification-settings"]')).toBeVisible()
    await expect(page.locator('[data-testid="integration-settings"]')).toBeVisible()
  })

  test('should update general settings', async ({ page }) => {
    // Navigate to system settings section
    await page.locator('[data-testid="nav-system-settings"]').click()
    
    // Update general settings
    await page.locator('[data-testid="company-name-input"]').fill('KIN Communications')
    await page.locator('[data-testid="timezone-select"]').selectOption('America/New_York')
    await page.locator('[data-testid="language-select"]').selectOption('en')
    
    // Save general settings
    await page.locator('[data-testid="save-general-settings-button"]').click()
    
    // Check if settings are saved
    await expect(page.locator('[data-testid="general-settings-success-message"]')).toBeVisible()
  })

  test('should configure notification settings', async ({ page }) => {
    // Navigate to system settings section
    await page.locator('[data-testid="nav-system-settings"]').click()
    
    // Configure notification settings
    await page.locator('[data-testid="email-notifications-enabled"]').check()
    await page.locator('[data-testid="sms-notifications-enabled"]').check()
    await page.locator('[data-testid="notification-email-input"]').fill('admin@example.com')
    
    // Save notification settings
    await page.locator('[data-testid="save-notification-settings-button"]').click()
    
    // Check if settings are saved
    await expect(page.locator('[data-testid="notification-settings-success-message"]')).toBeVisible()
  })

  test('should configure integration settings', async ({ page }) => {
    // Navigate to system settings section
    await page.locator('[data-testid="nav-system-settings"]').click()
    
    // Configure Twilio settings
    await page.locator('[data-testid="twilio-account-sid-input"]').fill('AC1234567890abcdef')
    await page.locator('[data-testid="twilio-auth-token-input"]').fill('test-auth-token')
    await page.locator('[data-testid="twilio-webhook-url-input"]').fill('https://example.com/webhook')
    
    // Configure Quickbase settings
    await page.locator('[data-testid="quickbase-realm-input"]').fill('test-realm')
    await page.locator('[data-testid="quickbase-user-token-input"]').fill('test-user-token')
    await page.locator('[data-testid="quickbase-app-id-input"]').fill('test-app-id')
    
    // Save integration settings
    await page.locator('[data-testid="save-integration-settings-button"]').click()
    
    // Check if settings are saved
    await expect(page.locator('[data-testid="integration-settings-success-message"]')).toBeVisible()
  })

  test('should test Twilio connection', async ({ page }) => {
    // Navigate to system settings section
    await page.locator('[data-testid="nav-system-settings"]').click()
    
    // Click test Twilio connection button
    await page.locator('[data-testid="test-twilio-connection-button"]').click()
    
    // Check if connection test is successful
    await expect(page.locator('[data-testid="twilio-connection-success"]')).toBeVisible()
  })

  test('should test Quickbase connection', async ({ page }) => {
    // Navigate to system settings section
    await page.locator('[data-testid="nav-system-settings"]').click()
    
    // Click test Quickbase connection button
    await page.locator('[data-testid="test-quickbase-connection-button"]').click()
    
    // Check if connection test is successful
    await expect(page.locator('[data-testid="quickbase-connection-success"]')).toBeVisible()
  })

  test('should handle form validation errors', async ({ page }) => {
    // Navigate to users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Click add user button
    await page.locator('[data-testid="add-user-button"]').click()
    
    // Try to submit form without required fields
    await page.locator('[data-testid="save-user-button"]').click()
    
    // Check if validation errors are displayed
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/users/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    // Navigate to users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Check if error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test('should handle real-time updates', async ({ page }) => {
    // Navigate to users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Get initial user count
    const initialCount = await page.locator('[data-testid="user-row"]').count()
    
    // Simulate new user added (this would normally come from Socket.io)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('user_added', {
        detail: {
          id: 'new-user-id',
          name: 'New User',
          email: 'new.user@example.com',
          role: 'USER'
        }
      }))
    })
    
    // Check if new user appears
    await expect(page.locator('[data-testid="user-row"]')).toHaveCount(initialCount + 1)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if admin panel is still functional
    await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible()
    
    // Check if mobile-specific layout is applied
    await expect(page.locator('[data-testid="mobile-admin-layout"]')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Navigate to users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Use Tab to navigate through form elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Check if focus is on expected element
    await expect(page.locator('[data-testid="add-user-button"]')).toBeFocused()
  })

  test('should handle accessibility requirements', async ({ page }) => {
    // Check if admin panel has proper ARIA labels
    await expect(page.locator('[data-testid="admin-nav"]')).toHaveAttribute('aria-label')
    
    // Check if form elements have proper labels
    await expect(page.locator('[data-testid="user-name-input"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="user-email-input"]')).toHaveAttribute('aria-label')
    
    // Check if buttons have proper ARIA labels
    await expect(page.locator('[data-testid="add-user-button"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="save-user-button"]')).toHaveAttribute('aria-label')
  })

  test('should handle drag and drop for routing rules', async ({ page }) => {
    // Navigate to routing rules section
    await page.locator('[data-testid="nav-routing-rules"]').click()
    
    // Drag first rule to reorder
    const firstRule = page.locator('[data-testid="routing-rule"]').first()
    const secondRule = page.locator('[data-testid="routing-rule"]').nth(1)
    
    await firstRule.dragTo(secondRule)
    
    // Check if rules are reordered
    await expect(page.locator('[data-testid="routing-rule"]').first()).toHaveAttribute('data-priority', '2')
  })

  test('should export user data', async ({ page }) => {
    // Navigate to users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Click export button
    await page.locator('[data-testid="export-users-button"]').click()
    
    // Check if export is initiated
    await expect(page.locator('[data-testid="export-success-message"]')).toBeVisible()
  })

  test('should import user data', async ({ page }) => {
    // Navigate to users section
    await page.locator('[data-testid="nav-users"]').click()
    
    // Click import button
    await page.locator('[data-testid="import-users-button"]').click()
    
    // Upload CSV file
    await page.locator('[data-testid="import-file-input"]').setInputFiles('tests/fixtures/users.csv')
    
    // Click import button
    await page.locator('[data-testid="confirm-import-button"]').click()
    
    // Check if import is successful
    await expect(page.locator('[data-testid="import-success-message"]')).toBeVisible()
  })
})
