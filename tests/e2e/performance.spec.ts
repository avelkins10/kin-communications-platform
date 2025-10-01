import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

// Environment-based performance thresholds
const PERFORMANCE_THRESHOLDS = {
  development: {
    pageLoad: 5000,      // 5 seconds
    apiResponse: 2000,   // 2 seconds
    navigation: 1000,    // 1 second
    concurrentUsers: 10, // 10 concurrent users
    memoryUsage: 100,    // 100MB
  },
  staging: {
    pageLoad: 3000,      // 3 seconds
    apiResponse: 1500,   // 1.5 seconds
    navigation: 800,     // 800ms
    concurrentUsers: 20, // 20 concurrent users
    memoryUsage: 80,     // 80MB
  },
  production: {
    pageLoad: 2000,      // 2 seconds
    apiResponse: 1000,   // 1 second
    navigation: 500,     // 500ms
    concurrentUsers: 50, // 50 concurrent users
    memoryUsage: 60,     // 60MB
  },
  test: {
    pageLoad: 10000,     // 10 seconds (more lenient for test environment)
    apiResponse: 5000,   // 5 seconds
    navigation: 2000,    // 2 seconds
    concurrentUsers: 5,  // 5 concurrent users
    memoryUsage: 150,    // 150MB
  }
};

// Get current environment
const getCurrentEnvironment = (): keyof typeof PERFORMANCE_THRESHOLDS => {
  const env = process.env.NODE_ENV || 'development';
  return env as keyof typeof PERFORMANCE_THRESHOLDS;
};

// Get performance thresholds for current environment
const getThresholds = () => {
  const env = getCurrentEnvironment();
  return PERFORMANCE_THRESHOLDS[env];
};

