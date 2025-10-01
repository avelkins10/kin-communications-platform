import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as voiceWebhook } from '@/app/api/webhooks/twilio/voice/route'
import { POST as statusWebhook } from '@/app/api/webhooks/twilio/status/route'
import { POST as recordingWebhook } from '@/app/api/webhooks/twilio/recording/route'
import { testUtils, prismaMock } from '../setup'

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

// Mock phone utilities
vi.mock('@/lib/utils/phone', () => ({
  normalizePhoneToE164: vi.fn((phone: string) => {
    if (phone === '+15551234567') return '+15551234567'
    if (phone === '+15551234568') return '+15551234568'
    return null
  }),
  findUserByPhoneNumber: vi.fn(() => ({
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com'
  }))
}))

// Mock TwiML generation
vi.mock('@/lib/twilio/twiml', () => ({
  answerWithRecording: vi.fn(() => '<?xml version="1.0" encoding="UTF-8"?><Response><Dial>+15551234568</Dial></Response>'),
  generateVoicemailTwiML: vi.fn(() => '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Please leave a message</Say><Record/></Response>')
}))

// Mock Quickbase service
vi.mock('@/lib/quickbase/service', () => ({
  quickbaseService: {
    findCustomerByPhone: vi.fn(),
    logCallToQuickbase: vi.fn(),
    logVoicemailToQuickbase: vi.fn()
  }
}))

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn()
}))

