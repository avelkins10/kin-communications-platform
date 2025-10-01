import { test, expect } from '@playwright/test'

test.describe('Voicemail Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to voicemail page
    await page.goto('/dashboard/queue')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test('should display voicemail queue', async ({ page }) => {
    // Check if voicemail queue is visible
    await expect(page.locator('[data-testid="voicemail-queue"]')).toBeVisible()
    
    // Check if voicemail items are displayed
    const voicemailItemCount = await page.locator('[data-testid="voicemail-item"]').count();
    expect(voicemailItemCount).toBeGreaterThan(0);
  })

  test('should display voicemail details', async ({ page }) => {
    // Click on first voicemail item
    await page.locator('[data-testid="voicemail-item"]').first().click()
    
    // Check if voicemail details are displayed
    await expect(page.locator('[data-testid="voicemail-details"]')).toBeVisible()
    
    // Check if caller information is displayed
    await expect(page.locator('[data-testid="caller-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="caller-phone"]')).toBeVisible()
    await expect(page.locator('[data-testid="call-time"]')).toBeVisible()
  })

  test('should play voicemail audio', async ({ page }) => {
    // Click on first voicemail item
    await page.locator('[data-testid="voicemail-item"]').first().click()
    
    // Click play button
    await page.locator('[data-testid="play-button"]').click()
    
    // Check if audio player is visible and playing
    await expect(page.locator('[data-testid="audio-player"]')).toBeVisible()
    await expect(page.locator('[data-testid="play-button"]')).toHaveAttribute('data-playing', 'true')
  })

  test('should pause voicemail audio', async ({ page }) => {
    // Click on first voicemail item
    await page.locator('[data-testid="voicemail-item"]').first().click()
    
    // Click play button
    await page.locator('[data-testid="play-button"]').click()
    
    // Wait for audio to start playing
    await page.waitForTimeout(1000)
    
    // Click pause button
    await page.locator('[data-testid="pause-button"]').click()
    
    // Check if audio is paused
    await expect(page.locator('[data-testid="play-button"]')).toHaveAttribute('data-playing', 'false')
  })

  test('should display voicemail transcription', async ({ page }) => {
    // Click on first voicemail item
    await page.locator('[data-testid="voicemail-item"]').first().click()
    
    // Check if transcription is displayed
    await expect(page.locator('[data-testid="transcription"]')).toBeVisible()
    
    // Check if transcription text is not empty
    const transcriptionText = await page.locator('[data-testid="transcription"]').textContent()
    expect(transcriptionText).toBeTruthy()
  })

  test('should assign voicemail to user', async ({ page }) => {
    // Click on first voicemail item
    await page.locator('[data-testid="voicemail-item"]').first().click()
    
    // Click assign button
    await page.locator('[data-testid="assign-button"]').click()
    
    // Select user from dropdown
    await page.locator('[data-testid="user-select"]').click()
    await page.locator('[data-testid="user-option"]').first().click()
    
    // Click confirm assignment
    await page.locator('[data-testid="confirm-assignment"]').click()
    
    // Check if assignment is successful
    await expect(page.locator('[data-testid="assignment-success"]')).toBeVisible()
  })

  test('should mark voicemail as completed', async ({ page }) => {
    // Click on first voicemail item
    await page.locator('[data-testid="voicemail-item"]').first().click()
    
    // Click complete button
    await page.locator('[data-testid="complete-button"]').click()
    
    // Confirm completion
    await page.locator('[data-testid="confirm-completion"]').click()
    
    // Check if voicemail is marked as completed
    await expect(page.locator('[data-testid="voicemail-item"]').first()).toHaveAttribute('data-status', 'completed')
  })

  test('should initiate callback from voicemail', async ({ page }) => {
    // Click on first voicemail item
    await page.locator('[data-testid="voicemail-item"]').first().click()
    
    // Click callback button
    await page.locator('[data-testid="callback-button"]').click()
    
    // Check if callback modal is displayed
    await expect(page.locator('[data-testid="callback-modal"]')).toBeVisible()
    
    // Click initiate callback
    await page.locator('[data-testid="initiate-callback"]').click()
    
    // Check if callback is initiated
    await expect(page.locator('[data-testid="callback-status"]')).toContainText('Calling')
  })

  test('should filter voicemails by status', async ({ page }) => {
    // Click on status filter
    await page.locator('[data-testid="status-filter"]').click()
    
    // Select "New" status
    await page.locator('[data-testid="status-option-new"]').click()
    
    // Check if only new voicemails are displayed
    const voicemailItems = page.locator('[data-testid="voicemail-item"]')
    const count = await voicemailItems.count()
    
    for (let i = 0; i < count; i++) {
      await expect(voicemailItems.nth(i)).toHaveAttribute('data-status', 'new')
    }
  })

  test('should filter voicemails by date range', async ({ page }) => {
    // Click on date filter
    await page.locator('[data-testid="date-filter"]').click()
    
    // Select "Last 7 days"
    await page.locator('[data-testid="date-option-7days"]').click()
    
    // Check if voicemails are filtered by date
    const voicemailItemCount = await page.locator('[data-testid="voicemail-item"]').count();
    expect(voicemailItemCount).toBeGreaterThan(0);
  })

  test('should search voicemails by caller name', async ({ page }) => {
    // Type in search box
    await page.locator('[data-testid="search-input"]').fill('John')
    
    // Press Enter
    await page.keyboard.press('Enter')
    
    // Check if search results are displayed
    const voicemailItemCount = await page.locator('[data-testid="voicemail-item"]').count();
    expect(voicemailItemCount).toBeGreaterThan(0);
    
    // Check if search results contain "John"
    const firstItem = page.locator('[data-testid="voicemail-item"]').first()
    await expect(firstItem.locator('[data-testid="caller-name"]')).toContainText('John')
  })

  test('should perform bulk actions on voicemails', async ({ page }) => {
    // Select multiple voicemails
    await page.locator('[data-testid="voicemail-checkbox"]').first().check()
    await page.locator('[data-testid="voicemail-checkbox"]').nth(1).check()
    
    // Click bulk actions dropdown
    await page.locator('[data-testid="bulk-actions"]').click()
    
    // Select "Mark as Completed"
    await page.locator('[data-testid="bulk-complete"]').click()
    
    // Confirm bulk action
    await page.locator('[data-testid="confirm-bulk-action"]').click()
    
    // Check if selected voicemails are marked as completed
    await expect(page.locator('[data-testid="voicemail-item"]').first()).toHaveAttribute('data-status', 'completed')
    await expect(page.locator('[data-testid="voicemail-item"]').nth(1)).toHaveAttribute('data-status', 'completed')
  })

  test('should display voicemail statistics', async ({ page }) => {
    // Check if statistics are displayed
    await expect(page.locator('[data-testid="voicemail-stats"]')).toBeVisible()
    
    // Check if total count is displayed
    await expect(page.locator('[data-testid="total-count"]')).toBeVisible()
    
    // Check if new count is displayed
    await expect(page.locator('[data-testid="new-count"]')).toBeVisible()
    
    // Check if completed count is displayed
    await expect(page.locator('[data-testid="completed-count"]')).toBeVisible()
  })

  test('should handle real-time voicemail updates', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle')
    
    // Get initial count
    const initialCount = await page.locator('[data-testid="voicemail-item"]').count()
    
    // Simulate new voicemail (this would normally come from Socket.io)
    await page.evaluate(() => {
      // Simulate Socket.io event
      window.dispatchEvent(new CustomEvent('voicemail_received', {
        detail: {
          id: 'new-voicemail-id',
          callerName: 'New Caller',
          callerPhone: '+15551234567',
          callTime: new Date().toISOString(),
          status: 'new'
        }
      }))
    })
    
    // Check if new voicemail appears
    await expect(page.locator('[data-testid="voicemail-item"]')).toHaveCount(initialCount + 1)
  })

  test('should handle voicemail playback errors', async ({ page }) => {
    // Click on first voicemail item
    await page.locator('[data-testid="voicemail-item"]').first().click()
    
    // Mock audio error
    await page.evaluate(() => {
      const audio = document.querySelector('[data-testid="audio-player"]') as HTMLAudioElement
      if (audio) {
        audio.dispatchEvent(new Event('error'))
      }
    })
    
    // Check if error message is displayed
    await expect(page.locator('[data-testid="audio-error"]')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/voicemails/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Network error' })
      })
    })
    
    // Refresh page
    await page.reload()
    
    // Check if error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if voicemail queue is still visible
    await expect(page.locator('[data-testid="voicemail-queue"]')).toBeVisible()
    
    // Check if mobile-specific layout is applied
    await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on first voicemail item
    await page.locator('[data-testid="voicemail-item"]').first().focus()
    
    // Use arrow keys to navigate
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    
    // Check if focus is on third item
    await expect(page.locator('[data-testid="voicemail-item"]').nth(2)).toBeFocused()
    
    // Press Enter to select
    await page.keyboard.press('Enter')
    
    // Check if voicemail details are displayed
    await expect(page.locator('[data-testid="voicemail-details"]')).toBeVisible()
  })

  test('should handle accessibility requirements', async ({ page }) => {
    // Check if voicemail items have proper ARIA labels
    await expect(page.locator('[data-testid="voicemail-item"]').first()).toHaveAttribute('aria-label')
    
    // Check if buttons have proper ARIA labels
    await expect(page.locator('[data-testid="play-button"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="assign-button"]')).toHaveAttribute('aria-label')
    
    // Check if form elements have proper labels
    await expect(page.locator('[data-testid="search-input"]')).toHaveAttribute('aria-label')
    await expect(page.locator('[data-testid="status-filter"]')).toHaveAttribute('aria-label')
  })
})
