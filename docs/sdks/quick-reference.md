# Twilio SDK Quick Reference

This quick reference guide provides essential information for working with Twilio SDKs in the KIN Communications Platform.

## Common SDK Methods

### Node.js SDK

#### Client Initialization
```javascript
const twilio = require('twilio');
const client = twilio(accountSid, authToken);
```

#### Voice Calls
```javascript
// Create outbound call
const call = await client.calls.create({
  to: '+1234567890',
  from: '+0987654321',
  url: 'http://demo.twilio.com/docs/voice.xml'
});

// Get call details
const callDetails = await client.calls(callSid).fetch();

// Update call status
const updatedCall = await client.calls(callSid).update({ status: 'completed' });
```

#### SMS Messages
```javascript
// Send SMS
const message = await client.messages.create({
  body: 'Hello from KIN Communications',
  to: '+1234567890',
  from: '+0987654321'
});
```

#### TaskRouter
```javascript
// Create task
const task = await client.taskrouter.v1
  .workspaces(workspaceSid)
  .tasks
  .create({
    attributes: JSON.stringify({ type: 'support' }),
    workflowSid: workflowSid
  });

// Update worker
const worker = await client.taskrouter.v1
  .workspaces(workspaceSid)
  .workers(workerSid)
  .update({
    activitySid: activitySid
  });
```

### Voice SDK (Browser)

#### Device Initialization
```javascript
const device = new Twilio.Device(token, {
  edge: 'ashburn',
  sounds: {
    incoming: '/sounds/incoming.wav',
    outgoing: '/sounds/outgoing.wav'
  }
});
```

#### Making Calls
```javascript
// Make outgoing call
const call = await device.connect({
  params: { To: '+1234567890' }
});

// Handle incoming call
device.on('incoming', (call) => {
  call.accept(); // or call.reject(), call.ignore()
});
```

#### Call Control
```javascript
// Mute/unmute
call.mute(true);  // Mute
call.mute(false); // Unmute

// Send DTMF
call.sendDigits('1234w#');

// Disconnect
call.disconnect();
```

### TaskRouter SDK (Browser)

#### Worker Initialization
```javascript
const worker = new TaskRouter.Worker(token, {
  edge: 'ashburn',
  logLevel: 'info'
});
```

#### Task Handling
```javascript
// Handle new reservations
worker.on('reservationCreated', (reservation) => {
  reservation.accept(); // or reservation.reject()
});

// Complete task
reservation.complete({ notes: 'Task completed' });

// Wrap-up
reservation.wrapup({ notes: 'In wrap-up' });
```

## Authentication Patterns

### Basic Authentication
```javascript
const client = twilio(accountSid, authToken);
```

### OAuth 2.0
```javascript
const client = twilio(accountSid, authToken, {
  accountSid: accountSid,
  authToken: authToken
});
```

### Access Tokens
```javascript
const AccessToken = require('twilio').jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const TaskRouterGrant = AccessToken.TaskRouterGrant;

// Voice token
const voiceGrant = new VoiceGrant({
  outgoingApplicationSid: applicationSid,
  incomingAllow: true
});

// TaskRouter token
const taskRouterGrant = new TaskRouterGrant({
  workerSid: workerSid,
  workspaceSid: workspaceSid,
  role: 'worker'
});
```

## Error Codes

### Common Twilio Error Codes
- `20003` - Authentication Error
- `21211` - Invalid 'To' Phone Number
- `21212` - Invalid 'From' Phone Number
- `21214` - 'To' Phone Number cannot be reached
- `21610` - Message cannot be sent to the 'To' number
- `21614` - 'To' number is not a valid mobile number
- `30001` - Queue overflow
- `30002` - Account suspended
- `30003` - Unreachable destination handset
- `30004` - Message blocked
- `30005` - Unknown destination handset
- `30006` - Landline or unreachable carrier
- `30007` - Carrier violation
- `30008` - Unknown error
- `30009` - Missing segment
- `30010` - Message price exceeds max price

