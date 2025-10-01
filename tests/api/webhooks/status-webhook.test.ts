import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as statusWebhook } from '@/app/api/webhooks/twilio/status/route'
import { testUtils, prismaMock } from '../../setup'

// Mock Twilio signature validation
vi.mock('@/lib/twilio/signature', () => ({
  verifyTwilioSignature: vi.fn(() => true)
}))

// Mock Socket.io
vi.mock('@/lib/socket', () => ({
  socketServer: {
    emit: vi.fn()
  }
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({ prisma: prismaMock }))

// Mock Quickbase service
vi.mock('@/lib/quickbase/service', () => ({
  quickbaseService: {
    logCallToQuickbase: vi.fn()
  }
}))

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn()
}))

describe('Status Webhook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.QUICKBASE_ENABLED = 'true'
  })

  afterEach(async () => {
    await testUtils.cleanup()
  })

  describe('Signature Validation', () => {
    it('should validate Twilio signature correctly', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'IN_PROGRESS'
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'COMPLETED',
        durationSec: 120,
        endedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200)
    })

    it('should reject invalid Twilio signature', async () => {
      vi.mocked(require('@/lib/twilio/signature').verifyTwilioSignature).mockReturnValue(false)

      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120'
      }

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'invalid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(401)
    })

    it('should handle missing signature header', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120'
      }

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(401)
    })
  })

  describe('Call Status Updates', () => {
    it('should handle call completion status', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'IN_PROGRESS',
        startedAt: new Date('2024-01-15T10:00:00Z')
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'COMPLETED',
        durationSec: 120,
        endedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          status: 'COMPLETED',
          durationSec: 120,
          endedAt: expect.any(Date)
        }
      })
    })

    it('should handle call failure status', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'failed',
        From: '+15551234567',
        To: '+15551234568',
        ErrorCode: '11200',
        ErrorMessage: 'Invalid phone number',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'RINGING',
        startedAt: new Date('2024-01-15T10:00:00Z')
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'FAILED',
        endedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          status: 'FAILED',
          endedAt: expect.any(Date)
        }
      })
    })

    it('should handle no-answer status', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'no-answer',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'RINGING',
        startedAt: new Date('2024-01-15T10:00:00Z')
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'MISSED',
        endedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          status: 'MISSED',
          endedAt: expect.any(Date)
        }
      })
    })

    it('should handle busy status', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'busy',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'RINGING',
        startedAt: new Date('2024-01-15T10:00:00Z')
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'FAILED',
        endedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          status: 'FAILED',
          endedAt: expect.any(Date)
        }
      })
    })

    it('should handle in-progress status', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'in-progress',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'RINGING',
        startedAt: null
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'IN_PROGRESS',
        startedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          status: 'IN_PROGRESS',
          startedAt: expect.any(Date)
        }
      })
    })

    it('should calculate duration when not provided', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
        // No Duration field
      }

      const startTime = new Date('2024-01-15T10:00:00Z')
      const endTime = new Date('2024-01-15T10:02:00Z') // 2 minutes later

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'IN_PROGRESS',
        startedAt: startTime
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'COMPLETED',
        durationSec: 120,
        endedAt: endTime
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          status: 'COMPLETED',
          durationSec: 120, // 2 minutes = 120 seconds
          endedAt: expect.any(Date)
        }
      })
    })
  })

  describe('Quickbase Integration', () => {
    it('should log completed calls to Quickbase', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: 'CA1234567890abcdef',
          status: 'IN_PROGRESS',
          recordingUrl: null // No recording URL yet
        })
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: 'CA1234567890abcdef',
          status: 'COMPLETED',
          recordingUrl: null,
          Contact: {
            id: 'contact-1',
            firstName: 'John',
            lastName: 'Doe'
          },
          User: {
            id: 'user-1',
            name: 'Test User'
          }
        })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'COMPLETED',
        durationSec: 120,
        endedAt: new Date()
      })

      const mockQuickbaseService = require('@/lib/quickbase/service').quickbaseService
      mockQuickbaseService.logCallToQuickbase.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200)
      expect(mockQuickbaseService.logCallToQuickbase).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'call-1',
          status: 'COMPLETED'
        }),
        expect.objectContaining({
          id: 'contact-1',
          firstName: 'John',
          lastName: 'Doe'
        }),
        expect.objectContaining({
          id: 'user-1',
          name: 'Test User'
        })
      )
    })

    it('should skip Quickbase logging for calls with recording URLs', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: 'CA1234567890abcdef',
          status: 'IN_PROGRESS',
          recordingUrl: 'https://api.twilio.com/recording.mp3' // Already has recording
        })
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: 'CA1234567890abcdef',
          status: 'COMPLETED',
          recordingUrl: 'https://api.twilio.com/recording.mp3',
          Contact: {
            id: 'contact-1',
            firstName: 'John',
            lastName: 'Doe'
          },
          User: {
            id: 'user-1',
            name: 'Test User'
          }
        })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'COMPLETED',
        durationSec: 120,
        endedAt: new Date()
      })

      const mockQuickbaseService = require('@/lib/quickbase/service').quickbaseService

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200)
      expect(mockQuickbaseService.logCallToQuickbase).not.toHaveBeenCalled()
    })

    it('should handle Quickbase logging failures gracefully', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: 'CA1234567890abcdef',
          status: 'IN_PROGRESS',
          recordingUrl: null
        })
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: 'CA1234567890abcdef',
          status: 'COMPLETED',
          recordingUrl: null,
          Contact: {
            id: 'contact-1',
            firstName: 'John',
            lastName: 'Doe'
          },
          User: {
            id: 'user-1',
            name: 'Test User'
          }
        })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'COMPLETED',
        durationSec: 120,
        endedAt: new Date()
      })

      const mockQuickbaseService = require('@/lib/quickbase/service').quickbaseService
      mockQuickbaseService.logCallToQuickbase.mockRejectedValue(new Error('Quickbase API error'))

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200) // Should still succeed despite Quickbase failure
    })
  })

  describe('Retry-Safe Behavior', () => {
    it('should handle call not found gracefully', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(200) // Should not error when call not found
    })

    it('should handle database errors gracefully', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'IN_PROGRESS'
      })

      prismaMock.call.update.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(500)
    })

    it('should handle malformed webhook data', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: 'invalid-data',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(400)
    })

    it('should handle missing required fields', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef'
        // Missing CallStatus
      }

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(400)
    })

    it('should handle invalid call status values', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'invalid-status',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await statusWebhook(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Status Mapping', () => {
    it('should map all Twilio statuses to internal statuses correctly', async () => {
      const statusMappings = [
        { twilio: 'queued', internal: 'PENDING' },
        { twilio: 'initiated', internal: 'PENDING' },
        { twilio: 'ringing', internal: 'RINGING' },
        { twilio: 'in-progress', internal: 'IN_PROGRESS' },
        { twilio: 'completed', internal: 'COMPLETED' },
        { twilio: 'busy', internal: 'FAILED' },
        { twilio: 'no-answer', internal: 'MISSED' },
        { twilio: 'failed', internal: 'FAILED' },
        { twilio: 'canceled', internal: 'FAILED' }
      ]

      for (const mapping of statusMappings) {
        const webhookData = {
          CallSid: 'CA1234567890abcdef',
          CallStatus: mapping.twilio,
          From: '+15551234567',
          To: '+15551234568',
          AccountSid: 'AC1234567890abcdef',
          ApiVersion: '2010-04-01'
        }

        prismaMock.call.findUnique.mockResolvedValue({
          id: 'call-1',
          twilioCallSid: 'CA1234567890abcdef',
          status: 'RINGING'
        })

        prismaMock.call.update.mockResolvedValue({
          id: 'call-1',
          status: mapping.internal
        })

        const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
          method: 'POST',
          body: new URLSearchParams(webhookData),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Twilio-Signature': 'valid-signature'
          }
        })

        const response = await statusWebhook(request)
        expect(response.status).toBe(200)
        expect(prismaMock.call.update).toHaveBeenCalledWith({
          where: { id: 'call-1' },
          data: expect.objectContaining({
            status: mapping.internal
          })
        })

        vi.clearAllMocks()
      }
    })
  })
})

