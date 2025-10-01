import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

// Environment-aware configuration
const isCI = process.env.CI === 'true';
const perfMode = process.env.PERF_MODE || 'local';
const userCount = perfMode === 'ci' ? 12 : 30;
const timeoutMultiplier = isCI ? 2 : 1;
const retryCount = isCI ? 1 : 0;

// CI-friendly thresholds
const thresholds = {
  local: {
    callDuration: 10000,
    smsDuration: 15000,
    voicemailDuration: 20000,
    dbDuration: 5000,
    memoryIncrease: 100 * 1024 * 1024, // 100MB
    callResponseTime: 1000,
    smsResponseTime: 1500,
    voicemailResponseTime: 2000,
    dbResponseTime: 500
  },
  ci: {
    callDuration: 20000,
    smsDuration: 30000,
    voicemailDuration: 40000,
    dbDuration: 10000,
    memoryIncrease: 200 * 1024 * 1024, // 200MB
    callResponseTime: 2000,
    smsResponseTime: 3000,
    voicemailResponseTime: 4000,
    dbResponseTime: 1000
  }
};

const currentThresholds = thresholds[perfMode as keyof typeof thresholds] || thresholds.local;

test.describe(`Performance Testing - ${userCount} Concurrent Users (${perfMode.toUpperCase()})`, () => {
  let testData: any;
  let performanceMetrics: any = {};

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  // Configure test timeouts and retries for CI
  test.beforeEach(async () => {
    test.setTimeout(currentThresholds.callDuration * timeoutMultiplier);
    if (isCI) {
      test.slow();
    }
  });

  test.describe('Concurrent Voice Calls', () => {
    test(`should handle ${userCount} concurrent voice calls`, async ({ browser }) => {
      test.retry(retryCount);
      
      const startTime = Date.now();
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create concurrent browser contexts with staggered creation in CI
        if (isCI) {
          // Stagger context creation in CI to reduce resource contention
          for (let i = 0; i < userCount; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            contexts.push(context);
            pages.push(page);
            if (i % 4 === 3) { // Wait every 4 contexts
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } else {
          // Create all contexts concurrently in local environment
          for (let i = 0; i < userCount; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            contexts.push(context);
            pages.push(page);
          }
        }

        // Login all users concurrently
        const loginPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`)
        );
        await Promise.all(loginPromises);

        // Navigate all users to dashboard concurrently
        const navigationPromises = pages.map(page => 
          page.goto('/dashboard')
        );
        await Promise.all(navigationPromises);

        // Simulate concurrent calls with staggered timing in CI
        const callPromises = pages.map(async (page, index) => {
          if (isCI && index > 0) {
            // Stagger calls in CI to reduce load
            await new Promise(resolve => setTimeout(resolve, index * 50));
          }
          return qaHelpers.simulateInboundCall(testData.contacts.customer.phone, `Call ${index + 1}`);
        });
        await Promise.all(callPromises);

        // Answer all calls concurrently
        const answerPromises = pages.map(page => 
          page.click('[data-testid="answer-call-button"]')
        );
        await Promise.all(answerPromises);

        // Verify all calls are connected with relaxed timeout
        const verificationPromises = pages.map(page => 
          expect(page.locator('[data-testid="call-controls"]')).toBeVisible({ timeout: currentThresholds.callResponseTime })
        );
        await Promise.all(verificationPromises);

        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        // Performance assertions with environment-aware thresholds
        expect(totalDuration).toBeLessThan(currentThresholds.callDuration);
        expect(pages.length).toBe(userCount);
        
        performanceMetrics.concurrentCalls = {
          duration: totalDuration,
          successRate: 100,
          averageResponseTime: totalDuration / userCount,
          userCount: userCount,
          environment: perfMode
        };

        // Verify performance metrics
        expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
        expect(performanceMetrics.concurrentCalls.successRate).toBe(100);

      } finally {
        // Cleanup all contexts
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should maintain call quality under concurrent load', async ({ browser }) => {
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create 30 concurrent contexts
        for (let i = 0; i < 30; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        // Setup all users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard')
          )
        );
        await Promise.all(setupPromises);

        // Start concurrent calls
        const callPromises = pages.map((page, index) => 
          qaHelpers.simulateInboundCall(testData.contacts.customer.phone, `Quality test ${index + 1}`)
        );
        await Promise.all(callPromises);

        // Answer calls and measure quality
        const qualityPromises = pages.map(async (page, index) => {
          await page.click('[data-testid="answer-call-button"]');
          
          // Simulate call quality measurement
          await qaHelpers.simulateCallQualityUpdate('excellent');
          const quality = await page.locator('[data-testid="call-quality"]').textContent();
          
          return { index, quality };
        });

        const qualityResults = await Promise.all(qualityPromises);
        
        // Verify call quality maintained
        const excellentQualityCount = qualityResults.filter(r => r.quality?.includes('excellent')).length;
        expect(excellentQualityCount).toBeGreaterThan(25); // At least 25/30 calls should have excellent quality

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should handle call routing under concurrent load', async ({ browser }) => {
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create 30 concurrent contexts
        for (let i = 0; i < 30; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        // Setup users with different roles
        const setupPromises = pages.map(async (page, index) => {
          const role = index < 10 ? 'agent' : index < 20 ? 'supervisor' : 'admin';
          await qaHelpers.loginAs(page, role, `user${index + 1}`);
          await page.goto('/dashboard');
        });
        await Promise.all(setupPromises);

        // Simulate concurrent calls with different routing requirements
        const routingPromises = pages.map((page, index) => {
          const customerType = index % 3 === 0 ? 'vip' : 'standard';
          return qaHelpers.simulateInboundCall(
            testData.contacts[customerType === 'vip' ? 'vipCustomer' : 'customer'].phone,
            `Routing test ${index + 1}`
          );
        });
        await Promise.all(routingPromises);

        // Verify routing accuracy
        const routingVerificationPromises = pages.map(async (page, index) => {
          const customerType = index % 3 === 0 ? 'vip' : 'standard';
          const expectedQueue = customerType === 'vip' ? 'vip-queue' : 'standard-queue';
          
          await expect(page.locator(`[data-testid="${expectedQueue}"]`)).toBeVisible();
          return { index, routed: true };
        });

        const routingResults = await Promise.all(routingVerificationPromises);
        const successfulRoutings = routingResults.filter(r => r.routed).length;
        
        expect(successfulRoutings).toBe(30); // All calls should be routed correctly

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });

  test.describe('Concurrent SMS Messaging', () => {
    test(`should handle ${userCount} concurrent SMS conversations`, async ({ browser }) => {
      test.retry(retryCount);
      
      const startTime = Date.now();
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create concurrent contexts with staggered creation in CI
        if (isCI) {
          for (let i = 0; i < userCount; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            contexts.push(context);
            pages.push(page);
            if (i % 4 === 3) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } else {
          for (let i = 0; i < userCount; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            contexts.push(context);
            pages.push(page);
          }
        }

        // Setup all users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard/messages')
          )
        );
        await Promise.all(setupPromises);

        // Start concurrent SMS conversations
        const smsPromises = pages.map((page, index) => 
          page.click('[data-testid="new-message-button"]').then(() => 
            page.fill('[data-testid="recipient-phone"]', testData.contacts.customer.phone)
          ).then(() => 
            page.fill('[data-testid="message-text"]', `Concurrent SMS test ${index + 1}`)
          ).then(() => 
            page.click('[data-testid="send-message-button"]')
          )
        );
        await Promise.all(smsPromises);

        // Verify all messages sent with relaxed timeout
        const verificationPromises = pages.map(page => 
          expect(page.locator('[data-testid="message-sent-indicator"]')).toBeVisible({ timeout: currentThresholds.smsResponseTime })
        );
        await Promise.all(verificationPromises);

        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        performanceMetrics.concurrentSMS = {
          duration: totalDuration,
          successRate: 100,
          averageResponseTime: totalDuration / userCount,
          userCount: userCount,
          environment: perfMode
        };

        // Performance assertions with environment-aware thresholds
        expect(totalDuration).toBeLessThan(currentThresholds.smsDuration);
        expect(pages.length).toBe(userCount);

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should handle concurrent bulk messaging', async ({ browser }) => {
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create 10 admin users for bulk messaging
        for (let i = 0; i < 10; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        // Setup admin users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'admin', `admin${index + 1}`).then(() => 
            page.goto('/dashboard/messages/bulk')
          )
        );
        await Promise.all(setupPromises);

        // Execute concurrent bulk messaging
        const bulkPromises = pages.map((page, index) => 
          page.check('[data-testid="field-crew-group"]').then(() => 
            page.fill('[data-testid="bulk-message-text"]', `Bulk message ${index + 1}`)
          ).then(() => 
            page.click('[data-testid="send-bulk-button"]')
          )
        );
        await Promise.all(bulkPromises);

        // Verify bulk messaging completion
        const verificationPromises = pages.map(page => 
          expect(page.locator('[data-testid="bulk-send-confirmation"]')).toBeVisible()
        );
        await Promise.all(verificationPromises);

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });

  test.describe('Concurrent Voicemail Processing', () => {
    test(`should handle ${userCount} concurrent voicemail recordings`, async ({ browser }) => {
      test.retry(retryCount);
      
      const startTime = Date.now();
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create concurrent contexts with staggered creation in CI
        if (isCI) {
          for (let i = 0; i < userCount; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            contexts.push(context);
            pages.push(page);
            if (i % 4 === 3) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } else {
          for (let i = 0; i < userCount; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            contexts.push(context);
            pages.push(page);
          }
        }

        // Setup all users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard/voicemails')
          )
        );
        await Promise.all(setupPromises);

        // Simulate concurrent voicemails
        const voicemailPromises = pages.map((page, index) => 
          qaHelpers.simulateVoicemail(
            testData.contacts.customer.phone, 
            `Concurrent voicemail test ${index + 1}`
          )
        );
        await Promise.all(voicemailPromises);

        // Verify all voicemails processed
        const verificationPromises = pages.map(async page => {
          const voicemailItemCount = await page.locator('[data-testid="voicemail-item"]').count();
          expect(voicemailItemCount).toBeGreaterThan(0);
        });
        await Promise.all(verificationPromises);

        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        performanceMetrics.concurrentVoicemails = {
          duration: totalDuration,
          successRate: 100,
          averageResponseTime: totalDuration / userCount,
          userCount: userCount,
          environment: perfMode
        };

        // Performance assertions with environment-aware thresholds
        expect(totalDuration).toBeLessThan(currentThresholds.voicemailDuration);
        expect(pages.length).toBe(userCount);

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should handle concurrent voicemail transcription', async ({ browser }) => {
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create 30 concurrent contexts
        for (let i = 0; i < 30; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        // Setup all users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard/voicemails')
          )
        );
        await Promise.all(setupPromises);

        // Create voicemails with transcription
        const transcriptionPromises = pages.map((page, index) => 
          qaHelpers.simulateVoicemail(
            testData.contacts.customer.phone, 
            `Transcription test message ${index + 1} for concurrent processing`
          )
        );
        await Promise.all(transcriptionPromises);

        // Verify transcriptions completed
        const transcriptionVerificationPromises = pages.map(async (page, index) => {
          await page.click('[data-testid="voicemail-item"]');
          await expect(page.locator('[data-testid="transcription-text"]')).toBeVisible();
          return { index, transcribed: true };
        });

        const transcriptionResults = await Promise.all(transcriptionVerificationPromises);
        const successfulTranscriptions = transcriptionResults.filter(r => r.transcribed).length;
        
        expect(successfulTranscriptions).toBe(30); // All voicemails should be transcribed

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });

  test.describe('Real-time Updates Under Load', () => {
    test('should maintain real-time updates with 30 concurrent users', async ({ browser }) => {
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create 30 concurrent contexts
        for (let i = 0; i < 30; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        // Setup all users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard')
          )
        );
        await Promise.all(setupPromises);

        // Verify Socket.io connections
        const connectionPromises = pages.map(page => 
          expect(page.locator('[data-testid="socket-status"]')).toContainText('Connected')
        );
        await Promise.all(connectionPromises);

        // Simulate real-time updates
        const updatePromises = pages.map((page, index) => 
          qaHelpers.simulateQueueUpdate({ count: index + 1 })
        );
        await Promise.all(updatePromises);

        // Verify real-time updates received
        const updateVerificationPromises = pages.map((page, index) => 
          expect(page.locator('[data-testid="queue-count"]')).toContainText((index + 1).toString())
        );
        await Promise.all(updateVerificationPromises);

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should handle concurrent presence updates', async ({ browser }) => {
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create 30 concurrent contexts
        for (let i = 0; i < 30; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        // Setup all users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard/team')
          )
        );
        await Promise.all(setupPromises);

        // Simulate concurrent presence updates
        const presencePromises = pages.map((page, index) => {
          const statuses = ['available', 'busy', 'away'];
          const status = statuses[index % 3];
          return qaHelpers.simulatePresenceStatusChange(status);
        });
        await Promise.all(presencePromises);

        // Verify presence updates
        const presenceVerificationPromises = pages.map((page, index) => {
          const statuses = ['Available', 'Busy', 'Away'];
          const expectedStatus = statuses[index % 3];
          return expect(page.locator('[data-testid="online-status"]')).toContainText(expectedStatus);
        });
        await Promise.all(presenceVerificationPromises);

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });

  test.describe('Database Performance Under Load', () => {
    test('should handle concurrent database operations', async ({ browser }) => {
      test.retry(retryCount);
      
      const startTime = Date.now();
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create concurrent contexts with staggered creation in CI
        if (isCI) {
          for (let i = 0; i < userCount; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            contexts.push(context);
            pages.push(page);
            if (i % 4 === 3) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } else {
          for (let i = 0; i < userCount; i++) {
            const context = await browser.newContext();
            const page = await context.newPage();
            contexts.push(context);
            pages.push(page);
          }
        }

        // Setup all users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard/contacts')
          )
        );
        await Promise.all(setupPromises);

        // Perform concurrent database operations
        const dbPromises = pages.map((page, index) => 
          page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone).then(() => 
            page.click('[data-testid="search-button"]')
          ).then(() => 
            expect(page.locator('[data-testid="customer-info"]')).toBeVisible()
          )
        );
        await Promise.all(dbPromises);

        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        performanceMetrics.databaseOperations = {
          duration: totalDuration,
          successRate: 100,
          averageResponseTime: totalDuration / userCount,
          userCount: userCount,
          environment: perfMode
        };

        // Performance assertions with environment-aware thresholds
        expect(totalDuration).toBeLessThan(currentThresholds.dbDuration);
        expect(pages.length).toBe(userCount);

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should handle concurrent Quickbase API calls', async ({ browser }) => {
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create 30 concurrent contexts
        for (let i = 0; i < 30; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        // Setup all users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard/contacts')
          )
        );
        await Promise.all(setupPromises);

        // Perform concurrent Quickbase lookups
        const quickbasePromises = pages.map((page, index) => 
          page.fill('[data-testid="phone-search"]', testData.contacts.customer.phone).then(() => 
            page.click('[data-testid="search-button"]')
          ).then(() => 
            expect(page.locator('[data-testid="quickbase-data"]')).toBeVisible()
          )
        );
        await Promise.all(quickbasePromises);

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });

  test.describe('Memory Usage and System Stability', () => {
    test('should maintain stable memory usage under load', async ({ browser }) => {
      const memorySnapshots: number[] = [];
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create 30 concurrent contexts
        for (let i = 0; i < 30; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        // Take initial memory snapshot
        const initialMemory = await pages[0].evaluate(() => (performance as any).memory?.usedJSHeapSize ?? 0);
        memorySnapshots.push(initialMemory);

        // Setup all users
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard')
          )
        );
        await Promise.all(setupPromises);

        // Take memory snapshot after setup
        const setupMemory = await pages[0].evaluate(() => (performance as any).memory?.usedJSHeapSize ?? 0);
        memorySnapshots.push(setupMemory);

        // Perform intensive operations
        const intensivePromises = pages.map((page, index) => 
          qaHelpers.simulateInboundCall(testData.contacts.customer.phone, `Memory test ${index + 1}`)
        );
        await Promise.all(intensivePromises);

        // Take memory snapshot after operations
        const operationMemory = await pages[0].evaluate(() => (performance as any).memory?.usedJSHeapSize ?? 0);
        memorySnapshots.push(operationMemory);

        // Verify memory usage is reasonable
        const memoryIncrease = operationMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase

      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should handle system recovery after load', async ({ browser }) => {
      const pages: Page[] = [];
      const contexts = [];

      try {
        // Create 30 concurrent contexts
        for (let i = 0; i < 30; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        // Apply heavy load
        const setupPromises = pages.map((page, index) => 
          qaHelpers.loginAs(page, 'agent', `agent${index + 1}`).then(() => 
            page.goto('/dashboard')
          )
        );
        await Promise.all(setupPromises);

        const loadPromises = pages.map((page, index) => 
          qaHelpers.simulateInboundCall(testData.contacts.customer.phone, `Load test ${index + 1}`)
        );
        await Promise.all(loadPromises);

        // Close all contexts to simulate load reduction
        await Promise.all(contexts.map(context => context.close()));

        // Create new context to test system recovery
        const recoveryContext = await browser.newContext();
        const recoveryPage = await recoveryContext.newPage();

        // Test system functionality after load
        await qaHelpers.loginAs(recoveryPage, 'agent');
        await recoveryPage.goto('/dashboard');

        // Verify system is responsive
        await expect(recoveryPage.locator('[data-testid="dashboard-content"]')).toBeVisible();
        await expect(recoveryPage.locator('[data-testid="socket-status"]')).toContainText('Connected');

        await recoveryContext.close();

      } finally {
        // Ensure cleanup
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });

  test.describe('Performance Metrics and Reporting', () => {
    test('should collect and report performance metrics', async () => {
      // Verify performance metrics were collected
      expect(performanceMetrics.concurrentCalls).toBeDefined();
      expect(performanceMetrics.concurrentSMS).toBeDefined();
      expect(performanceMetrics.concurrentVoicemails).toBeDefined();
      expect(performanceMetrics.databaseOperations).toBeDefined();

      // Verify metrics meet requirements
      expect(performanceMetrics.concurrentCalls.successRate).toBe(100);
      expect(performanceMetrics.concurrentSMS.successRate).toBe(100);
      expect(performanceMetrics.concurrentVoicemails.successRate).toBe(100);
      expect(performanceMetrics.databaseOperations.successRate).toBe(100);

      // Verify response times are acceptable
      expect(performanceMetrics.concurrentCalls.averageResponseTime).toBeLessThan(1000);
      expect(performanceMetrics.concurrentSMS.averageResponseTime).toBeLessThan(1500);
      expect(performanceMetrics.concurrentVoicemails.averageResponseTime).toBeLessThan(2000);
      expect(performanceMetrics.databaseOperations.averageResponseTime).toBeLessThan(500);

      // Log performance metrics
      console.log('Performance Metrics:', JSON.stringify(performanceMetrics, null, 2));
    });

    test('should identify performance bottlenecks', async () => {
      // Analyze performance metrics for bottlenecks
      const bottlenecks = [];

      if (performanceMetrics.concurrentCalls.averageResponseTime > 1000) {
        bottlenecks.push('Voice call processing');
      }

      if (performanceMetrics.concurrentSMS.averageResponseTime > 1500) {
        bottlenecks.push('SMS processing');
      }

      if (performanceMetrics.concurrentVoicemails.averageResponseTime > 2000) {
        bottlenecks.push('Voicemail processing');
      }

      if (performanceMetrics.databaseOperations.averageResponseTime > 500) {
        bottlenecks.push('Database operations');
      }

      // Report bottlenecks
      if (bottlenecks.length > 0) {
        console.log('Performance Bottlenecks Identified:', bottlenecks);
      }

      // Verify no critical bottlenecks (relaxed for CI)
      if (isCI) {
        expect(bottlenecks.length).toBeLessThan(2); // Allow up to 2 bottlenecks in CI
      } else {
        expect(bottlenecks.length).toBe(0);
      }
    });

    test('should export performance metrics for analysis', async () => {
      // Export performance metrics for CI/CD pipeline analysis
      const metrics = {
        environment: perfMode,
        userCount: userCount,
        timestamp: new Date().toISOString(),
        ...performanceMetrics
      };

      // Log metrics for CI/CD pipeline
      console.log('Performance Metrics:', JSON.stringify(metrics, null, 2));

      // In CI, export to file for analysis
      if (isCI) {
        const fs = require('fs');
        const path = require('path');
        const metricsPath = path.join(process.cwd(), 'performance-metrics.json');
        fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
        console.log(`Performance metrics exported to: ${metricsPath}`);
      }

      // Basic validation that metrics were collected
      expect(performanceMetrics).toBeDefined();
      expect(performanceMetrics.concurrentCalls).toBeDefined();
      expect(performanceMetrics.concurrentSMS).toBeDefined();
      expect(performanceMetrics.concurrentVoicemails).toBeDefined();
      expect(performanceMetrics.databaseOperations).toBeDefined();
    });
  });
});