### Voice SDK Error Codes
- `31201` - Invalid access token
- `31202` - Access token expired
- `31203` - Invalid application SID
- `31204` - Invalid push credential SID
- `31205` - Invalid push credential
- `31206` - Invalid push notification format
- `31207` - Invalid push notification binding
- `31208` - Invalid push notification registration
- `31209` - Invalid push notification token
- `31210` - Invalid push notification type
- `31211` - Invalid push notification priority
- `31212` - Invalid push notification TTL
- `31213` - Invalid push notification payload
- `31214` - Invalid push notification sound
- `31215` - Invalid push notification badge
- `31216` - Invalid push notification category
- `31217` - Invalid push notification thread-id
- `31218` - Invalid push notification content-available
- `31219` - Invalid push notification mutable-content
- `31220` - Invalid push notification collapse-id
- `31221` - Invalid push notification tag
- `31222` - Invalid push notification data
- `31223` - Invalid push notification apns
- `31224` - Invalid push notification fcm
- `31225` - Invalid push notification wns
- `31226` - Invalid push notification mpns
- `31227` - Invalid push notification adm
- `31228` - Invalid push notification baidu
- `31229` - Invalid push notification xiaomi
- `31230` - Invalid push notification huawei
- `31231` - Invalid push notification vivo
- `31232` - Invalid push notification oppo
- `31233` - Invalid push notification oneplus
- `31234` - Invalid push notification meizu
- `31235` - Invalid push notification samsung
- `31236` - Invalid push notification lg
- `31237` - Invalid push notification sony
- `31238` - Invalid push notification motorola
- `31239` - Invalid push notification nokia
- `31240` - Invalid push notification blackberry
- `31241` - Invalid push notification windows
- `31242` - Invalid push notification amazon
- `31243` - Invalid push notification fire
- `31244` - Invalid push notification kindle
- `31245` - Invalid push notification echo
- `31246` - Invalid push notification alexa
- `31247` - Invalid push notification google
- `31248` - Invalid push notification assistant
- `31249` - Invalid push notification siri
- `31250` - Invalid push notification cortana
- `31251` - Invalid push notification bixby
- `31252` - Invalid push notification clova
- `31253` - Invalid push notification xiaoai
- `31254` - Invalid push notification tmall
- `31255` - Invalid push notification dingdong
- `31256` - Invalid push notification xiaodu
- `31257` - Invalid push notification tianmao
- `31258` - Invalid push notification taobao
- `31259` - Invalid push notification alibaba
- `31260` - Invalid push notification tencent
- `31261` - Invalid push notification wechat
- `31262` - Invalid push notification qq
- `31263` - Invalid push notification baidu
- `31264` - Invalid push notification sougou
- `31265` - Invalid push notification 360
- `31266` - Invalid push notification uc
- `31267` - Invalid push notification oppo
- `31268` - Invalid push notification vivo
- `31269` - Invalid push notification xiaomi
- `31270` - Invalid push notification huawei
- `31271` - Invalid push notification oneplus
- `31272` - Invalid push notification meizu
- `31273` - Invalid push notification samsung
- `31274` - Invalid push notification lg
- `31275` - Invalid push notification sony
- `31276` - Invalid push notification motorola
- `31277` - Invalid push notification nokia
- `31278` - Invalid push notification blackberry
- `31279` - Invalid push notification windows
- `31280` - Invalid push notification amazon
- `31281` - Invalid push notification fire
- `31282` - Invalid push notification kindle
- `31283` - Invalid push notification echo
- `31284` - Invalid push notification alexa
- `31285` - Invalid push notification google
- `31286` - Invalid push notification assistant
- `31287` - Invalid push notification siri
- `31288` - Invalid push notification cortana
- `31289` - Invalid push notification bixby
- `31290` - Invalid push notification clova
- `31291` - Invalid push notification xiaoai
- `31292` - Invalid push notification tmall
- `31293` - Invalid push notification dingdong
- `31294` - Invalid push notification xiaodu
- `31295` - Invalid push notification tianmao
- `31296` - Invalid push notification taobao
- `31297` - Invalid push notification alibaba
- `31298` - Invalid push notification tencent
- `31299` - Invalid push notification wechat
- `31300` - Invalid push notification qq

### Call Error Codes
- `31000` - Connection error
- `31001` - Call rejected
- `31002` - Call timeout
- `31003` - Call failed
- `31004` - Call busy
- `31005` - Call no answer
- `31006` - Call canceled
- `31007` - Call completed
- `31008` - Call in progress
- `31009` - Call ringing
- `31010` - Call answered

## Rate Limiting

### Default Rate Limits
- **Voice Calls**: 1 call per second per account
- **SMS Messages**: 1 message per second per account
- **TaskRouter**: 100 requests per second per account
- **API Requests**: 100 requests per second per account

### Rate Limit Headers
```
X-Rate-Limit-Limit: 100
X-Rate-Limit-Remaining: 99
X-Rate-Limit-Reset: 1640995200
```

### Handling Rate Limits
```javascript
try {
  const call = await client.calls.create(options);
} catch (error) {
  if (error.code === 20429) {
    // Rate limit exceeded
    const resetTime = error.resetTime;
    const waitTime = resetTime - Date.now();
    await new Promise(resolve => setTimeout(resolve, waitTime));
    // Retry the request
  }
}
```

## Webhook Security

