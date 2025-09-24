# Twilio Voice JavaScript SDK Documentation

## Overview
The Twilio Voice JavaScript SDK enables browser-based voice calling functionality for the KIN Communications Platform. This SDK provides the client-side interface for making and receiving voice calls directly from web browsers.

## Installation

```bash
npm install @twilio/voice-sdk
# or
yarn add @twilio/voice-sdk
```

## Browser Support
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Basic Setup

### Include the SDK
```html
<script src="https://sdk.twilio.com/js/client/releases/2.0.0/twilio.min.js"></script>
```

### Initialize Device
```javascript
const device = new Device(token, options);
```

## Key Components for KIN Platform

### 1. Device Management
The `Device` object represents a softphone that communicates with Twilio to facilitate inbound and outbound audio connections.

#### Device Instantiation
```javascript
// Basic instantiation
const device = new Device(token);

// With options
const device = new Device(token, {
  edge: 'ashburn',
  sounds: {
    incoming: 'path/to/incoming.mp3',
    outgoing: 'path/to/outgoing.mp3'
  }
});
```

#### Device Registration
```javascript
// Register to receive incoming calls
device.register();

// Listen for registration events
device.on('registered', () => {
  console.log('Device ready to receive calls');
});

device.on('error', (error) => {
  console.error('Device error:', error);
});
```

### 2. Call Management
The `Call` object represents individual voice calls and provides methods for call control.

#### Making Outgoing Calls
```javascript
const call = await device.connect({
  params: {
    To: '+1234567890',
    agent: 'John Doe',
    location: 'Office'
  }
});

// Listen for call events
call.on('accept', () => {
  console.log('Call connected');
});

call.on('disconnect', () => {
  console.log('Call ended');
});
```

#### Handling Incoming Calls
```javascript
device.on('incoming', (call) => {
  // Show incoming call UI
  showIncomingCallUI(call);
  
  // Accept the call
  call.accept();
  
  // Or reject the call
  // call.reject();
});
```

### 3. Call Controls
```javascript
// Mute/unmute
call.mute(true);  // Mute
call.mute(false); // Unmute

// Send DTMF tones
call.sendDigits('1234');

// Disconnect call
call.disconnect();
```

## Device Options

### Edge Configuration
```javascript
const device = new Device(token, {
  edge: 'ashburn', // Single edge
  // or
  edge: ['ashburn', 'sydney'] // Multiple edges with fallback
});
```

### Audio Configuration
```javascript
const device = new Device(token, {
  codecPreferences: ['opus', 'pcmu'],
  maxAverageBitrate: 32000,
  sounds: {
    incoming: 'custom-incoming.mp3',
    outgoing: 'custom-outgoing.mp3',
    disconnect: 'custom-disconnect.mp3'
  }
});
```

### Advanced Options
```javascript
const device = new Device(token, {
  allowIncomingWhileBusy: false,
  closeProtection: true,
  logLevel: 'debug',
  tokenRefreshMs: 10000
});
```

## Events

### Device Events
```javascript
device.on('registered', () => {
  // Device is ready to receive calls
});

device.on('unregistered', () => {
  // Device is no longer registered
});

device.on('incoming', (call) => {
  // Incoming call received
});

device.on('error', (error) => {
  // Device error occurred
});

device.on('tokenWillExpire', () => {
  // Token is about to expire, refresh it
  const newToken = await getNewToken();
  device.updateToken(newToken);
});
```

### Call Events
```javascript
call.on('accept', () => {
  // Call has been accepted
});

call.on('disconnect', () => {
  // Call has been disconnected
});

call.on('ringing', (hasEarlyMedia) => {
  // Call is ringing
});

call.on('mute', (isMuted) => {
  // Call mute status changed
});

call.on('volume', (inputVolume, outputVolume) => {
  // Volume levels updated
});

call.on('warning', (warningName, warningData) => {
  // Call quality warning
});

call.on('warning-cleared', (warningName) => {
  // Call quality warning cleared
});
```