describe('Voice Webhook Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.DEFAULT_EMPLOYEE_NUMBER = '+15551234568'
    process.env.QUICKBASE_ENABLED = 'true'
  })

  afterEach(async () => {
    await testUtils.cleanup()
  })

  describe('Complete Call Flow Integration', () => {
    it('should handle complete inbound call flow with project coordinator assignment', async () => {
      const callSid = 'CA1234567890abcdef'
      const fromNumber = '+15551234567'
      const toNumber = '+15551234568'

      // Step 1: Voice webhook - incoming call
      const voiceWebhookData = {
        CallSid: callSid,
        From: fromNumber,
        To: toNumber,
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      // Mock contact with project coordinator
      prismaMock.contact.findFirst.mockResolvedValue({
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: fromNumber,
        projectCoordinatorId: 'coordinator-1'
      })

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'coordinator-1',
        name: 'Project Coordinator',
        email: 'coordinator@example.com',
        PhoneNumber: [{
          phoneNumber: '+15551234569',
          status: 'active'
        }]
      })

      prismaMock.call.findUnique.mockResolvedValue(null)
      prismaMock.call.create.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber,
        toNumber,
        contactId: 'contact-1',
        userId: 'coordinator-1',
        startedAt: new Date()
      })

      const voiceRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(voiceWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const voiceResponse = await voiceWebhook(voiceRequest)
      expect(voiceResponse.status).toBe(200)

      // Step 2: Status webhook - call in progress
      const statusWebhookData = {
        CallSid: callSid,
        CallStatus: 'in-progress',
        From: fromNumber,
        To: toNumber,
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        status: 'RINGING',
        startedAt: null
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'IN_PROGRESS',
        startedAt: new Date()
      })

      const statusRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(statusWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const statusResponse = await statusWebhook(statusRequest)
      expect(statusResponse.status).toBe(200)

      // Step 3: Status webhook - call completed
      const completedStatusData = {
        CallSid: callSid,
        CallStatus: 'completed',
        Duration: '120',
        From: fromNumber,
        To: toNumber,
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: callSid,
          status: 'IN_PROGRESS',
          recordingUrl: null
        })
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: callSid,
          status: 'COMPLETED',
          recordingUrl: null,
          Contact: {
            id: 'contact-1',
            firstName: 'John',
            lastName: 'Doe'
          },
          User: {
            id: 'coordinator-1',
            name: 'Project Coordinator'
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

      const completedStatusRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(completedStatusData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const completedStatusResponse = await statusWebhook(completedStatusRequest)
      expect(completedStatusResponse.status).toBe(200)

      // Verify the complete flow
      expect(prismaMock.call.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'coordinator-1',
          contactId: 'contact-1'
        })
      })

      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          status: 'IN_PROGRESS',
          startedAt: expect.any(Date)
        }
      })

      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          status: 'COMPLETED',
          durationSec: 120,
          endedAt: expect.any(Date)
        }
      })

      expect(mockQuickbaseService.logCallToQuickbase).toHaveBeenCalled()
    })

    it('should handle complete call flow with Quickbase coordinator assignment', async () => {
      const callSid = 'CA1234567890abcdef'
      const fromNumber = '+15551234567'
      const toNumber = '+15551234568'

      // Step 1: Voice webhook - incoming call
      const voiceWebhookData = {
        CallSid: callSid,
        From: fromNumber,
        To: toNumber,
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      // Mock Quickbase customer with project coordinator
      const mockQuickbaseService = require('@/lib/quickbase/service').quickbaseService
      mockQuickbaseService.findCustomerByPhone.mockResolvedValue({
        id: 'qb-customer-1',
        projectCoordinator: {
          id: 'qb-coordinator-1',
          name: 'QB Project Coordinator'
        }
      })

      prismaMock.contact.findFirst.mockResolvedValue(null)
      prismaMock.call.findUnique.mockResolvedValue(null)
      prismaMock.call.create.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber,
        toNumber,
        contactId: null,
        userId: null, // Initially no user assigned
        startedAt: new Date()
      })

      // Mock Quickbase coordinator lookup
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'qb-coordinator-1',
        name: 'QB Project Coordinator',
        quickbaseUserId: 'qb-coordinator-1',
        PhoneNumber: [{
          phoneNumber: '+15551234569',
          status: 'active'
        }]
      })

      // Mock call update for Quickbase coordinator assignment
      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        userId: 'qb-coordinator-1'
      })

      const voiceRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(voiceWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const voiceResponse = await voiceWebhook(voiceRequest)
      expect(voiceResponse.status).toBe(200)

      // Verify Quickbase coordinator assignment
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: { userId: 'qb-coordinator-1' }
      })
    })

    it('should handle complete call flow with recording', async () => {
      const callSid = 'CA1234567890abcdef'
      const fromNumber = '+15551234567'
      const toNumber = '+15551234568'
      const recordingSid = 'RE1234567890abcdef'
      const recordingUrl = 'https://api.twilio.com/recording.mp3'

      // Step 1: Voice webhook - incoming call
      const voiceWebhookData = {
        CallSid: callSid,
        From: fromNumber,
        To: toNumber,
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.contact.findFirst.mockResolvedValue(null)
      prismaMock.call.findUnique.mockResolvedValue(null)
      prismaMock.call.create.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber,
        toNumber,
        contactId: null,
        userId: 'user-1',
        startedAt: new Date()
      })

      const voiceRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(voiceWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const voiceResponse = await voiceWebhook(voiceRequest)
      expect(voiceResponse.status).toBe(200)

      // Step 2: Status webhook - call completed
      const statusWebhookData = {
        CallSid: callSid,
        CallStatus: 'completed',
        Duration: '120',
        From: fromNumber,
        To: toNumber,
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: callSid,
          status: 'IN_PROGRESS',
          recordingUrl: null
        })
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: callSid,
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

      const statusRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(statusWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const statusResponse = await statusWebhook(statusRequest)
      expect(statusResponse.status).toBe(200)

      // Step 3: Recording webhook - recording completed
      const recordingWebhookData = {
        CallSid: callSid,
        RecordingSid: recordingSid,
        RecordingUrl: recordingUrl,
        RecordingDuration: '120',
        RecordingChannels: '1',
        RecordingStatus: 'completed',
        RecordingStartTime: '2024-01-15T10:00:00Z',
        RecordingSource: 'DialVerb',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        status: 'COMPLETED',
        recordingUrl: null,
        Contact: {
          id: 'contact-1',
          firstName: 'John',
          lastName: 'Doe'
        }
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        recordingUrl: recordingUrl,
        recordingSid: recordingSid
      })

      const mockQuickbaseService = require('@/lib/quickbase/service').quickbaseService
      mockQuickbaseService.logCallToQuickbase.mockResolvedValue(undefined)

      const recordingRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/recording', {
        method: 'POST',
        body: new URLSearchParams(recordingWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const recordingResponse = await recordingWebhook(recordingRequest)
      expect(recordingResponse.status).toBe(200)

      // Verify recording was processed
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          recordingUrl: recordingUrl,
          recordingSid: recordingSid,
          status: 'COMPLETED'
        }
      })

      expect(mockQuickbaseService.logCallToQuickbase).toHaveBeenCalled()
    })

    it('should handle complete voicemail flow', async () => {
      const callSid = 'CA1234567890abcdef'
      const fromNumber = '+15551234567'
      const toNumber = '+15551234568'
      const recordingSid = 'RE1234567890abcdef'
      const recordingUrl = 'https://api.twilio.com/recording.mp3'

      // Step 1: Voice webhook - after hours call
      const mockDate = new Date('2024-01-13T22:00:00Z') // Saturday 10 PM
      vi.setSystemTime(mockDate)

      const voiceWebhookData = {
        CallSid: callSid,
        From: fromNumber,
        To: toNumber,
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.contact.findFirst.mockResolvedValue({
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: fromNumber
      })

      prismaMock.call.findUnique.mockResolvedValue(null)
      prismaMock.call.create.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber,
        toNumber,
        contactId: 'contact-1',
        userId: 'user-1',
        startedAt: new Date()
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'VOICEMAIL'
      })

      const voiceRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(voiceWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const voiceResponse = await voiceWebhook(voiceRequest)
      expect(voiceResponse.status).toBe(200)

      // Step 2: Recording webhook - voicemail recording completed
      const recordingWebhookData = {
        CallSid: callSid,
        RecordingSid: recordingSid,
        RecordingUrl: recordingUrl,
        RecordingDuration: '60',
        RecordingChannels: '1',
        RecordingStatus: 'completed',
        RecordingStartTime: '2024-01-13T22:00:00Z',
        RecordingSource: 'DialVerb',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        status: 'VOICEMAIL',
        recordingUrl: null,
        fromNumber,
        contactId: 'contact-1',
        Contact: {
          id: 'contact-1',
          firstName: 'John',
          lastName: 'Doe'
        }
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        recordingUrl: recordingUrl,
        recordingSid: recordingSid
      })

      prismaMock.voicemail.upsert.mockResolvedValue({
        id: 'voicemail-1',
        callId: 'call-1',
        audioUrl: recordingUrl,
        duration: 60
      })

      const mockQuickbaseService = require('@/lib/quickbase/service').quickbaseService
      mockQuickbaseService.logCallToQuickbase.mockResolvedValue(undefined)
      mockQuickbaseService.logVoicemailToQuickbase.mockResolvedValue(undefined)

      const recordingRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/recording', {
        method: 'POST',
        body: new URLSearchParams(recordingWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const recordingResponse = await recordingWebhook(recordingRequest)
      expect(recordingResponse.status).toBe(200)

      // Verify voicemail was created
      expect(prismaMock.voicemail.upsert).toHaveBeenCalledWith({
        where: { callId: 'call-1' },
        update: {
          audioUrl: recordingUrl,
          duration: 60,
          updatedAt: expect.any(Date)
        },
        create: {
          id: expect.any(String),
          callId: 'call-1',
          audioUrl: recordingUrl,
          fromNumber,
          duration: 60,
          contactId: 'contact-1',
          priority: 'NORMAL',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      })

      expect(mockQuickbaseService.logCallToQuickbase).toHaveBeenCalled()
      expect(mockQuickbaseService.logVoicemailToQuickbase).toHaveBeenCalled()
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle webhook processing failures gracefully', async () => {
      const callSid = 'CA1234567890abcdef'
      const fromNumber = '+15551234567'
      const toNumber = '+15551234568'

      // Step 1: Voice webhook fails due to database error
      const voiceWebhookData = {
        CallSid: callSid,
        From: fromNumber,
        To: toNumber,
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.contact.findFirst.mockRejectedValue(new Error('Database connection failed'))

      const voiceRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(voiceWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const voiceResponse = await voiceWebhook(voiceRequest)
      expect(voiceResponse.status).toBe(500)

      // Step 2: Status webhook should still work even if voice webhook failed
      const statusWebhookData = {
        CallSid: callSid,
        CallStatus: 'completed',
        Duration: '120',
        From: fromNumber,
        To: toNumber,
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue(null) // Call not found

      const statusRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(statusWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const statusResponse = await statusWebhook(statusRequest)
      expect(statusResponse.status).toBe(200) // Should not error when call not found
    })

    it('should handle Quickbase service failures without breaking call flow', async () => {
      const callSid = 'CA1234567890abcdef'
      const fromNumber = '+15551234567'
      const toNumber = '+15551234568'

      // Step 1: Voice webhook with Quickbase failure
      const voiceWebhookData = {
        CallSid: callSid,
        From: fromNumber,
        To: toNumber,
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      const mockQuickbaseService = require('@/lib/quickbase/service').quickbaseService
      mockQuickbaseService.findCustomerByPhone.mockRejectedValue(new Error('Quickbase API error'))

      prismaMock.contact.findFirst.mockResolvedValue(null)
      prismaMock.call.findUnique.mockResolvedValue(null)
      prismaMock.call.create.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber,
        toNumber,
        contactId: null,
        userId: 'user-1',
        startedAt: new Date()
      })

      const voiceRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(voiceWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const voiceResponse = await voiceWebhook(voiceRequest)
      expect(voiceResponse.status).toBe(200) // Should still succeed

      // Step 2: Status webhook with Quickbase logging failure
      const statusWebhookData = {
        CallSid: callSid,
        CallStatus: 'completed',
        Duration: '120',
        From: fromNumber,
        To: toNumber,
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: callSid,
          status: 'IN_PROGRESS',
          recordingUrl: null
        })
        .mockResolvedValueOnce({
          id: 'call-1',
          twilioCallSid: callSid,
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

      mockQuickbaseService.logCallToQuickbase.mockRejectedValue(new Error('Quickbase logging failed'))

      const statusRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(statusWebhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const statusResponse = await statusWebhook(statusRequest)
      expect(statusResponse.status).toBe(200) // Should still succeed despite Quickbase failure
    })

    it('should handle duplicate webhook processing idempotently', async () => {
      const callSid = 'CA1234567890abcdef'
      const fromNumber = '+15551234567'
      const toNumber = '+15551234568'

      const webhookData = {
        CallSid: callSid,
        From: fromNumber,
        To: toNumber,
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      // First webhook call
      prismaMock.contact.findFirst.mockResolvedValue(null)
      prismaMock.call.findUnique.mockResolvedValue(null)
      prismaMock.call.create.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber,
        toNumber,
        contactId: null,
        userId: 'user-1',
        startedAt: new Date()
      })

      const request1 = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response1 = await voiceWebhook(request1)
      expect(response1.status).toBe(200)

      // Second webhook call (duplicate) - should be idempotent
      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: callSid,
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber,
        toNumber,
        contactId: null,
        userId: 'user-1',
        startedAt: new Date()
      })

      const request2 = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response2 = await voiceWebhook(request2)
      expect(response2.status).toBe(200)
      expect(prismaMock.call.create).toHaveBeenCalledTimes(1) // Should only create once
    })
  })

  describe('Security and Validation', () => {
    it('should reject webhooks with invalid signatures across all endpoints', async () => {
      vi.mocked(require('@/lib/twilio/signature').verifyTwilioSignature).mockReturnValue(false)

      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound'
      }

      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'invalid-signature'
      }

      // Test voice webhook
      const voiceRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers
      })
      const voiceResponse = await voiceWebhook(voiceRequest)
      expect(voiceResponse.status).toBe(401)

      // Test status webhook
      const statusRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers
      })
      const statusResponse = await statusWebhook(statusRequest)
      expect(statusResponse.status).toBe(401)

      // Test recording webhook
      const recordingData = {
        ...webhookData,
        RecordingSid: 'RE1234567890abcdef',
        RecordingUrl: 'https://api.twilio.com/recording.mp3',
        RecordingDuration: '120',
        RecordingChannels: '1',
        RecordingStatus: 'completed'
      }
      const recordingRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/recording', {
        method: 'POST',
        body: new URLSearchParams(recordingData),
        headers
      })
      const recordingResponse = await recordingWebhook(recordingRequest)
      expect(recordingResponse.status).toBe(401)
    })

    it('should validate required fields across all webhook types', async () => {
      // Test voice webhook with missing fields
      const invalidVoiceData = {
        CallSid: 'CA1234567890abcdef'
        // Missing other required fields
      }

      const voiceRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(invalidVoiceData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })
      const voiceResponse = await voiceWebhook(voiceRequest)
      expect(voiceResponse.status).toBe(400)

      // Test status webhook with missing fields
      const invalidStatusData = {
        CallSid: 'CA1234567890abcdef'
        // Missing CallStatus
      }

      const statusRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/status', {
        method: 'POST',
        body: new URLSearchParams(invalidStatusData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })
      const statusResponse = await statusWebhook(statusRequest)
      expect(statusResponse.status).toBe(400)

      // Test recording webhook with missing fields
      const invalidRecordingData = {
        CallSid: 'CA1234567890abcdef',
        RecordingSid: 'RE1234567890abcdef'
        // Missing other required fields
      }

      const recordingRequest = new NextRequest('http://localhost:3000/api/webhooks/twilio/recording', {
        method: 'POST',
        body: new URLSearchParams(invalidRecordingData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })
      const recordingResponse = await recordingWebhook(recordingRequest)
      expect(recordingResponse.status).toBe(400)
    })
  })
})