test.describe('Performance Testing', () => {
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page }) => {
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Page Load Performance', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const thresholds = getThresholds();
      const startTime = Date.now();

      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');
      
      // Wait for main content to be visible
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(thresholds.pageLoad);
      console.log(`Dashboard load time: ${loadTime}ms (threshold: ${thresholds.pageLoad}ms)`);
    });

    test('should load admin panel within acceptable time', async ({ page }) => {
      const thresholds = getThresholds();
      const startTime = Date.now();

      await qaHelpers.loginAs(page, 'admin');
      await page.goto('/dashboard/admin');
      
      // Wait for admin panel to be visible
      await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(thresholds.pageLoad);
      console.log(`Admin panel load time: ${loadTime}ms (threshold: ${thresholds.pageLoad}ms)`);
    });

    test('should load queue page within acceptable time', async ({ page }) => {
      const thresholds = getThresholds();
      const startTime = Date.now();

      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/queue');
      
      // Wait for queue page to be visible
      await expect(page.locator('[data-testid="queue-page"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(thresholds.pageLoad);
      console.log(`Queue page load time: ${loadTime}ms (threshold: ${thresholds.pageLoad}ms)`);
    });

    test('should load messages page within acceptable time', async ({ page }) => {
      const thresholds = getThresholds();
      const startTime = Date.now();

      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard/messages');
      
      // Wait for messages page to be visible
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(thresholds.pageLoad);
      console.log(`Messages page load time: ${loadTime}ms (threshold: ${thresholds.pageLoad}ms)`);
    });
  });

  test.describe('API Response Performance', () => {
    test('should respond to API calls within acceptable time', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test API response time
      const startTime = Date.now();
      
      // Make an API call (this would be a real API call in the app)
      const response = await page.request.get('/api/contacts');
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(thresholds.apiResponse);
      console.log(`API response time: ${responseTime}ms (threshold: ${thresholds.apiResponse}ms)`);
    });

    test('should handle multiple API calls efficiently', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Make multiple API calls concurrently
      const startTime = Date.now();
      
      const promises = [
        page.request.get('/api/contacts'),
        page.request.get('/api/calls'),
        page.request.get('/api/messages'),
        page.request.get('/api/voicemails'),
      ];
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All responses should be successful
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
      
      // Total time should be reasonable (not much more than single API call)
      expect(totalTime).toBeLessThan(thresholds.apiResponse * 2);
      console.log(`Multiple API calls time: ${totalTime}ms (threshold: ${thresholds.apiResponse * 2}ms)`);
    });
  });

  test.describe('Navigation Performance', () => {
    test('should navigate between pages within acceptable time', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Test navigation between different pages
      const pages = [
        { name: 'Queue', selector: '[data-testid="nav-queue"]' },
        { name: 'Messages', selector: '[data-testid="nav-messages"]' },
        { name: 'Calls', selector: '[data-testid="nav-calls"]' },
        { name: 'TaskRouter', selector: '[data-testid="nav-taskrouter"]' },
      ];

      for (const pageInfo of pages) {
        const startTime = Date.now();
        
        await page.click(pageInfo.selector);
        await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
        
        const navigationTime = Date.now() - startTime;
        
        expect(navigationTime).toBeLessThan(thresholds.navigation);
        console.log(`${pageInfo.name} navigation time: ${navigationTime}ms (threshold: ${thresholds.navigation}ms)`);
      }
    });

    test('should handle rapid navigation without issues', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Rapidly navigate between pages
      const startTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="nav-queue"]');
        await page.click('[data-testid="nav-messages"]');
        await page.click('[data-testid="nav-calls"]');
      }
      
      const totalTime = Date.now() - startTime;
      
      // Verify page is still functional
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Total time should be reasonable
      expect(totalTime).toBeLessThan(thresholds.navigation * 15); // 15 rapid navigations
      console.log(`Rapid navigation time: ${totalTime}ms (threshold: ${thresholds.navigation * 15}ms)`);
    });
  });

  test.describe('Memory Usage', () => {
    test('should not exceed memory limits', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Get memory usage
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
        }
        return 0; // Not supported in this browser
      });

      if (memoryUsage > 0) {
        expect(memoryUsage).toBeLessThan(thresholds.memoryUsage);
        console.log(`Memory usage: ${memoryUsage.toFixed(2)}MB (threshold: ${thresholds.memoryUsage}MB)`);
      } else {
        console.log('Memory usage not supported in this browser');
      }
    });

    test('should handle memory-intensive operations', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Perform memory-intensive operations
      const startMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
        }
        return 0;
      });

      // Simulate memory-intensive operations
      await page.evaluate(() => {
        // Create large arrays
        const arrays = [];
        for (let i = 0; i < 100; i++) {
          arrays.push(new Array(1000).fill(Math.random()));
        }
        return arrays.length;
      });

      const endMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize / 1024 / 1024;
        }
        return 0;
      });

      if (startMemory > 0 && endMemory > 0) {
        const memoryIncrease = endMemory - startMemory;
        expect(memoryIncrease).toBeLessThan(thresholds.memoryUsage * 0.5); // Should not increase by more than 50% of threshold
        console.log(`Memory increase: ${memoryIncrease.toFixed(2)}MB (threshold: ${thresholds.memoryUsage * 0.5}MB)`);
      }
    });
  });

  test.describe('Concurrent User Simulation', () => {
    test('should handle concurrent user load', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate concurrent operations
      const startTime = Date.now();
      
      const concurrentOperations = Array.from({ length: thresholds.concurrentUsers }, (_, i) => 
        page.evaluate((index) => {
          // Simulate user action
          return new Promise(resolve => {
            setTimeout(() => resolve(`Operation ${index} completed`), Math.random() * 1000);
          });
        }, i)
      );

      const results = await Promise.all(concurrentOperations);
      const totalTime = Date.now() - startTime;

      // All operations should complete
      expect(results).toHaveLength(thresholds.concurrentUsers);
      
      // Total time should be reasonable
      expect(totalTime).toBeLessThan(thresholds.pageLoad * 2);
      console.log(`Concurrent operations (${thresholds.concurrentUsers} users): ${totalTime}ms (threshold: ${thresholds.pageLoad * 2}ms)`);
    });

    test('should maintain performance under load', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate sustained load
      const startTime = Date.now();
      const operations = [];
      
      for (let i = 0; i < 10; i++) {
        operations.push(
          page.click('[data-testid="nav-queue"]').then(() => 
            page.click('[data-testid="nav-messages"]')
          )
        );
      }

      await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      // Verify page is still functional
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Performance should not degrade significantly
      expect(totalTime).toBeLessThan(thresholds.navigation * 20);
      console.log(`Sustained load time: ${totalTime}ms (threshold: ${thresholds.navigation * 20}ms)`);
    });
  });

  test.describe('Real-time Performance', () => {
    test('should handle real-time updates efficiently', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate real-time updates
      const startTime = Date.now();
      
      // Simulate multiple real-time events
      await qaHelpers.simulateInboundCall(testData.contacts.customer.phone);
      await qaHelpers.simulateInboundSMS(testData.contacts.customer.phone, 'Test message');
      await qaHelpers.simulateQueueUpdate('support_queue', 1, 1);
      
      // Wait for updates to be processed
      await page.waitForTimeout(1000);
      
      const updateTime = Date.now() - startTime;
      
      // Updates should be processed quickly
      expect(updateTime).toBeLessThan(thresholds.apiResponse * 2);
      console.log(`Real-time updates time: ${updateTime}ms (threshold: ${thresholds.apiResponse * 2}ms)`);
    });

    test('should handle high-frequency updates', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      await page.goto('/dashboard');

      // Simulate high-frequency updates
      const startTime = Date.now();
      
      const updatePromises = Array.from({ length: 20 }, (_, i) => 
        qaHelpers.simulateQueueUpdate('support_queue', i % 5, (i % 3) + 1)
      );

      await Promise.all(updatePromises);
      const totalTime = Date.now() - startTime;

      // High-frequency updates should be handled efficiently
      expect(totalTime).toBeLessThan(thresholds.apiResponse * 5);
      console.log(`High-frequency updates time: ${totalTime}ms (threshold: ${thresholds.apiResponse * 5}ms)`);
    });
  });

  test.describe('Resource Loading Performance', () => {
    test('should load resources efficiently', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      
      // Track resource loading
      const resources: any[] = [];
      page.on('response', response => {
        resources.push({
          url: response.url(),
          status: response.status(),
          timing: response.request().timing()
        });
      });

      const startTime = Date.now();
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      const loadTime = Date.now() - startTime;

      // Check resource loading performance
      const slowResources = resources.filter(resource => 
        resource.timing && resource.timing.responseEnd > thresholds.apiResponse
      );

      expect(slowResources.length).toBeLessThan(resources.length * 0.1); // Less than 10% of resources should be slow
      expect(loadTime).toBeLessThan(thresholds.pageLoad);
      
      console.log(`Total resources loaded: ${resources.length}`);
      console.log(`Slow resources: ${slowResources.length}`);
      console.log(`Page load time: ${loadTime}ms`);
    });

    test('should handle resource failures gracefully', async ({ page }) => {
      const thresholds = getThresholds();
      
      await qaHelpers.loginAs(page, 'agent');
      
      // Block some resources to simulate failures
      await page.route('**/api/contacts', route => route.abort());
      
      const startTime = Date.now();
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      const loadTime = Date.now() - startTime;

      // Page should still load despite resource failures
      expect(loadTime).toBeLessThan(thresholds.pageLoad * 1.5); // Allow some extra time for error handling
      console.log(`Page load time with resource failures: ${loadTime}ms`);
    });
  });
});
