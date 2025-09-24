# Twilio Node.js SDK Documentation

## Overview
The Twilio Node.js SDK provides server-side integration for Twilio services including voice calling, messaging, and TaskRouter functionality.

## Installation

```bash
npm install twilio
# or
yarn add twilio
```

## Supported Node.js Versions
- Node.js 14+
- Node.js 16+
- Node.js 18+
- Node.js 20+
- Node.js LTS (22)

## Basic Setup

### Environment Variables
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
```

### Client Initialization

**CommonJS:**
```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);
```

**ESM/ES6 Modules:**
```javascript
import twilio from 'twilio';
const client = twilio(accountSid, authToken);
```

**With Environment Variables:**
```javascript
const client = require('twilio')(); // Uses TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
```

## Key Features for KIN Platform

### 1. Voice Calling (Phase 3)
- Outbound call creation
- Call recording setup
- Webhook handling for call events
- Call control operations

### 2. TaskRouter Integration (Phase 7)
- Worker management
- Task routing operations
- Real-time event handling
- Workspace configuration

### 3. Webhook Security
- Request signature validation
- Secure webhook processing
- Express.js integration

## Error Handling

```javascript
const { RestException } = require('twilio');

try {
  const message = await client.messages.create({
    body: 'Hello from Node',
    to: '+12345678901',
    from: '+12345678901',
  });
  console.log(message);
} catch (error) {
  if (error instanceof RestException) {
    console.log(`Twilio Error ${error.code}: ${error.message}`);
    console.log(`Status: ${error.status}`);
    console.log(`More info: ${error.moreInfo}`);
  } else {
    console.error('Other error:', error);
  }
}
```

## Advanced Configuration

### Auto-Retry with Exponential Backoff
```javascript
const client = require('twilio')(accountSid, authToken, {
  autoRetry: true,
  maxRetries: 3,
});
```

### HTTP Agent Options
```javascript
const client = require('twilio')(accountSid, authToken, {
  timeout: 30000,
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 20,
  maxTotalSockets: 100,
  maxFreeSockets: 5,
  scheduling: "lifo",
});
```

### Region and Edge Configuration
```javascript
const client = require('twilio')(accountSid, authToken, {
  region: 'au1',
  edge: 'sydney',
});
```

### Debug Logging
```javascript
const client = require('twilio')(accountSid, authToken, {
  logLevel: 'debug',
});
```

## Webhook Validation

```javascript
const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');

const app = express();
const authToken = process.env.TWILIO_AUTH_TOKEN;

app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));

app.post('/webhook', twilio.webhook(authToken), (req, res) => {
  // Webhook is validated, process the request
  console.log('Valid webhook received:', req.body);
  res.status(200).send('OK');
});
```

## TypeScript Support

The SDK includes full TypeScript definitions. Import types as needed:

```typescript
import twilio from 'twilio';
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';

const client = twilio(accountSid, authToken);

const msgData: MessageListInstanceCreateOptions = {
  from: '+12345678901',
  to: '+12345678902',
  body: 'Hello from TypeScript',
};

const message = await client.messages.create(msgData);
```

## Best Practices

1. **Never expose credentials in frontend code** - Use environment variables
2. **Use webhook validation** for all incoming Twilio requests
3. **Handle errors appropriately** - 400-level errors are normal during API operation
4. **Use lazy loading** for faster startup times (enabled by default)
5. **Implement retry logic** for production applications
6. **Use TypeScript** for better type safety and development experience

## Common Use Cases

### Sending SMS
```javascript
const message = await client.messages.create({
  body: 'Hello from KIN Platform',
  to: '+12345678901',
  from: '+12345678902',
});
```

### Making Voice Calls
```javascript
const call = await client.calls.create({
  to: '+12345678901',
  from: '+12345678902',
  url: 'http://your-server.com/voice-webhook',
});
```

### Listing Resources
```javascript
// List all calls
const calls = await client.calls.list();

// List with pagination
const calls = await client.calls.list({
  limit: 20,
  pageSize: 10
});

// Stream calls (memory efficient)
client.calls.each((call) => {
  console.log(call.sid);
});
```

## Integration with KIN Platform

This SDK will be used primarily for:
- **Phase 3**: Voice calling infrastructure and webhook handling
- **Phase 7**: TaskRouter worker and task management
- **All Phases**: Secure webhook processing and API operations

## Documentation Links

- [Official Twilio Node.js Documentation](https://www.twilio.com/docs/libraries/node)
- [API Reference](https://www.twilio.com/docs/api)
- [Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)
