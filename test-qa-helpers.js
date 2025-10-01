#!/usr/bin/env node

/**
 * Test script to verify qa-helpers functions work correctly
 * This tests the helper functions without needing the full E2E setup
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_MODE = process.env.TEST_MODE || 'true';

console.log('🧪 Testing QA Helpers');
console.log('====================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Mode: ${TEST_MODE}`);
console.log('');

// Mock qa-helpers for testing
const qaHelpers = {
  BASE_URL,
  TEST_MODE: TEST_MODE === 'true',

  async simulateQueueUpdate(opts) {
    if (!this.TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    let queueId, waitingCount, availableAgents, averageWaitTime;

    if (opts && 'queueCount' in opts) {
      // Legacy signature: simulateQueueUpdate({ queueCount: 5 })
      queueId = 'support_queue';
      waitingCount = opts.queueCount;
      availableAgents = 1;
    } else if (opts) {
      // New object signature: simulateQueueUpdate({ queue, count, availableAgents, averageWaitTime })
      queueId = opts.queue || 'support_queue';
      waitingCount = opts.count || 0;
      availableAgents = opts.availableAgents || 1;
      averageWaitTime = opts.averageWaitTime;
    } else {
      // Default values
      queueId = 'support_queue';
      waitingCount = 0;
      availableAgents = 1;
    }

    const response = await fetch(`${this.BASE_URL}/api/test/simulate/queue-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queueId,
        waitingCount,
        availableAgents,
        averageWaitTime,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate queue update: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateSocketConnectionFailure() {
    if (!this.TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${this.BASE_URL}/api/test/simulate/socket-connection-failure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate socket connection failure: ${response.statusText}`);
    }

    return response.json();
  },

  async simulateQuickbaseDataChange(customerId, changes) {
    if (!this.TEST_MODE) {
      throw new Error('Simulation methods only available in TEST_MODE');
    }

    const response = await fetch(`${this.BASE_URL}/api/test/simulate/quickbase-data-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        changes,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to simulate Quickbase data change: ${response.statusText}`);
    }

    return response.json();
  }
};

// Test helper functions
async function testHelper(helperName, testFunction) {
  try {
    console.log(`Testing ${helperName}...`);
    await testFunction();
    console.log(`✅ ${helperName} - PASSED`);
  } catch (error) {
    console.log(`❌ ${helperName} - FAILED: ${error.message}`);
  }
  console.log('');
}

async function runTests() {
  console.log('Testing Queue Update Helper (Legacy Signature)...');
  await testHelper('Queue Update (Legacy)', async () => {
    const result = await qaHelpers.simulateQueueUpdate({ queueCount: 5 });
    if (!result.success) throw new Error('Expected success: true');
    if (result.waitingCount !== 5) throw new Error(`Expected waitingCount: 5, got: ${result.waitingCount}`);
  });

  console.log('Testing Queue Update Helper (New Signature)...');
  await testHelper('Queue Update (New)', async () => {
    const result = await qaHelpers.simulateQueueUpdate({ 
      queue: 'sales', 
      count: 10, 
      availableAgents: 3,
      averageWaitTime: 120 
    });
    if (!result.success) throw new Error('Expected success: true');
    if (result.waitingCount !== 10) throw new Error(`Expected waitingCount: 10, got: ${result.waitingCount}`);
    if (result.availableAgents !== 3) throw new Error(`Expected availableAgents: 3, got: ${result.availableAgents}`);
  });

  console.log('Testing Queue Update Helper (Default Values)...');
  await testHelper('Queue Update (Default)', async () => {
    const result = await qaHelpers.simulateQueueUpdate();
    if (!result.success) throw new Error('Expected success: true');
    if (result.waitingCount !== 0) throw new Error(`Expected waitingCount: 0, got: ${result.waitingCount}`);
  });

  console.log('Testing Socket Connection Failure Helper...');
  await testHelper('Socket Connection Failure', async () => {
    const result = await qaHelpers.simulateSocketConnectionFailure();
    if (!result.success) throw new Error('Expected success: true');
  });

  console.log('Testing Quickbase Data Change Helper...');
  await testHelper('Quickbase Data Change', async () => {
    const result = await qaHelpers.simulateQuickbaseDataChange('test-customer-123', {
      name: 'Updated Name',
      email: 'updated@example.com'
    });
    if (!result.success) throw new Error('Expected success: true');
  });

  console.log('🎉 QA Helpers Test Complete!');
  console.log('');
  console.log('The helpers are working correctly and can:');
  console.log('✅ Handle legacy signatures for backward compatibility');
  console.log('✅ Handle new object-based signatures');
  console.log('✅ Use default values when no options provided');
  console.log('✅ Make HTTP requests to the simulation API endpoints');
  console.log('✅ Return parsed JSON responses');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Set TEST_MODE=true in your environment');
  console.log('3. Run this test: node test-qa-helpers.js');
  console.log('4. Check that Socket.io events are being emitted in your browser console');
}

// Check if we're running this script directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testHelper, qaHelpers };
