# Phase 3: Voice Calling Integration Guide

This guide provides comprehensive instructions for implementing voice calling functionality in the KIN Communications Platform using Twilio's Voice SDK and Node.js SDK.

## Overview

Phase 3 focuses on implementing core voice calling capabilities including:
- Outbound call creation and management
- Browser-based calling interface
- Call recording and transcription
- Webhook handling for call events
- Real-time call status updates

## Prerequisites

- Twilio Account with Voice capabilities enabled
- Node.js 16+ and npm
- Modern web browser with WebRTC support
- HTTPS-enabled web server (required for Voice SDK)

## Required Environment Variables

```bash
# Twilio Account Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Voice SDK Configuration
TWILIO_APPLICATION_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Keys for Access Tokens
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_key_secret_here

# Webhook URLs
TWILIO_WEBHOOK_BASE_URL=https://your-domain.com
TWILIO_VOICE_WEBHOOK_URL=https://your-domain.com/voice
TWILIO_STATUS_WEBHOOK_URL=https://your-domain.com/status
TWILIO_RECORDING_WEBHOOK_URL=https://your-domain.com/recording
```

## Installation

### Server-side Dependencies
```bash
npm install twilio express body-parser cors dotenv
npm install --save-dev @types/express @types/node typescript
```

### Client-side Dependencies
```bash
npm install @twilio/voice-sdk
```

## Server-side Implementation

### 1. Voice Service Setup

Create `src/services/voiceService.ts`:

```typescript
import twilio from 'twilio';
import { VoiceCallingService } from '../templates/voice-calling-setup';

export class VoiceService {
  private voiceCallingService: VoiceCallingService;

  constructor() {
    this.voiceCallingService = new VoiceCallingService();
  }

  /**
   * Create outbound call
   */
  async createCall(to: string, from: string, options: any = {}) {
    return await this.voiceCallingService.createOutboundCall({
      to,
      from,
      url: options.twimlUrl || `${process.env.TWILIO_WEBHOOK_BASE_URL}/voice/twiml`,
      record: options.record || false,
      recordingStatusCallback: options.record ? 
        `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/recording-status` : undefined,
      statusCallback: `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed', 'failed']
    });
  }

  /**
   * Generate access token for Voice SDK
   */
  generateAccessToken(identity: string) {
    return this.voiceCallingService.generateVoiceToken(identity);
  }

  /**
   * Get call details
   */
  async getCallDetails(callSid: string) {
    return await this.voiceCallingService.getCallDetails(callSid);
  }

  /**
   * Hangup call
   */
  async hangupCall(callSid: string) {
    return await this.voiceCallingService.hangupCall(callSid);
  }
}
```

### 2. API Routes

Create `src/routes/voice.ts`:

```typescript
import express from 'express';
import { VoiceService } from '../services/voiceService';
import { VoiceWebhookHandlers } from '../templates/webhook-handlers';

const router = express.Router();
const voiceService = new VoiceService();