## Error Handling

### Device Errors
```javascript
device.on('error', (error) => {
  console.error('Device Error:', error.code, error.message);
  
  switch(error.code) {
    case 31201:
      console.log('Invalid access token');
      break;
    case 31205:
      console.log('Access token expired');
      break;
    case 31207:
      console.log('Access token expired too far in the future');
      break;
    default:
      console.log('Unknown error:', error);
  }
});
```

### Call Errors
```javascript
call.on('error', (error) => {
  console.error('Call Error:', error.code, error.message);
});
```

## Token Management

### Token Refresh
```javascript
device.on('tokenWillExpire', async () => {
  try {
    const newToken = await fetchNewToken();
    device.updateToken(newToken);
  } catch (error) {
    console.error('Failed to refresh token:', error);
  }
});
```

### Token Validation
```javascript
// Check if device is supported
if (Device.isSupported) {
  const device = new Device(token);
} else {
  console.error('Browser not supported');
}
```

## Best Practices

### 1. User Gesture Requirements
```javascript
// Call device.register() in response to user interaction
document.getElementById('start-call-button').addEventListener('click', () => {
  device.register();
});
```

### 2. Call State Management
```javascript
let currentCall = null;

device.on('incoming', (call) => {
  if (currentCall) {
    call.reject();
    return;
  }
  currentCall = call;
});

device.on('connect', (call) => {
  currentCall = call;
});

call.on('disconnect', () => {
  currentCall = null;
});
```

### 3. Audio Device Management
```javascript
// Get available audio devices
const audioHelper = device.audio;
const inputDevices = await audioHelper.getInputDevices();
const outputDevices = await audioHelper.getOutputDevices();

// Set specific devices
await audioHelper.setInputDevice(inputDevices[0].deviceId);
await audioHelper.setOutputDevice(outputDevices[0].deviceId);
```

### 4. Call Quality Monitoring
```javascript
call.on('sample', (sample) => {
  // Monitor call quality metrics
  console.log('MOS Score:', sample.mos);
  console.log('Packet Loss:', sample.packetsLost);
  console.log('RTT:', sample.rtt);
});

call.on('warning', (warningName, warningData) => {
  // Handle quality warnings
  if (warningName === 'low-mos') {
    showQualityWarning('Poor call quality detected');
  }
});
```

## Integration with KIN Platform

### Phase 3 Implementation
This SDK will be used for:
- Browser-based voice calling interface
- Real-time call controls (mute, hold, transfer)
- Call quality monitoring and feedback
- Integration with contact management system

### Required Features
- Outbound call creation from contact records
- Incoming call handling and routing
- Call recording integration
- DTMF tone support for phone menus
- Call transfer and conference capabilities

## Security Considerations

### Token Security
- Never expose access tokens in client-side code
- Implement server-side token generation
- Use short-lived tokens with refresh mechanism
- Validate webhook signatures

### Webhook Security
```javascript
// Server-side webhook validation
const twilio = require('twilio');
const authToken = process.env.TWILIO_AUTH_TOKEN;

app.post('/webhook', twilio.webhook(authToken), (req, res) => {
  // Webhook is validated, process the request
  console.log('Valid webhook received:', req.body);
});
```

## Troubleshooting

### Common Issues
1. **Browser not supported**: Check `Device.isSupported`
2. **Audio not working**: Ensure user has granted microphone permissions
3. **Connection issues**: Check network connectivity and firewall settings
4. **Token errors**: Verify token generation and expiration

### Debug Mode
```javascript
const device = new Device(token, {
  logLevel: 'debug'
});
```

## Documentation Links

- [Official Voice SDK Documentation](https://www.twilio.com/docs/voice/sdks/javascript)
- [API Reference](https://twilio.github.io/twilio-voice.js)
- [Best Practices Guide](https://www.twilio.com/docs/voice/sdks/javascript/best-practices)
- [Error Codes Reference](https://www.twilio.com/docs/voice/sdks/error-codes)
