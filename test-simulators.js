#!/usr/bin/env node

/**
 * Simple test script to verify our simulation system works
 * This tests the API routes and helpers without needing the full E2E setup
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_MODE = process.env.TEST_MODE || 'true';

console.log('🧪 Testing Simulation System');
console.log('============================');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Mode: ${TEST_MODE}`);
console.log('');

// Test helper functions
async function testSimulator(simulatorName, testFunction) {
  try {
    console.log(`Testing ${simulatorName}...`);
    await testFunction();
    console.log(`✅ ${simulatorName} - PASSED`);
  } catch (error) {
    console.log(`❌ ${simulatorName} - FAILED: ${error.message}`);
  }
  console.log('');
}

// Test API endpoint availability
async function testAPIEndpoint(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timestamp: new Date().toISOString()
    })
  });

  if (response.status === 403) {
    throw new Error('Endpoint not available (TEST_MODE not enabled)');
  }
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(`API returned success: false`);
  }

  return data;
}

// Test resolver endpoints
async function testResolverEndpoint(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (response.status === 403) {
    throw new Error('Endpoint not available (TEST_MODE not enabled)');
  }
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(`API returned success: false`);
  }

  return data;
}

async function runTests() {
  console.log('Testing Socket-related Simulators...');
  await testSimulator('Socket Connection Failure', () => 
    testAPIEndpoint('/api/test/simulate/socket-connection-failure')
  );
  
  await testSimulator('Socket Disconnection', () => 
    testAPIEndpoint('/api/test/simulate/socket-disconnection')
  );
  
  await testSimulator('Socket Reconnection', () => 
    testAPIEndpoint('/api/test/simulate/socket-reconnection')
  );
  
  await testSimulator('Multiple Connection Failures', () => 
    testAPIEndpoint('/api/test/simulate/multiple-connection-failures')
  );
  
  await testSimulator('Socket Error', () => 
    testAPIEndpoint('/api/test/simulate/socket-error')
  );

  console.log('Testing Queue-related Simulators...');
  await testSimulator('Queue Overflow', () => 
    testAPIEndpoint('/api/test/simulate/queue-overflow')
  );
  
  await testSimulator('Queue Update (new signature)', () => 
    testAPIEndpoint('/api/test/simulate/queue-update')
  );

  console.log('Testing Call-related Simulators...');
  await testSimulator('Call Status Change', () => 
    testAPIEndpoint('/api/test/simulate/call-status-change')
  );
  
  await testSimulator('Call Duration Update', () => 
    testAPIEndpoint('/api/test/simulate/call-duration-update')
  );

  console.log('Testing Event-related Simulators...');
  await testSimulator('Event Broadcast', () => 
    testAPIEndpoint('/api/test/simulate/event-broadcast')
  );
  
  await testSimulator('Broadcast Failure', () => 
    testAPIEndpoint('/api/test/simulate/broadcast-failure')
  );
  
  await testSimulator('Activity', () => 
    testAPIEndpoint('/api/test/simulate/activity')
  );
  
  await testSimulator('Multiple Activities', () => 
    testAPIEndpoint('/api/test/simulate/multiple-activities')
  );

  console.log('Testing Message-related Simulators...');
  await testSimulator('Message Delivery Failure', () => 
    testAPIEndpoint('/api/test/simulate/message-delivery-failure')
  );
  
  await testSimulator('Event Processing Failure', () => 
    testAPIEndpoint('/api/test/simulate/event-processing-failure')
  );

  console.log('Testing Quickbase-related Simulators...');
  await testSimulator('Real-time Update', () => 
    testAPIEndpoint('/api/test/simulate/real-time-update')
  );
  
  await testSimulator('Concurrent Updates', () => 
    testAPIEndpoint('/api/test/simulate/concurrent-updates')
  );
  
  await testSimulator('Rapid Updates', () => 
    testAPIEndpoint('/api/test/simulate/rapid-updates')
  );
  
  await testSimulator('Sync Conflict', () => 
    testAPIEndpoint('/api/test/simulate/sync-conflict')
  );
  
  await testSimulator('Sync Failure', () => 
    testAPIEndpoint('/api/test/simulate/sync-failure')
  );
  
  await testSimulator('Quickbase API Error', () => 
    testAPIEndpoint('/api/test/simulate/quickbase-api-error')
  );
  
  await testSimulator('Rate Limiting', () => 
    testAPIEndpoint('/api/test/simulate/rate-limiting')
  );
  
  await testSimulator('Cache Invalidation', () => 
    testAPIEndpoint('/api/test/simulate/cache-invalidation')
  );
  
  await testSimulator('Large Dataset Query', () => 
    testAPIEndpoint('/api/test/simulate/large-dataset-query')
  );
  
  await testSimulator('Corrupted Customer Data', () => 
    testAPIEndpoint('/api/test/simulate/corrupted-customer-data')
  );
  
  await testSimulator('Missing Required Fields', () => 
    testAPIEndpoint('/api/test/simulate/missing-required-fields')
  );
  
  await testSimulator('Quickbase Data Change', () => 
    testAPIEndpoint('/api/test/simulate/quickbase-data-change')
  );

  console.log('Testing Resolver Endpoints...');
  await testSimulator('Latest Message Resolver', () => 
    testResolverEndpoint('/api/test/resolve/latest-message')
  );
  
  await testSimulator('Latest Call Resolver', () => 
    testResolverEndpoint('/api/test/resolve/latest-call')
  );
  
  await testSimulator('Latest Task Resolver', () => 
    testResolverEndpoint('/api/test/resolve/latest-task')
  );
  
  await testSimulator('Latest Worker Resolver', () => 
    testResolverEndpoint('/api/test/resolve/latest-worker')
  );

  console.log('🎉 Simulation System Test Complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Set TEST_MODE=true in your environment');
  console.log('3. Run this test: node test-simulators.js');
  console.log('4. Check that Socket.io events are being emitted in your browser console');
}

// Check if we're running this script directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testSimulator, testAPIEndpoint, testResolverEndpoint };