// Generate access token for Voice SDK
router.post('/token', async (req, res) => {
  try {
    const { identity } = req.body;
    if (!identity) {
      return res.status(400).json({ success: false, error: 'Identity is required' });
    }

    const token = voiceService.generateAccessToken(identity);
    res.json({ success: true, token });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create outbound call
router.post('/calls', async (req, res) => {
  try {
    const { to, from, options } = req.body;
    
    if (!to || !from) {
      return res.status(400).json({ success: false, error: 'To and From are required' });
    }

    const result = await voiceService.createCall(to, from, options);
    res.json(result);
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get call details
router.get('/calls/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;
    const result = await voiceService.getCallDetails(callSid);
    res.json(result);
  } catch (error) {
    console.error('Error fetching call details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Hangup call
router.post('/calls/:callSid/hangup', async (req, res) => {
  try {
    const { callSid } = req.params;
    const result = await voiceService.hangupCall(callSid);
    res.json(result);
  } catch (error) {
    console.error('Error hanging up call:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// TwiML endpoint for outbound calls
router.post('/twiml', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Customize TwiML based on your needs
  twiml.say('Hello! This is a call from KIN Communications Platform.');
  twiml.pause({ length: 1 });
  twiml.say('How can I help you today?');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Webhook endpoints
router.post('/webhooks/call-status', VoiceWebhookHandlers.handleCallStatus);
router.post('/webhooks/recording-status', VoiceWebhookHandlers.handleRecordingStatus);

export default router;
```

### 3. Webhook Security

Create `src/middleware/webhookSecurity.ts`:

```typescript
import { WebhookMiddleware } from '../templates/webhook-handlers';

export const webhookMiddleware = new WebhookMiddleware();

// Middleware for Twilio webhook signature validation
export const validateTwilioWebhook = (url: string) => {
  return webhookMiddleware.validateTwilioWebhook(url);
};

// Middleware for raw body parsing
export const parseRawBody = webhookMiddleware.parseRawBody();
```

## Client-side Implementation

### 1. Voice Device Manager

Create `src/components/VoiceDevice.tsx`:

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { VoiceDeviceManager } from '../templates/voice-calling-setup';

interface VoiceDeviceProps {
  identity: string;
  onCallStatusChange?: (status: string) => void;
  onIncomingCall?: (call: any) => void;
}

export const VoiceDevice: React.FC<VoiceDeviceProps> = ({
  identity,
  onCallStatusChange,
  onIncomingCall
}) => {
  const [deviceManager, setDeviceManager] = useState<VoiceDeviceManager | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [callStatus, setCallStatus] = useState<string>('idle');

  useEffect(() => {
    initializeDevice();
    
    return () => {
      if (deviceManager) {
        deviceManager.destroy();
      }
    };
  }, [identity]);

  const initializeDevice = async () => {
    try {
      // Get access token from server
      const response = await fetch('/api/voice/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identity })
      });

      const data = await response.json();
      
      if (data.success) {
        const manager = new VoiceDeviceManager(data.token, {
          edge: 'ashburn',
          sounds: {
            incoming: '/sounds/incoming.wav',
            outgoing: '/sounds/outgoing.wav',
            disconnect: '/sounds/disconnect.wav'
          }
        });

        // Setup event listeners
        manager.on('ready', () => {
          setIsReady(true);
          setCallStatus('ready');
          onCallStatusChange?.('ready');
        });

        manager.on('error', (error) => {
          console.error('Device error:', error);
          setCallStatus('error');
          onCallStatusChange?.('error');
        });

        manager.on('incoming', (call) => {
          setCurrentCall(call);
          setCallStatus('incoming');
          onCallStatusChange?.('incoming');
          onIncomingCall?.(call);
        });

        setDeviceManager(manager);
      }
    } catch (error) {
      console.error('Error initializing voice device:', error);
    }
  };

  const makeCall = async (to: string) => {
    if (!deviceManager || !isReady) {
      console.error('Device not ready');
      return;
    }

    try {
      const result = await deviceManager.makeCall(to);
      if (result.success) {
        setCurrentCall(result.call);
        setCallStatus('outgoing');
        onCallStatusChange?.('outgoing');
      }
    } catch (error) {
      console.error('Error making call:', error);
    }
  };

  const answerCall = () => {
    if (currentCall && callStatus === 'incoming') {
      currentCall.accept();
      setCallStatus('connected');
      onCallStatusChange?.('connected');
    }
  };

  const rejectCall = () => {
    if (currentCall && callStatus === 'incoming') {
      currentCall.reject();
      setCurrentCall(null);
      setCallStatus('ready');
      onCallStatusChange?.('ready');
    }
  };

  const hangupCall = () => {
    if (currentCall) {
      currentCall.disconnect();
      setCurrentCall(null);
      setCallStatus('ready');
      onCallStatusChange?.('ready');
    }
  };

  return {
    isReady,
    callStatus,
    currentCall,
    makeCall,
    answerCall,
    rejectCall,
    hangupCall
  };
};
```

### 2. Call Interface Component

Create `src/components/CallInterface.tsx`:

```typescript
import React, { useState } from 'react';
import { VoiceDevice } from './VoiceDevice';

interface CallInterfaceProps {
  identity: string;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({ identity }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('idle');
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const {
    isReady,
    callStatus: deviceStatus,
    currentCall,
    makeCall,
    answerCall,
    rejectCall,
    hangupCall
  } = VoiceDevice({
    identity,
    onCallStatusChange: setCallStatus,
    onIncomingCall: setIncomingCall
  });

  const handleMakeCall = async () => {
    if (phoneNumber && isReady) {
      await makeCall(phoneNumber);
    }
  };

  const handleAnswerCall = () => {
    answerCall();
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    rejectCall();
    setIncomingCall(null);
  };

  const handleHangupCall = () => {
    hangupCall();
  };

  return (
    <div className="call-interface">
      <div className="status">
        <p>Status: {callStatus}</p>
        <p>Device Ready: {isReady ? 'Yes' : 'No'}</p>
      </div>

      {incomingCall && (
        <div className="incoming-call">
          <h3>Incoming Call</h3>
          <p>From: {incomingCall.from}</p>
          <button onClick={handleAnswerCall}>Answer</button>
          <button onClick={handleRejectCall}>Reject</button>
        </div>
      )}

      {callStatus === 'ready' && (
        <div className="make-call">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
          />
          <button onClick={handleMakeCall} disabled={!phoneNumber}>
            Make Call
          </button>
        </div>
      )}

      {(callStatus === 'outgoing' || callStatus === 'connected') && (
        <div className="active-call">
          <p>Call Status: {callStatus}</p>
          {currentCall && (
            <div>
              <p>To: {currentCall.to}</p>
              <p>From: {currentCall.from}</p>
            </div>
          )}
          <button onClick={handleHangupCall}>Hangup</button>
        </div>
      )}
    </div>
  );
};
```

## TwiML Configuration

### 1. Basic TwiML Response

Create `src/twiml/basicResponse.ts`:

```typescript
import twilio from 'twilio';

export const createBasicTwiML = (message: string = 'Hello from KIN Communications Platform') => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({ voice: 'alice' }, message);
  twiml.pause({ length: 1 });
  twiml.say({ voice: 'alice' }, 'How can I help you today?');
  
  return twiml.toString();
};
```

### 2. Advanced TwiML with Gather

Create `src/twiml/advancedResponse.ts`:

```typescript
import twilio from 'twilio';

export const createAdvancedTwiML = () => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  const gather = twiml.gather({
    numDigits: 1,
    action: '/voice/handle-input',
    method: 'POST'
  });
  
  gather.say({ voice: 'alice' }, 'Press 1 for sales, 2 for support, or 3 to speak with an operator.');
  
  // Fallback if no input
  twiml.say({ voice: 'alice' }, 'Sorry, I didn\'t receive any input. Goodbye!');
  twiml.hangup();
  
  return twiml.toString();
};
```

## Call Recording Setup

### 1. Enable Recording

```typescript
// In your call creation
const result = await voiceService.createCall(to, from, {
  record: true,
  recordingStatusCallback: `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/recording-status`,
  recordingChannels: 'dual', // Record both sides
  recordingFormat: 'wav'
});
```

### 2. Recording Webhook Handler

```typescript
// In your webhook handlers
export const handleRecordingStatus = async (req: any, res: any) => {
  const { CallSid, RecordingSid, RecordingStatus, RecordingUrl } = req.body;
  
  if (RecordingStatus === 'completed') {
    // Download and store recording
    await downloadRecording(RecordingSid, RecordingUrl);
    
    // Update database with recording details
    await updateCallRecording(CallSid, {
      recordingSid: RecordingSid,
      recordingUrl: RecordingUrl,
      status: RecordingStatus
    });
  }
  
  res.status(200).send('OK');
};
```

## Error Handling

### 1. Common Error Scenarios

```typescript
// Device initialization errors
device.on('error', (error) => {
  switch (error.code) {
    case 31201:
      console.error('Invalid access token');
      break;
    case 31202:
      console.error('Access token expired');
      break;
    case 31203:
      console.error('Invalid application SID');
      break;
    default:
      console.error('Device error:', error);
  }
});

// Call errors
call.on('error', (error) => {
  switch (error.code) {
    case 31000:
      console.error('Connection error');
      break;
    case 31001:
      console.error('Call rejected');
      break;
    case 31002:
      console.error('Call timeout');
      break;
    default:
      console.error('Call error:', error);
  }
});
```

### 2. Retry Logic

```typescript
const retryCall = async (to: string, maxRetries: number = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await makeCall(to);
      if (result.success) {
        return result;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## Testing

### 1. Unit Tests

```typescript
// voiceService.test.ts
import { VoiceService } from '../services/voiceService';

describe('VoiceService', () => {
  let voiceService: VoiceService;

  beforeEach(() => {
    voiceService = new VoiceService();
  });

  test('should generate access token', () => {
    const token = voiceService.generateAccessToken('test-user');
    expect(token).toBeDefined();
  });

  test('should create outbound call', async () => {
    const result = await voiceService.createCall('+1234567890', '+0987654321');
    expect(result.success).toBe(true);
  });
});
```

### 2. Integration Tests

```typescript
// voiceIntegration.test.ts
import request from 'supertest';
import app from '../app';

describe('Voice API Integration', () => {
  test('POST /api/voice/token', async () => {
    const response = await request(app)
      .post('/api/voice/token')
      .send({ identity: 'test-user' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
  });

  test('POST /api/voice/calls', async () => {
    const response = await request(app)
      .post('/api/voice/calls')
      .send({
        to: '+1234567890',
        from: '+0987654321'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.callSid).toBeDefined();
  });
});
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] HTTPS enabled for webhook URLs
- [ ] Twilio webhook URLs updated in console
- [ ] Voice SDK properly initialized
- [ ] Error handling implemented
- [ ] Call recording configured (if needed)
- [ ] Webhook signature validation enabled
- [ ] Logging and monitoring setup
- [ ] Rate limiting implemented
- [ ] Security headers configured

## Troubleshooting

### Common Issues

1. **Device not connecting**: Check access token and application SID
2. **Calls not working**: Verify webhook URLs are accessible
3. **Recording not working**: Check recording webhook configuration
4. **Audio issues**: Verify browser permissions and WebRTC support

### Debug Tools

- Twilio Console for call logs
- Browser developer tools for client-side debugging
- Server logs for webhook processing
- Network tab for API calls

## Next Steps

After completing Phase 3, you'll be ready to move on to:
- Phase 4: SMS & Messaging
- Phase 5: Video Conferencing
- Phase 6: Advanced Voice Features
- Phase 7: TaskRouter Integration

Each phase builds upon the previous one, so ensure Phase 3 is fully tested and stable before proceeding.
