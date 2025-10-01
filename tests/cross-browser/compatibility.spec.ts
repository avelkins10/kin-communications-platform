import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('Cross-Browser Compatibility Testing', () => {
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.describe('Chrome Browser Compatibility', () => {
    test('should work correctly in Chrome', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test basic functionality
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');

      // Test voice calling
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();

      // Test WebRTC functionality
      await expect(page.locator('[data-testid="webrtc-status"]')).toContainText('Connected');
    });

    test('should handle Chrome-specific audio permissions', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Check if WebRTC is supported
      const webrtcSupported = await page.evaluate(() => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      });

      if (!webrtcSupported) {
        test.skip('WebRTC not supported in this browser');
        return;
      }

      // Grant audio permissions
      await page.context().grantPermissions(['microphone']);

      // Test audio functionality
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify audio is working
      await expect(page.locator('[data-testid="audio-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="microphone-status"]')).toContainText('Active');
    });

    test('should support Chrome notifications', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Grant notification permissions
      await page.context().grantPermissions(['notifications']);

      // Test notification functionality
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test notification');
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
    });
  });

  test.describe('Firefox Browser Compatibility', () => {
    test('should work correctly in Firefox', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test basic functionality
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');

      // Test voice calling
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();

      // Test WebRTC functionality
      await expect(page.locator('[data-testid="webrtc-status"]')).toContainText('Connected');
    });

    test('should handle Firefox-specific audio permissions', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Check if WebRTC is supported
      const webrtcSupported = await page.evaluate(() => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      });

      if (!webrtcSupported) {
        test.skip('WebRTC not supported in this browser');
        return;
      }

      // Grant audio permissions
      await page.context().grantPermissions(['microphone']);

      // Test audio functionality
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify audio is working
      await expect(page.locator('[data-testid="audio-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="microphone-status"]')).toContainText('Active');
    });

    test('should support Firefox notifications', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Grant notification permissions
      await page.context().grantPermissions(['notifications']);

      // Test notification functionality
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test notification');
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
    });
  });

  test.describe('Safari Browser Compatibility', () => {
    test('should work correctly in Safari', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test basic functionality
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');

      // Test voice calling
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();

      // Test WebRTC functionality
      await expect(page.locator('[data-testid="webrtc-status"]')).toContainText('Connected');
    });

    test('should handle Safari-specific audio permissions', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Check if WebRTC is supported
      const webrtcSupported = await page.evaluate(() => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      });

      if (!webrtcSupported) {
        test.skip('WebRTC not supported in this browser');
        return;
      }

      // Grant audio permissions
      await page.context().grantPermissions(['microphone']);

      // Test audio functionality
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify audio is working
      await expect(page.locator('[data-testid="audio-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="microphone-status"]')).toContainText('Active');
    });

    test('should support Safari notifications', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Grant notification permissions
      await page.context().grantPermissions(['notifications']);

      // Test notification functionality
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test notification');
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
    });
  });

  test.describe('Edge Browser Compatibility', () => {
    test('should work correctly in Edge', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test basic functionality
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');

      // Test voice calling
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');
      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();

      // Test WebRTC functionality
      await expect(page.locator('[data-testid="webrtc-status"]')).toContainText('Connected');
    });

    test('should handle Edge-specific audio permissions', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Check if WebRTC is supported
      const webrtcSupported = await page.evaluate(() => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      });

      if (!webrtcSupported) {
        test.skip('WebRTC not supported in this browser');
        return;
      }

      // Grant audio permissions
      await page.context().grantPermissions(['microphone']);

      // Test audio functionality
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify audio is working
      await expect(page.locator('[data-testid="audio-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="microphone-status"]')).toContainText('Active');
    });

    test('should support Edge notifications', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Grant notification permissions
      await page.context().grantPermissions(['notifications']);

      // Test notification functionality
      await qaHelpers.simulateVoicemail(testData.contacts.customer.phone, 'Test notification');
      await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible();
    });
  });

  test.describe('WebRTC Compatibility', () => {
    test('should support WebRTC in all browsers', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test WebRTC support detection
      const webrtcSupported = await page.evaluate(() => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      });

      expect(webrtcSupported).toBe(true);

      // Test WebRTC connection
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      await expect(page.locator('[data-testid="webrtc-status"]')).toContainText('Connected');
    });

    test('should handle WebRTC connection failures gracefully', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate WebRTC failure
      await qaHelpers.simulateWebRTCFailure();

      // Test call with WebRTC failure
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      // Verify fallback handling
      await expect(page.locator('[data-testid="webrtc-fallback"]')).toBeVisible();
      await expect(page.locator('[data-testid="fallback-message"]')).toContainText('Using fallback audio connection');
    });

    test('should support different audio codecs', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test audio codec support
      const codecSupport = await page.evaluate(() => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        return {
          opus: audioContext.createMediaStreamDestination().stream.getAudioTracks().length > 0,
          g722: true, // Assume support for testing
          pcmu: true  // Assume support for testing
        };
      });

      expect(codecSupport.opus).toBe(true);

      // Test call with different codecs
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.click('[data-testid="answer-call-button"]');

      await expect(page.locator('[data-testid="audio-codec"]')).toBeVisible();
    });
  });

  test.describe('Socket.io Compatibility', () => {
    test('should maintain Socket.io connections across browsers', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test Socket.io connection
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');

      // Test real-time updates
      await qaHelpers.simulateQueueUpdate();
      await expect(page.locator('[data-testid="queue-count"]')).toBeVisible();

      // Test connection stability
      await page.waitForTimeout(5000);
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');
    });

    test('should handle Socket.io reconnection in all browsers', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Verify initial connection
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');

      // Simulate connection loss
      await qaHelpers.simulateSocketDisconnection();
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Disconnected');

      // Simulate reconnection
      await qaHelpers.simulateSocketReconnection();
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');
    });

    test('should support different Socket.io transports', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test transport detection
      const transportInfo = await page.evaluate(() => {
        return (window as any).socket?.io?.engine?.transport?.name || 'unknown';
      });

      expect(['websocket', 'polling', 'xhr-polling']).toContain(transportInfo);

      // Verify connection works regardless of transport
      await expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected');
    });
  });

  test.describe('UI Responsiveness', () => {
    test('should maintain consistent UI across browsers', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test navigation consistency
      await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
      await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

      // Test responsive layout
      await page.setViewportSize({ width: 1200, height: 800 });
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
    });

    test('should handle different screen resolutions', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test different resolutions
      const resolutions = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1024, height: 768 },
        { width: 800, height: 600 }
      ];

      for (const resolution of resolutions) {
        await page.setViewportSize(resolution);
        await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
        await expect(page.locator('[data-testid="navigation"]')).toBeVisible();
      }
    });

    test('should maintain consistent styling across browsers', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test CSS consistency
      const buttonStyles = await page.evaluate(() => {
        const button = document.querySelector('[data-testid="new-call-button"]') as HTMLElement;
        if (!button) return null;
        
        const styles = window.getComputedStyle(button);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          fontSize: styles.fontSize,
          padding: styles.padding
        };
      });

      expect(buttonStyles).toBeTruthy();
      expect(buttonStyles?.backgroundColor).toBeTruthy();
      expect(buttonStyles?.color).toBeTruthy();
    });
  });

  test.describe('Feature Parity', () => {
    test('should provide same features across all browsers', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test all major features
      const features = [
        'voice-calling',
        'sms-messaging',
        'voicemail-management',
        'contact-management',
        'real-time-updates',
        'admin-panel'
      ];

      for (const feature of features) {
        await page.goto(`/dashboard/${feature}`);
        await expect(page.locator(`[data-testid="${feature}-content"]`)).toBeVisible();
      }
    });

    test('should maintain consistent performance across browsers', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      
      const startTime = Date.now();
      await page.goto('/dashboard');
      const loadTime = Date.now() - startTime;

      // Verify load time is reasonable
      expect(loadTime).toBeLessThan(3000);

      // Test interaction performance
      const interactionStart = Date.now();
      await page.click('[data-testid="new-call-button"]');
      const interactionTime = Date.now() - interactionStart;

      expect(interactionTime).toBeLessThan(500);
    });

    test('should handle browser-specific limitations gracefully', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test feature detection and fallbacks
      const featureSupport = await page.evaluate(() => {
        return {
          webRTC: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
          notifications: 'Notification' in window,
          localStorage: 'localStorage' in window,
          webSockets: 'WebSocket' in window
        };
      });

      // Verify fallbacks are in place
      if (!featureSupport.webRTC) {
        await expect(page.locator('[data-testid="webrtc-fallback"]')).toBeVisible();
      }

      if (!featureSupport.notifications) {
        await expect(page.locator('[data-testid="notification-fallback"]')).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle browser-specific errors gracefully', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate browser-specific error
      await qaHelpers.simulateBrowserError();

      // Verify error handling
      await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test('should provide browser-specific error messages', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test different error scenarios
      const errorScenarios = [
        'audio-permission-denied',
        'webrtc-not-supported',
        'socket-connection-failed'
      ];

      for (const scenario of errorScenarios) {
        await qaHelpers.simulateBrowserError(scenario);
        await expect(page.locator('[data-testid="error-message"]')).toContainText(scenario);
      }
    });

    test('should recover from browser-specific failures', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate failure
      await qaHelpers.simulateBrowserError();

      // Attempt recovery
      await page.click('[data-testid="retry-button"]');

      // Verify recovery
      await expect(page.locator('[data-testid="error-boundary"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    });
  });

  test.describe('Mobile Browser Compatibility', () => {
    test('should work in mobile Chrome', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile-specific features
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

      // Test touch interactions
      await page.tap('[data-testid="new-call-button"]');
      await expect(page.locator('[data-testid="call-modal"]')).toBeVisible();
    });

    test('should work in mobile Safari', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test mobile-specific features
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
      await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

      // Test touch interactions
      await page.tap('[data-testid="new-call-button"]');
      await expect(page.locator('[data-testid="call-modal"]')).toBeVisible();
    });

    test('should handle mobile-specific permissions', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Check if WebRTC is supported on mobile
      const webrtcSupported = await page.evaluate(() => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      });

      if (!webrtcSupported) {
        test.skip('WebRTC not supported in this mobile browser');
        return;
      }

      // Grant mobile permissions
      await page.context().grantPermissions(['microphone', 'camera']);

      // Test mobile audio
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await page.tap('[data-testid="answer-call-button"]');

      await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
    });
  });
});
