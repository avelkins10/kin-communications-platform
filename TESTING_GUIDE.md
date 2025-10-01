# Testing Guide for Simulation System

This guide explains how to test the comprehensive simulation system we just built.

## 🎯 What We Built

We created a complete test simulation system that allows E2E tests to simulate real-world scenarios without needing actual external services. The system includes:

- **25+ new simulator functions** in `qa-helpers.ts`
- **25+ corresponding API routes** under `/api/test/simulate/`
- **Socket.io event emission** for real-time UI updates
- **Resolver endpoints** for ID/SID resolution
- **Normalized webhook security tests** with consistent patterns

## 🧪 How to Test the System

### 1. **Quick API Tests (No Server Required)**

Test the helper patterns and webhook security without starting a server:

```bash
# Test webhook security patterns
node test-webhook-security.js

# Test QA helpers (requires server)
node test-qa-helpers.js

# Test all API endpoints (requires server)
node test-simulators.js
```

### 2. **Full System Tests (Requires Server)**

Start your development server and test the complete system:

```bash
# Start the development server
npm run dev

# In another terminal, set TEST_MODE and run tests
export TEST_MODE=true
node test-simulators.js
```

### 3. **E2E Tests (Full Integration)**

Run the actual E2E tests that use our new simulators:

```bash
# Set TEST_MODE environment variable
export TEST_MODE=true

# Run specific E2E tests
npm run e2e -- --grep "realtime-features"
npm run e2e -- --grep "webhook-security"
npm run e2e -- --grep "quickbase-integration"
```

## 🔍 What Each Test Verifies

### **API Endpoint Tests**
- ✅ All 25+ simulation endpoints are accessible
- ✅ Endpoints return proper JSON responses
- ✅ Endpoints are protected by TEST_MODE
- ✅ Socket.io events are emitted correctly

### **Helper Function Tests**
- ✅ Legacy signatures work (backward compatibility)
- ✅ New object signatures work
- ✅ Default values are applied correctly
- ✅ HTTP requests are made to correct endpoints
- ✅ JSON responses are parsed correctly

### **Webhook Security Tests**
- ✅ Form data is created correctly from payloads
- ✅ Signatures are generated properly
- ✅ Malicious payloads are handled
- ✅ Invalid signature patterns work for negative testing
- ✅ JSON content type patterns work for malformed payload testing

## 🎮 Interactive Testing

### **Test Socket.io Events in Browser**

1. Start your dev server: `npm run dev`
2. Open browser console on your app
3. Run a simulator: `node test-simulators.js`
4. Watch for Socket.io events in the console:

```javascript
// You should see events like:
// socket:connection-failure
// queue:update
// call:status-change
// quickbase:data-change
```

### **Test Real-Time UI Updates**

1. Open your app in multiple browser tabs
2. Run simulators that affect UI (queue updates, call status, etc.)
3. Verify that all tabs update in real-time
4. Check that UI selectors show expected values

## 🐛 Troubleshooting

### **Common Issues**

**"Endpoint not available (TEST_MODE not enabled)"**
```bash
export TEST_MODE=true
# or
set TEST_MODE=true  # Windows
```

**"Failed to simulate X: 404"**
- Make sure your dev server is running
- Check that the API route exists in `src/app/api/test/simulate/`

**"Socket.io events not appearing"**
- Check browser console for errors
- Verify Socket.io server is running
- Check that events are being emitted in the API routes

**"E2E tests failing"**
- Check database schema matches test expectations
- Verify TEST_MODE is set in test environment
- Check that all required environment variables are set

### **Debug Mode**

Run tests with verbose output:

```bash
# Enable debug logging
export DEBUG=true
node test-simulators.js
```

## 📊 Expected Results

### **Successful Test Run Should Show:**

```
🧪 Testing Simulation System
============================
Base URL: http://localhost:3000
Test Mode: true

Testing Socket-related Simulators...
✅ Socket Connection Failure - PASSED
✅ Socket Disconnection - PASSED
✅ Socket Reconnection - PASSED
...

Testing Queue-related Simulators...
✅ Queue Overflow - PASSED
✅ Queue Update (new signature) - PASSED
...

🎉 Simulation System Test Complete!
```

### **Browser Console Should Show:**

```
Socket.io connected
Received event: queue:update {queueId: "support_queue", waitingCount: 5, ...}
Received event: socket:connection-failure {timestamp: "...", error: "Connection failed"}
```

## 🚀 Next Steps

1. **Run the tests** using the commands above
2. **Verify Socket.io events** are being emitted
3. **Check UI updates** happen in real-time
4. **Run E2E tests** to ensure full integration works
5. **Add new simulators** as needed for additional test scenarios

## 📝 Adding New Simulators

To add a new simulator:

1. **Add helper function** to `tests/utils/qa-helpers.ts`
2. **Create API route** in `src/app/api/test/simulate/[name]/route.ts`
3. **Emit Socket.io event** in the API route
4. **Test the new simulator** using the test scripts above

The system is designed to be easily extensible for new simulation scenarios!
