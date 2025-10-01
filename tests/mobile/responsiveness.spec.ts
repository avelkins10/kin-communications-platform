import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('Mobile Responsiveness Testing', () => {
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.describe('Tablet Responsiveness', () => {
    test('should adapt to iPad Pro (1024x1366)', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1366 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test tablet layout
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="tablet-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

      // Test touch interactions
      await page.tap('[data-testid="new-call-button"]');
      await expect(page.locator('[data-testid="call-modal"]')).toBeVisible();
    });

    test('should adapt to iPad (768x1024)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test tablet layout
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="tablet-navigation"]')).toBeVisible();

      // Test responsive tables
      await page.goto('/dashboard/calls');
      await expect(page.locator('[data-testid="calls-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="tablet-table-view"]')).toBeVisible();
    });

    test('should handle tablet orientation changes', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      await expect(page.locator('[data-testid="portrait-layout"]')).toBeVisible();

      // Switch to landscape
      await page.setViewportSize({ width: 1024, height: 768 });
      await expect(page.locator('[data-testid="landscape-layout"]')).toBeVisible();

      // Verify content remains accessible
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    });
  });

  test.describe('Mobile Phone Responsiveness', () => {
    test('should adapt to iPhone 14 Pro Max (430x932)', async ({ page }) => {
      await page.setViewportSize({ width: 430, height: 932 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile layout
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

      // Test mobile navigation
      await page.tap('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });

    test('should adapt to iPhone 14 (390x844)', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile layout
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();

      // Test mobile-specific components
      await expect(page.locator('[data-testid="mobile-call-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-message-button"]')).toBeVisible();
    });

    test('should adapt to Samsung Galaxy S21 (360x800)', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile layout
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();

      // Test compact layout
      await expect(page.locator('[data-testid="compact-dashboard"]')).toBeVisible();
    });

    test('should handle mobile orientation changes', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      await expect(page.locator('[data-testid="portrait-mobile-layout"]')).toBeVisible();

      // Switch to landscape
      await page.setViewportSize({ width: 844, height: 390 });
      await expect(page.locator('[data-testid="landscape-mobile-layout"]')).toBeVisible();

      // Verify content remains accessible
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    });
  });

  test.describe('Touch Interactions', () => {
    test('should handle touch gestures for navigation', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test swipe navigation
      await page.touchscreen.tap(50, 400);
      await page.touchscreen.tap(350, 400);
      await expect(page.locator('[data-testid="swipe-navigation"]')).toBeVisible();

      // Test pinch to zoom
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(200, 300);
      await expect(page.locator('[data-testid="zoom-controls"]')).toBeVisible();
    });

    test('should handle touch interactions for calls', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test touch call initiation
      await page.tap('[data-testid="mobile-call-button"]');
      await expect(page.locator('[data-testid="call-modal"]')).toBeVisible();

      // Test touch call controls
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.tap('[data-testid="answer-call-button"]');

      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-mute-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-hold-button"]')).toBeVisible();
    });

    test('should handle touch interactions for messaging', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');

      // Test touch message composition
      await page.tap('[data-testid="new-message-button"]');
      await expect(page.locator('[data-testid="message-composer"]')).toBeVisible();

      // Test touch keyboard
      await page.tap('[data-testid="message-text-input"]');
      await page.fill('[data-testid="message-text-input"]', 'Test message');
      await page.tap('[data-testid="send-message-button"]');

      await expect(page.locator('[data-testid="message-sent-indicator"]')).toBeVisible();
    });

    test('should handle touch interactions for voicemail', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/voicemails');

      // Test touch voicemail playback
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail');
      await page.tap('[data-testid="voicemail-item"]');

      await expect(page.locator('[data-testid="voicemail-player"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-play-button"]')).toBeVisible();
    });
  });

  test.describe('Mobile-Specific Features', () => {
    test('should display mobile-optimized navigation', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile navigation
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

      // Test mobile menu
      await page.tap('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-menu-item-calls"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-menu-item-messages"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-menu-item-voicemails"]')).toBeVisible();
    });

    test('should display mobile-optimized tables', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/calls');

      // Test mobile table view
      await expect(page.locator('[data-testid="mobile-calls-list"]')).toBeVisible();
      const mobileCallItemCount = await page.locator('[data-testid="mobile-call-item"]').count();
      expect(mobileCallItemCount).toBeGreaterThan(0);

      // Test mobile table interactions
      await page.tap('[data-testid="mobile-call-item"]');
      await expect(page.locator('[data-testid="mobile-call-details"]')).toBeVisible();
    });

    test('should display mobile-optimized forms', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/contacts');

      // Test mobile form
      await page.tap('[data-testid="add-contact-button"]');
      await expect(page.locator('[data-testid="mobile-contact-form"]')).toBeVisible();

      // Test mobile form inputs
      await page.tap('[data-testid="contact-name-input"]');
      await page.fill('[data-testid="contact-name-input"]', 'Test Contact');
      await page.tap('[data-testid="contact-phone-input"]');
      await page.fill('[data-testid="contact-phone-input"]', '+15551234567');

      // Test mobile form submission
      await page.tap('[data-testid="save-contact-button"]');
      await expect(page.locator('[data-testid="contact-saved"]')).toBeVisible();
    });

    test('should display mobile-optimized modals', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile modal
      await page.tap('[data-testid="mobile-call-button"]');
      await expect(page.locator('[data-testid="mobile-call-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-modal-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-modal-content"]')).toBeVisible();

      // Test mobile modal close
      await page.tap('[data-testid="mobile-modal-close"]');
      await expect(page.locator('[data-testid="mobile-call-modal"]')).not.toBeVisible();
    });
  });

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      
      const startTime = Date.now();
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');
      const loadTime = Date.now() - startTime;

      // Verify mobile load time
      expect(loadTime).toBeLessThan(3000);

      // Verify content is visible
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    });

    test('should handle mobile network conditions', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');

      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 1000);
      });

      await page.goto('/dashboard');

      // Verify loading states
      await expect(page.locator('[data-testid="mobile-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    });

    test('should optimize images for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test image optimization
      const images = await page.locator('img').all();
      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src) {
          // Verify mobile-optimized images
          expect(src).toMatch(/mobile|responsive|optimized/);
        }
      }
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should support mobile screen readers', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test ARIA labels
      await expect(page.locator('[data-testid="mobile-call-button"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="mobile-message-button"]')).toHaveAttribute('aria-label');

      // Test focus management
      await page.tap('[data-testid="mobile-call-button"]');
      await expect(page.locator('[data-testid="call-modal"]')).toBeFocused();
    });

    test('should support mobile keyboard navigation', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="mobile-call-button"]')).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="mobile-message-button"]')).toBeFocused();
    });

    test('should support mobile voice commands', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test voice command support
      await expect(page.locator('[data-testid="voice-command-button"]')).toBeVisible();
      await page.tap('[data-testid="voice-command-button"]');
      await expect(page.locator('[data-testid="voice-command-listener"]')).toBeVisible();
    });
  });

  test.describe('Mobile Error Handling', () => {
    test('should handle mobile-specific errors gracefully', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate mobile error
      await qaHelpers.simulateMobileError();

      // Verify error handling
      await expect(page.locator('[data-testid="mobile-error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-retry-button"]')).toBeVisible();
    });

    test('should handle mobile network failures', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate network failure
      await page.context().setOffline(true);

      // Verify offline handling
      await expect(page.locator('[data-testid="mobile-offline-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-offline-message"]')).toBeVisible();

      // Restore network
      await page.context().setOffline(false);
      await expect(page.locator('[data-testid="mobile-offline-indicator"]')).not.toBeVisible();
    });

    test('should handle mobile storage limitations', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate storage limitation
      await qaHelpers.simulateStorageLimitation();

      // Verify storage handling
      await expect(page.locator('[data-testid="mobile-storage-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="mobile-cleanup-button"]')).toBeVisible();
    });
  });

  test.describe('Mobile Browser Compatibility', () => {
    test('should work in mobile Chrome', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile Chrome features
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

      // Test mobile Chrome permissions
      await page.context().grantPermissions(['microphone', 'camera']);
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.tap('[data-testid="answer-call-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
    });

    test('should work in mobile Safari', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile Safari features
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

      // Test mobile Safari specific features
      await expect(page.locator('[data-testid="mobile-safari-features"]')).toBeVisible();
    });

    test('should work in mobile Firefox', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile Firefox features
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

      // Test mobile Firefox specific features
      await expect(page.locator('[data-testid="mobile-firefox-features"]')).toBeVisible();
    });
  });

  test.describe('Mobile User Experience', () => {
    test('should provide intuitive mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile navigation flow
      await page.tap('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      await page.tap('[data-testid="mobile-menu-item-calls"]');
      await expect(page.locator('[data-testid="calls-page"]')).toBeVisible();

      await page.tap('[data-testid="mobile-menu-button"]');
      await page.tap('[data-testid="mobile-menu-item-messages"]');
      await expect(page.locator('[data-testid="messages-page"]')).toBeVisible();
    });

    test('should provide efficient mobile workflows', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test efficient call workflow
      await page.tap('[data-testid="mobile-call-button"]');
      await page.fill('[data-testid="phone-input"]', testData.contacts.customer.phone);
      await page.tap('[data-testid="call-button"]');

      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();

      // Test efficient message workflow
      await page.tap('[data-testid="mobile-message-button"]');
      await page.fill('[data-testid="message-input"]', 'Test message');
      await page.tap('[data-testid="send-button"]');

      await expect(page.locator('[data-testid="message-sent"]')).toBeVisible();
    });

    test('should provide mobile-optimized feedback', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile feedback
      await page.tap('[data-testid="mobile-call-button"]');
      await expect(page.locator('[data-testid="mobile-haptic-feedback"]')).toBeVisible();

      // Test mobile notifications
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test voicemail');
      await expect(page.locator('[data-testid="mobile-notification"]')).toBeVisible();
    });
  });
});
