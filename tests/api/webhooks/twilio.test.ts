import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as voiceWebhook } from '@/app/api/webhooks/twilio/voice/route'
import { POST as smsWebhook } from '@/app/api/webhooks/twilio/sms/route'
import { POST as statusWebhook } from '@/app/api/webhooks/twilio/status/route'
import { POST as recordingWebhook } from '@/app/api/webhooks/twilio/recording/route'
import { testUtils, prismaMock } from '../../setup'

// Mock Twilio signature validation
vi.mock('@/lib/twilio/signature', () => ({
  validateTwilioSignature: vi.fn(() => true)
}))

// Mock Socket.io
vi.mock('@/lib/socket', () => ({
  socketServer: {
    emit: vi.fn()
  }
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({ prisma: prismaMock }))

describe('Twilio Webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await testUtils.cleanup()
  })

  describe('Voice Webhook', () => {
    it('should handle incoming call webhook', async () => {
      const webhookData = testUtils.createTwilioWebhookPayload({
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound'
      })

      prismaMock.contact.findFirst.mockResolvedValue({
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales'
      })

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'voice',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await voiceWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prismaMock.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'voice',
          payload: webhookData
        })
      })
    })

    it('should handle call completion webhook', async () => {
      const webhookData = testUtils.createTwilioWebhookPayload({
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        RecordingUrl: 'https://api.twilio.com/recording.mp3'
      })

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'voice',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await voiceWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should reject invalid Twilio signature', async () => {
      // Mock invalid signature
      vi.mocked(require('@/lib/twilio/signature').validateTwilioSignature).mockReturnValue(false)

      const webhookData = testUtils.createTwilioWebhookPayload()

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'invalid-signature'
        }
      })

      const response = await voiceWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toContain('Invalid Twilio signature')
    })

    it('should handle missing required fields', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef'
        // Missing other required fields
      }

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await voiceWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing required fields')
    })
  })

  describe('SMS Webhook', () => {
    it('should handle incoming SMS webhook', async () => {
      const webhookData = testUtils.createSMSWebhookPayload({
        MessageSid: 'SM1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        Body: 'Hello, this is a test message',
        MessageStatus: 'received'
      })

      prismaMock.contact.findFirst.mockResolvedValue({
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales'
      })

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'sms',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/sms', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await smsWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prismaMock.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'sms',
          payload: webhookData
        })
      })
    })

    it('should handle SMS delivery status webhook', async () => {
      const webhookData = testUtils.createSMSWebhookPayload({
        MessageSid: 'SM1234567890abcdef',
        MessageStatus: 'delivered',
        ErrorCode: '0'
      })

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'sms',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/sms', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await smsWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Status Callback Webhook', () => {
    it('should handle call status callback', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        From: '+15551234567',
        To: '+15551234568'
      }

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'status',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await statusWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle failed call status', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'failed',
        From: '+15551234567',
        To: '+15551234568',
        ErrorCode: '11200',
        ErrorMessage: 'Invalid phone number'
      }

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'status',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await statusWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Recording Webhook', () => {
    it('should handle recording completion webhook', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        RecordingSid: 'RE1234567890abcdef',
        RecordingUrl: 'https://api.twilio.com/recording.mp3',
        RecordingDuration: '120',
        RecordingStatus: 'completed'
      }

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'recording',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/recording', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await recordingWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should handle recording failure webhook', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        RecordingSid: 'RE1234567890abcdef',
        RecordingStatus: 'failed',
        ErrorCode: '11200',
        ErrorMessage: 'Recording failed'
      }

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'recording',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/recording', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await recordingWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const webhookData = testUtils.createTwilioWebhookPayload()

      prismaMock.webhookLog.create.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await voiceWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Database connection failed')
    })

    it('should handle malformed webhook data', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: 'invalid-data',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await voiceWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid webhook data')
    })

    it('should handle missing Twilio signature header', async () => {
      const webhookData = testUtils.createTwilioWebhookPayload()

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const response = await voiceWebhook(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Missing Twilio signature')
    })
  })

  describe('Socket.io Integration', () => {
    it('should emit real-time updates for voice webhooks', async () => {
      const webhookData = testUtils.createTwilioWebhookPayload({
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed'
      })

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'voice',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await voiceWebhook(request)

      expect(response.status).toBe(200)
      expect(require('@/lib/socket').socketServer.emit).toHaveBeenCalledWith(
        'call_status_update',
        expect.objectContaining({
          callSid: 'CA1234567890abcdef',
          status: 'completed'
        })
      )
    })

    it('should emit real-time updates for SMS webhooks', async () => {
      const webhookData = testUtils.createSMSWebhookPayload({
        MessageSid: 'SM1234567890abcdef',
        MessageStatus: 'delivered'
      })

      prismaMock.webhookLog.create.mockResolvedValue({
        id: 'webhook-1',
        type: 'sms',
        payload: webhookData,
        processed: true,
        createdAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/sms', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'test-signature'
        }
      })

      const response = await smsWebhook(request)

      expect(response.status).toBe(200)
      expect(require('@/lib/socket').socketServer.emit).toHaveBeenCalledWith(
        'sms_status_update',
        expect.objectContaining({
          messageSid: 'SM1234567890abcdef',
          status: 'delivered'
        })
      )
    })
  })
})
