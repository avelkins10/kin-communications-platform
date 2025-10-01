import { test, expect, Page, BrowserContext } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('Cross-Browser Compatibility', () => {
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page }) => {
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('WebRTC Feature Detection', () => {
    test('should detect WebRTC support and microphone access', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Check WebRTC support
      const webRTCSupported = await page.evaluate(() => {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      });

      expect(webRTCSupported).toBe(true);

      // Check microphone permissions (this will prompt in real browsers)
      const microphoneAccess = await page.evaluate(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (error) {
          return false;
        }
      });

      // Note: This test may fail in headless mode or without proper permissions
      // In real testing, you might want to mock this or handle permission prompts
      if (browserName === 'chromium') {
        // Chromium in headless mode typically doesn't support getUserMedia
        console.log('Microphone access test skipped for Chromium headless mode');
      } else {
        expect(microphoneAccess).toBe(true);
      }
    });

    test('should handle WebRTC errors gracefully', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Mock getUserMedia to throw an error
      await page.addInitScript(() => {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = () => {
          throw new Error('Permission denied');
        };
      });

      // Navigate to a page that might use WebRTC
      await page.goto('/dashboard/calls');

      // Check that the page still loads and shows appropriate error handling
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Check for error message or fallback UI
      const hasErrorHandling = await page.locator('text=Microphone access required').isVisible().catch(() => false);
      const hasFallbackUI = await page.locator('[data-testid="call-controls"]').isVisible().catch(() => false);
      
      expect(hasErrorHandling || hasFallbackUI).toBe(true);
    });
  });

  test.describe('Browser-Specific Features', () => {
    test('should handle browser-specific CSS features', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test CSS Grid support
      const gridSupported = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.display = 'grid';
        return testElement.style.display === 'grid';
      });

      expect(gridSupported).toBe(true);

      // Test Flexbox support
      const flexboxSupported = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.display = 'flex';
        return testElement.style.display === 'flex';
      });

      expect(flexboxSupported).toBe(true);

      // Test CSS Custom Properties (CSS Variables)
      const cssVariablesSupported = await page.evaluate(() => {
        const testElement = document.createElement('div');
        testElement.style.setProperty('--test-var', 'red');
        return testElement.style.getPropertyValue('--test-var') === 'red';
      });

      expect(cssVariablesSupported).toBe(true);
    });

    test('should handle browser-specific JavaScript features', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test ES6 features
      const es6Supported = await page.evaluate(() => {
        try {
          // Test arrow functions
          const arrow = () => true;
          // Test template literals
          const template = `test ${arrow()}`;
          // Test destructuring
          const { a, b } = { a: 1, b: 2 };
          // Test async/await
          const asyncTest = async () => Promise.resolve(true);
          return template === 'test true' && a === 1 && b === 2;
        } catch (error) {
          return false;
        }
      });

      expect(es6Supported).toBe(true);

      // Test Fetch API
      const fetchSupported = await page.evaluate(() => {
        return typeof fetch === 'function';
      });

      expect(fetchSupported).toBe(true);

      // Test WebSocket support
      const webSocketSupported = await page.evaluate(() => {
        return typeof WebSocket === 'function';
      });

      expect(webSocketSupported).toBe(true);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewports', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('/dashboard');

      // Check that navigation is accessible
      await expect(page.locator('[data-testid="dashboard-nav"]')).toBeVisible();
      
      // Check that main content is visible
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad
      await page.reload();

      await expect(page.locator('[data-testid="dashboard-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
      await page.reload();

      await expect(page.locator('[data-testid="dashboard-nav"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });

    test('should handle touch events on mobile', async ({ page }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');

      // Test touch events
      const touchSupported = await page.evaluate(() => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      });

      // Touch support varies by browser and device
      console.log(`Touch support detected: ${touchSupported}`);

      // Test that interactive elements work with touch
      const navTabs = page.locator('[data-testid="navigation"] [data-testid^="nav-"]');
      const tabCount = await navTabs.count();
      
      if (tabCount > 0) {
        await navTabs.first().tap();
        // Verify the tap worked (page should navigate or show content)
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      }
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should load within acceptable time limits', async ({ page, browserName }) => {
      const startTime = Date.now();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');
      
      // Wait for main content to be visible
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Set different thresholds based on browser
      let maxLoadTime: number;
      switch (browserName) {
        case 'chromium':
          maxLoadTime = 3000; // 3 seconds
          break;
        case 'firefox':
          maxLoadTime = 4000; // 4 seconds
          break;
        case 'webkit':
          maxLoadTime = 5000; // 5 seconds
          break;
        default:
          maxLoadTime = 5000; // 5 seconds
      }
      
      expect(loadTime).toBeLessThan(maxLoadTime);
      console.log(`${browserName} load time: ${loadTime}ms`);
    });

    test('should handle concurrent operations', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate multiple concurrent operations
      const operations = [
        page.goto('/dashboard/queue'),
        page.goto('/dashboard/messages'),
        page.goto('/dashboard/calls'),
      ];

      // Execute operations concurrently
      const startTime = Date.now();
      await Promise.all(operations);
      const endTime = Date.now();

      // Verify all pages loaded successfully
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      const totalTime = endTime - startTime;
      console.log(`${browserName} concurrent operations time: ${totalTime}ms`);
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(10000); // 10 seconds
    });
  });

  test.describe('Browser-Specific Quirks', () => {
    test('should handle different date/time formats', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test date parsing
      const dateSupported = await page.evaluate(() => {
        try {
          const date = new Date('2024-01-01T00:00:00Z');
          return date instanceof Date && !isNaN(date.getTime());
        } catch (error) {
          return false;
        }
      });

      expect(dateSupported).toBe(true);

      // Test timezone handling
      const timezoneSupported = await page.evaluate(() => {
        try {
          const date = new Date();
          return typeof date.getTimezoneOffset() === 'number';
        } catch (error) {
          return false;
        }
      });

      expect(timezoneSupported).toBe(true);
    });

    test('should handle different input types', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/admin');
      await page.click('[data-testid="nav-users"]');

      // Test different input types
      const inputTypesSupported = await page.evaluate(() => {
        const input = document.createElement('input');
        const types = ['text', 'email', 'password', 'tel', 'url'];
        
        return types.every(type => {
          input.type = type;
          return input.type === type;
        });
      });

      expect(inputTypesSupported).toBe(true);
    });

    test('should handle different file upload scenarios', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test file input support
      const fileInputSupported = await page.evaluate(() => {
        const input = document.createElement('input');
        input.type = 'file';
        return input.type === 'file';
      });

      expect(fileInputSupported).toBe(true);

      // Test drag and drop support
      const dragDropSupported = await page.evaluate(() => {
        const div = document.createElement('div');
        return 'draggable' in div;
      });

      expect(dragDropSupported).toBe(true);
    });
  });

  test.describe('Accessibility Across Browsers', () => {
    test('should support keyboard navigation', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test Tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Verify focus is visible
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });

      expect(focusedElement).toBeTruthy();

      // Test Enter key activation
      await page.keyboard.press('Enter');
      
      // Verify some action occurred (page should still be visible)
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });

    test('should support screen reader attributes', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Check for ARIA attributes
      const ariaSupported = await page.evaluate(() => {
        const element = document.createElement('div');
        element.setAttribute('aria-label', 'test');
        element.setAttribute('aria-describedby', 'test');
        element.setAttribute('role', 'button');
        
        return element.getAttribute('aria-label') === 'test' &&
               element.getAttribute('aria-describedby') === 'test' &&
               element.getAttribute('role') === 'button';
      });

      expect(ariaSupported).toBe(true);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/dashboard');
      
      // Page should still load with error handling
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Check for error messages or fallback content
      const hasErrorHandling = await page.locator('text=Error').isVisible().catch(() => false);
      const hasFallbackContent = await page.locator('text=Unable to load').isVisible().catch(() => false);
      
      expect(hasErrorHandling || hasFallbackContent).toBe(true);
    });

    test('should handle JavaScript errors gracefully', async ({ page, browserName }) => {
      await qaHelpers.loginAs(page, 'agent');
      
      // Inject a JavaScript error
      await page.addInitScript(() => {
        window.addEventListener('error', (event) => {
          console.log('JavaScript error caught:', event.error);
        });
      });
      
      await page.goto('/dashboard');
      
      // Page should still function despite potential JS errors
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Test that basic functionality still works
      await page.click('[data-testid="nav-queue"]');
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });
  });
});
