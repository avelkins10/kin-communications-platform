# Webhook Testing Guide

This guide covers comprehensive webhook testing for the KIN Communications Platform, including Twilio webhook integration, ngrok setup, and automated testing procedures.

## Table of Contents

- [Overview](#overview)
- [Setting Up ngrok](#setting-up-ngrok)
- [Twilio Webhook Configuration](#twilio-webhook-configuration)
- [Testing Different Webhook Types](#testing-different-webhook-types)
- [Webhook Signature Verification](#webhook-signature-verification)
- [Automated Webhook Testing](#automated-webhook-testing)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Webhooks are HTTP callbacks that allow Twilio to send real-time notifications to your application. The KIN Communications Platform handles several types of Twilio webhooks:

- **Voice Webhooks**: Call status updates, call completion
- **SMS Webhooks**: Message delivery status, incoming messages
- **Status Callbacks**: Detailed call and message status information
- **Recording Webhooks**: Recording completion and failure notifications
- **Transcription Webhooks**: Transcription completion notifications

## Setting Up ngrok

### Installation

```bash
# macOS
brew install ngrok

# Windows
choco install ngrok

# Linux
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin
```

### Authentication

1. Sign up for a free ngrok account at [ngrok.com](https://ngrok.com)
2. Get your authtoken from the dashboard
3. Configure ngrok:

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### Starting ngrok Tunnel

```bash
# Start tunnel on port 3000
ngrok http 3000

# Or use the provided script
pnpm webhook:tunnel
```

The script will:
- Start ngrok tunnel
- Extract the public HTTPS URL
- Display webhook URLs for Twilio configuration
- Keep the tunnel running

### ngrok Dashboard

Access the ngrok web interface at `http://localhost:4040` to:
- View request/response details
- Replay requests
- Inspect webhook payloads
- Debug connection issues

## Twilio Webhook Configuration

### 1. Configure Phone Number Webhooks

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to Phone Numbers → Manage → Active numbers
3. Click on your purchased number
4. Set webhook URLs:

```
Voice URL: https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice
SMS URL: https://your-ngrok-url.ngrok.io/api/webhooks/twilio/sms
Status Callback URL: https://your-ngrok-url.ngrok.io/api/webhooks/twilio/status
```

### 2. Configure Application Webhooks

For TwiML applications:

1. Go to Voice → TwiML → TwiML Apps
2. Create or edit your TwiML app
3. Set webhook URLs:

```
Voice URL: https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice
Status Callback URL: https://your-ngrok-url.ngrok.io/api/webhooks/twilio/status
```

### 3. Configure Recording Webhooks

1. Go to Voice → Recordings
2. Set webhook URL:

```
Recording Status Callback URL: https://your-ngrok-url.ngrok.io/api/webhooks/twilio/recording
```

## Testing Different Webhook Types

### Voice Webhook Testing

#### Incoming Call Webhook

```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: YOUR_SIGNATURE" \
  -d "CallSid=CA1234567890abcdef&From=%2B15551234567&To=%2B15551234568&CallStatus=ringing&Direction=inbound"
```

#### Call Completion Webhook

```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: YOUR_SIGNATURE" \
  -d "CallSid=CA1234567890abcdef&CallStatus=completed&Duration=120&RecordingUrl=https://api.twilio.com/recording.mp3"
```

#### Call Failure Webhook

```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: YOUR_SIGNATURE" \
  -d "CallSid=CA1234567890abcdef&CallStatus=failed&ErrorCode=11200&ErrorMessage=Invalid phone number"
```

### SMS Webhook Testing

#### Incoming SMS Webhook

```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: YOUR_SIGNATURE" \
  -d "MessageSid=SM1234567890abcdef&From=%2B15551234567&To=%2B15551234568&Body=Hello%20World&MessageStatus=received"
```

#### SMS Delivery Status Webhook

```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: YOUR_SIGNATURE" \
  -d "MessageSid=SM1234567890abcdef&MessageStatus=delivered&ErrorCode=0"
```

### Status Callback Testing

#### Call Status Callback

```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: YOUR_SIGNATURE" \
  -d "CallSid=CA1234567890abcdef&CallStatus=completed&Duration=120&From=%2B15551234567&To=%2B15551234568"
```

### Recording Webhook Testing

#### Recording Completion Webhook

```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/recording \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: YOUR_SIGNATURE" \
  -d "CallSid=CA1234567890abcdef&RecordingSid=RE1234567890abcdef&RecordingUrl=https://api.twilio.com/recording.mp3&RecordingDuration=120&RecordingStatus=completed"
```

#### Recording Failure Webhook

```bash
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/recording \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: YOUR_SIGNATURE" \
  -d "CallSid=CA1234567890abcdef&RecordingSid=RE1234567890abcdef&RecordingStatus=failed&ErrorCode=11200&ErrorMessage=Recording failed"
```

## Testing Secured Webhooks

All Twilio webhooks in the KIN Communications Platform now require valid Twilio signatures and implement idempotency checks. This section covers testing these security features.

### Understanding Twilio Signatures

Twilio signs all webhook requests with HMAC-SHA1 using your Auth Token. This ensures the webhook is actually from Twilio and prevents replay attacks.

### Signature Generation

```typescript
import crypto from 'crypto'

function generateTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string
): string {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('')

  // Create signature string
  const signatureString = url + sortedParams

  // Generate HMAC-SHA1 signature
  const signature = crypto
    .createHmac('sha1', authToken)
    .update(signatureString)
    .digest('base64')

  return signature
}
```

### Signature Verification

```typescript
import crypto from 'crypto'

function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  authToken: string,
  signature: string
): boolean {
  const expectedSignature = generateTwilioSignature(url, params, authToken)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
```

### Testing Signature Verification

```typescript
import { describe, it, expect } from 'vitest'
import { validateTwilioSignature } from '@/lib/twilio/signature'

describe('Twilio Signature Verification', () => {
  it('should validate correct signatures', () => {
    const url = 'https://example.com/webhook'
    const params = { CallSid: 'test-call-sid' }
    const authToken = 'test-auth-token'
    const signature = 'test-signature'

    expect(validateTwilioSignature(url, params, authToken, signature)).toBe(true)
  })

  it('should reject invalid signatures', () => {
    const url = 'https://example.com/webhook'
    const params = { CallSid: 'test-call-sid' }
    const authToken = 'test-auth-token'
    const signature = 'invalid-signature'

    expect(validateTwilioSignature(url, params, authToken, signature)).toBe(false)
  })
})
```

### Testing Idempotency

The platform automatically handles duplicate webhooks using the `WebhookLog` table. Test idempotency by sending the same webhook multiple times:

```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/webhooks/twilio/voice/route'

describe('Webhook Idempotency', () => {
  it('should handle duplicate webhooks gracefully', async () => {
    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      From: '+15551234567',
      To: '+15551234568',
      CallStatus: 'ringing'
    }

    // Send webhook first time
    const request1 = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'valid-signature'
      }
    })

    const response1 = await POST(request1)
    expect(response1.status).toBe(200)

    // Send same webhook again
    const request2 = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'valid-signature'
      }
    })

    const response2 = await POST(request2)
    expect(response2.status).toBe(200)
    
    // Should return early without processing
    const data2 = await response2.text()
    expect(data2).toBe('OK')
  })
})
```

### Testing User Assignment

Test that calls are properly assigned to users:

```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/webhooks/twilio/voice/route'

describe('Call User Assignment', () => {
  it('should assign call to project coordinator', async () => {
    // Mock contact with project coordinator
    const mockContact = {
      id: 'contact-123',
      projectCoordinatorId: 'user-456',
      phone: '+15551234567'
    }

    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      From: '+15551234567',
      To: '+15551234568',
      CallStatus: 'ringing'
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'valid-signature'
      }
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    // Verify call was assigned to coordinator
    const call = await prisma.call.findUnique({
      where: { twilioCallSid: 'CA1234567890abcdef' },
      include: { user: true }
    })

    expect(call?.userId).toBe('user-456')
  })

  it('should assign call to default employee when no coordinator', async () => {
    // Mock contact without project coordinator
    const mockContact = {
      id: 'contact-123',
      projectCoordinatorId: null,
      phone: '+15551234567'
    }

    // Set default employee number
    process.env.DEFAULT_EMPLOYEE_NUMBER = '+15559876543'

    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      From: '+15551234567',
      To: '+15551234568',
      CallStatus: 'ringing'
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'valid-signature'
      }
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    // Verify call was assigned to default employee
    const call = await prisma.call.findUnique({
      where: { twilioCallSid: 'CA1234567890abcdef' },
      include: { user: true }
    })

    expect(call?.userId).toBe('default-user-id')
  })
})
```

### Testing TwiML Generation

Verify that webhooks return valid TwiML responses:

```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/webhooks/twilio/voice/route'

describe('TwiML Generation', () => {
  it('should return valid TwiML for business hours', async () => {
    // Mock business hours
    const originalDate = Date
    global.Date = class extends Date {
      getHours() { return 10 } // 10 AM
      getDay() { return 1 } // Monday
    } as any

    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      From: '+15551234567',
      To: '+15551234568',
      CallStatus: 'ringing'
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'valid-signature'
      }
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const twiml = await response.text()
    expect(twiml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(twiml).toContain('<Response>')
    expect(twiml).toContain('<Dial>')
    expect(twiml).toContain('record="record-from-answer-dual"')

    // Restore original Date
    global.Date = originalDate
  })

  it('should return voicemail TwiML for after hours', async () => {
    // Mock after hours
    const originalDate = Date
    global.Date = class extends Date {
      getHours() { return 20 } // 8 PM
      getDay() { return 1 } // Monday
    } as any

    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      From: '+15551234567',
      To: '+15551234568',
      CallStatus: 'ringing'
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'valid-signature'
      }
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const twiml = await response.text()
    expect(twiml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(twiml).toContain('<Response>')
    expect(twiml).toContain('<Record>')
    expect(twiml).not.toContain('<Dial>')

    // Restore original Date
    global.Date = originalDate
  })
})
```

## Automated Webhook Testing

### Unit Tests for Webhook Handlers

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/webhooks/twilio/voice/route'

describe('Voice Webhook Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle incoming call webhook', async () => {
    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      From: '+15551234567',
      To: '+15551234568',
      CallStatus: 'ringing',
      Direction: 'inbound'
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'test-signature'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should handle call completion webhook', async () => {
    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      CallStatus: 'completed',
      Duration: '120',
      RecordingUrl: 'https://api.twilio.com/recording.mp3'
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
      method: 'POST',
      body: new URLSearchParams(webhookData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'test-signature'
      }
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
```

### Integration Tests with Real Webhooks

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer } from 'http'
import { parse } from 'url'

describe('Webhook Integration Tests', () => {
  let server: any
  let webhookUrl: string

  beforeAll(async () => {
    // Start test server
    server = createServer((req, res) => {
      const { pathname } = parse(req.url || '')
      
      if (pathname === '/api/webhooks/twilio/voice') {
        let body = ''
        req.on('data', chunk => {
          body += chunk.toString()
        })
        req.on('end', () => {
          const params = new URLSearchParams(body)
          const callSid = params.get('CallSid')
          
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ success: true, callSid }))
        })
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    await new Promise(resolve => {
      server.listen(0, () => {
        const port = server.address().port
        webhookUrl = `http://localhost:${port}`
        resolve(undefined)
      })
    })
  })

  afterAll(async () => {
    await new Promise(resolve => {
      server.close(resolve)
    })
  })

  it('should receive and process webhook', async () => {
    const webhookData = {
      CallSid: 'CA1234567890abcdef',
      From: '+15551234567',
      To: '+15551234568',
      CallStatus: 'ringing'
    }

    const response = await fetch(`${webhookUrl}/api/webhooks/twilio/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(webhookData)
    })

    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.callSid).toBe('CA1234567890abcdef')
  })
})
```

### E2E Tests with ngrok

```typescript
import { test, expect } from '@playwright/test'

test.describe('Webhook E2E Tests', () => {
  test('should handle real Twilio webhook', async ({ page }) => {
    // Start ngrok tunnel
    const { spawn } = require('child_process')
    const ngrok = spawn('ngrok', ['http', '3000'])
    
    // Wait for ngrok to start
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Get ngrok URL (you'd need to parse this from ngrok output)
    const ngrokUrl = 'https://your-ngrok-url.ngrok.io'
    
    // Configure Twilio webhook URL
    // (This would typically be done via Twilio API or console)
    
    // Make a test call to trigger webhook
    // (This would typically be done via Twilio API)
    
    // Verify webhook was received and processed
    await page.goto('/dashboard/queue')
    await expect(page.locator('[data-testid="voicemail-item"]')).toHaveCount.greaterThan(0)
    
    // Clean up
    ngrok.kill()
  })
})
```

### Testing with ngrok

When testing with ngrok, remember that URLs change on restart. Use this script to automatically update Twilio webhook URLs:

```bash
#!/bin/bash
# scripts/update-webhook-urls.sh

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

if [ "$NGROK_URL" = "null" ]; then
  echo "Error: No ngrok tunnel found. Start ngrok first."
  exit 1
fi

echo "Updating Twilio webhook URLs to: $NGROK_URL"

# Update Twilio webhook URLs via API
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/IncomingPhoneNumbers/$TWILIO_PHONE_NUMBER_SID.json" \
  --data-urlencode "VoiceUrl=$NGROK_URL/api/webhooks/twilio/voice" \
  --data-urlencode "StatusCallbackUrl=$NGROK_URL/api/webhooks/twilio/status" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"

echo "Webhook URLs updated successfully!"
```

### Using Test Helpers

The platform includes test helpers in `tests/utils/qa-helpers.ts`:

```typescript
import { qaHelpers } from '@/tests/utils/qa-helpers'

describe('Webhook Testing with Helpers', () => {
  it('should create test webhook data', () => {
    const webhookData = qaHelpers.createWebhookTestData({
      type: 'voice',
      callSid: 'CA1234567890abcdef',
      from: '+15551234567',
      to: '+15551234568'
    })

    expect(webhookData.CallSid).toBe('CA1234567890abcdef')
    expect(webhookData.From).toBe('+15551234567')
  })

  it('should compute Twilio signature', () => {
    const url = 'https://example.com/webhook'
    const params = { CallSid: 'test-call-sid' }
    const signature = qaHelpers.computeTwilioSignature(url, params)

    expect(signature).toBeDefined()
    expect(typeof signature).toBe('string')
  })
})
```

## Troubleshooting

### Common Issues

#### 1. ngrok Tunnel Not Working

**Error**: `tunnel not found` or connection refused

**Solutions**:
```bash
# Check if ngrok is running
ps aux | grep ngrok

# Restart ngrok
pkill ngrok
ngrok http 3000

# Check ngrok status
curl http://localhost:4040/api/tunnels
```

#### 2. Webhook Not Received

**Error**: No webhook received in application

**Solutions**:
1. Verify ngrok tunnel is running
2. Check webhook URL in Twilio Console
3. Verify application is running on correct port
4. Check firewall settings
5. Test webhook endpoint manually

#### 3. Invalid Signature Error

**Error**: `Invalid Twilio signature` or `Unauthorized`

**Solutions**:
1. Verify `TWILIO_AUTH_TOKEN` in environment variables
2. Check webhook URL matches exactly
3. Ensure parameters are in correct format
4. Test signature generation manually
5. Verify `PUBLIC_BASE_URL` is set correctly
6. Check that webhook URLs use HTTPS (required by Twilio)

#### 4. Webhook Timeout

**Error**: Webhook request times out

**Solutions**:
1. Optimize webhook handler performance
2. Use async processing for heavy operations
3. Implement proper error handling
4. Monitor webhook response times

#### 5. Duplicate Webhooks

**Error**: Same webhook received multiple times

**Solutions**:
1. The platform automatically handles idempotency via `WebhookLog` table
2. Duplicate webhooks return early with 200 OK
3. Check `WebhookLog` table for processed webhook IDs
4. Verify webhook SID is being used correctly

#### 6. Calls Not Appearing in History

**Error**: Calls not showing up in dashboard history

**Solutions**:
1. Check that `userId` is being set during call creation
2. Verify user assignment logic in voice webhook
3. Check that `DEFAULT_EMPLOYEE_NUMBER` is configured
4. Verify contact has `projectCoordinatorId` set
5. Check database for call records with null `userId`

#### 7. Recording Callbacks Failing

**Error**: Recording webhooks not working

**Solutions**:
1. Verify `PUBLIC_BASE_URL` is set and accessible
2. Check that URL uses HTTPS (Twilio requirement)
3. Test recording callback URL manually
4. Verify TwiML includes correct `recordingStatusCallback`
5. Check webhook signature validation

### Debugging Tools

#### 1. ngrok Web Interface

Access `http://localhost:4040` to:
- View all incoming requests
- Inspect request/response details
- Replay requests
- Monitor webhook delivery

#### 2. Twilio Webhook Logs

1. Go to Twilio Console
2. Navigate to Monitor → Logs → Webhooks
3. View webhook delivery attempts
4. Check for delivery failures

#### 3. Application Logs

```typescript
// Add logging to webhook handlers
export async function POST(request: NextRequest) {
  console.log('Webhook received:', {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  })

  try {
    // Process webhook
    const result = await processWebhook(request)
    console.log('Webhook processed successfully:', result)
    return Response.json({ success: true })
  } catch (error) {
    console.error('Webhook processing failed:', error)
    return Response.json({ error: 'Processing failed' }, { status: 500 })
  }
}
```

#### 4. Webhook Testing Tools

```bash
# Test webhook endpoint
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test&From=%2B15551234567&To=%2B15551234568&CallStatus=ringing"

# Test with signature
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "X-Twilio-Signature: YOUR_SIGNATURE" \
  -d "CallSid=test&From=%2B15551234567&To=%2B15551234568&CallStatus=ringing"
```

## Best Practices

### 1. Webhook Security

- Always verify Twilio signatures (now enforced by `withWebhookSecurity`)
- Use HTTPS for webhook URLs (required by Twilio)
- Implement idempotency checks (automatic via `WebhookLog` table)
- Validate webhook payloads using Zod schemas
- Use environment variables for sensitive data
- Test signature validation in all test scenarios

### 2. Error Handling

- Implement proper error responses
- Log webhook processing errors
- Handle duplicate webhooks
- Implement retry logic
- Monitor webhook delivery

### 3. Performance

- Process webhooks asynchronously
- Use database transactions
- Implement proper indexing
- Monitor webhook response times
- Optimize database queries

### 4. Testing

- Test all webhook types with valid signatures
- Test error scenarios and edge cases
- Test signature verification and rejection
- Test idempotency by sending duplicate webhooks
- Test user assignment for different scenarios
- Test TwiML generation for business/after hours
- Test with real Twilio webhooks using ngrok
- Implement comprehensive automated testing

### 5. Monitoring

- Monitor webhook delivery success rates
- Track webhook processing times
- Alert on webhook failures
- Monitor application performance
- Track webhook volume

### 6. Documentation

- Document webhook endpoints
- Provide webhook examples
- Document error codes
- Keep webhook documentation updated
- Provide troubleshooting guides

## Additional Resources

- [Twilio Webhook Documentation](https://www.twilio.com/docs/usage/webhooks)
- [ngrok Documentation](https://ngrok.com/docs)
- [Webhook Testing Tools](https://webhook.site/)
- [Twilio Webhook Testing](https://www.twilio.com/docs/usage/webhooks/webhooks-testing)
- [Webhook Security Best Practices](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

---

Happy webhook testing! 🔗