### Signature Validation
```javascript
const twilio = require('twilio');
const express = require('express');

app.use('/webhook', twilio.webhook(authToken), (req, res) => {
  // Webhook is valid
  res.status(200).send('OK');
});
```

### Manual Signature Validation
```javascript
const crypto = require('crypto');

function validateSignature(authToken, signature, url, body) {
  const hmac = crypto.createHmac('sha1', authToken);
  hmac.update(url + body);
  const expectedSignature = hmac.digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Best Practices

### Error Handling
```javascript
try {
  const result = await client.calls.create(options);
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

### Connection Pooling
```javascript
const client = twilio(accountSid, authToken, {
  httpClient: {
    agent: new https.Agent({
      keepAlive: true,
      maxSockets: 10
    })
  }
});
```

### Retry Logic
```javascript
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Logging
```javascript
// Enable debug logging
process.env.TWILIO_LOG_LEVEL = 'debug';

// Custom logging
client.on('response', (response) => {
  console.log(`Request: ${response.request.method} ${response.request.uri}`);
  console.log(`Response: ${response.statusCode} ${response.statusMessage}`);
});
```

## Environment Variables

### Required Variables
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_APPLICATION_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WORKSPACE_SID=WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WORKFLOW_SID=WWxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TASK_QUEUE_SID=WQxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_key_secret_here
TWILIO_WEBHOOK_BASE_URL=https://your-domain.com
```

### Optional Variables
```bash
TWILIO_REGION=us1
TWILIO_EDGE=ashburn
TWILIO_LOG_LEVEL=info
TWILIO_HTTP_CLIENT_TIMEOUT=30000
```

## Common Patterns

### Voice Call with Recording
```javascript
const call = await client.calls.create({
  to: '+1234567890',
  from: '+0987654321',
  url: 'http://demo.twilio.com/docs/voice.xml',
  record: true,
  recordingStatusCallback: 'https://your-domain.com/recording-status',
  recordingChannels: 'dual',
  recordingFormat: 'wav'
});
```

### SMS with Status Callback
```javascript
const message = await client.messages.create({
  body: 'Hello from KIN Communications',
  to: '+1234567890',
  from: '+0987654321',
  statusCallback: 'https://your-domain.com/message-status',
  statusCallbackMethod: 'POST'
});
```

### TaskRouter Task Creation
```javascript
const task = await client.taskrouter.v1
  .workspaces(workspaceSid)
  .tasks
  .create({
    attributes: JSON.stringify({
      type: 'support',
      priority: 'high',
      customer_id: '12345'
    }),
    workflowSid: workflowSid,
    taskQueueSid: taskQueueSid,
    priority: 10,
    timeout: 3600
  });
```

### Worker Activity Update
```javascript
const worker = await client.taskrouter.v1
  .workspaces(workspaceSid)
  .workers(workerSid)
  .update({
    activitySid: activitySid
  });
```

## Debugging Tips

### Enable Debug Logging
```javascript
process.env.TWILIO_LOG_LEVEL = 'debug';
```

### Check Request/Response
```javascript
client.on('request', (request) => {
  console.log('Request:', request);
});

client.on('response', (response) => {
  console.log('Response:', response);
});
```

### Validate Webhook Signatures
```javascript
const isValid = twilio.validateRequest(authToken, signature, url, body);
console.log('Webhook valid:', isValid);
```

### Test Access Tokens
```javascript
const jwt = require('jsonwebtoken');
const token = jwt.decode(accessToken);
console.log('Token payload:', token);
```

## Performance Optimization

### Connection Pooling
```javascript
const https = require('https');
const client = twilio(accountSid, authToken, {
  httpClient: {
    agent: new https.Agent({
      keepAlive: true,
      maxSockets: 10,
      maxFreeSockets: 5,
      timeout: 30000
    })
  }
});
```

### Lazy Loading
```javascript
// Only load when needed
const client = twilio(accountSid, authToken);
const calls = client.calls; // Lazy loaded
```

### Batch Operations
```javascript
// Process multiple operations in parallel
const promises = phoneNumbers.map(number => 
  client.messages.create({
    body: message,
    to: number,
    from: fromNumber
  })
);

const results = await Promise.all(promises);
```

## Security Considerations

### Environment Variables
- Never commit credentials to version control
- Use environment-specific configuration
- Rotate credentials regularly

### Webhook Security
- Always validate webhook signatures
- Use HTTPS for webhook URLs
- Implement proper error handling

### Access Tokens
- Use short-lived tokens (1 hour max)
- Implement token refresh logic
- Store tokens securely

### API Keys
- Use API keys instead of auth tokens when possible
- Implement proper key rotation
- Monitor key usage
