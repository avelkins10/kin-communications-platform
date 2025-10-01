import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as voiceWebhook } from '@/app/api/webhooks/twilio/voice/route'
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

// Mock phone utilities
vi.mock('@/lib/utils/phone', () => ({
  normalizePhoneToE164: vi.fn((phone: string) => {
    if (phone === '+15551234567') return '+15551234567'
    if (phone === '+15551234568') return '+15551234568'
    return null // Simulate normalization failure
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

describe('Voice and Status Webhook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default environment variables
    process.env.DEFAULT_EMPLOYEE_NUMBER = '+15551234568'
  })

  afterEach(async () => {
    await testUtils.cleanup()
  })

  describe('Voice Webhook - Signature Validation', () => {
    it('should validate Twilio signature correctly', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(200)
    })

    it('should reject invalid Twilio signature', async () => {
      vi.mocked(require('@/lib/twilio/signature').validateTwilioSignature).mockReturnValue(false)

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
          'X-Twilio-Signature': 'invalid-signature'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(401)
    })

    it('should handle missing signature header', async () => {
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
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(400)
    })
  })

  describe('Voice Webhook - User Assignment', () => {
    it('should assign call to project coordinator when contact exists', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
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
        phone: '+15551234567',
        projectCoordinatorId: 'coordinator-1'
      })

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'coordinator-1',
        name: 'Project Coordinator',
        email: 'coordinator@example.com'
      })

      prismaMock.call.findUnique.mockResolvedValue(null)
      prismaMock.call.create.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber: '+15551234567',
        toNumber: '+15551234568',
        contactId: 'contact-1',
        userId: 'coordinator-1',
        startedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'coordinator-1',
          contactId: 'contact-1'
        })
      })
    })

    it('should assign call to default employee when no coordinator', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      // Mock contact without project coordinator
      prismaMock.contact.findFirst.mockResolvedValue({
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        projectCoordinatorId: null
      })

      prismaMock.call.findUnique.mockResolvedValue(null)
      prismaMock.call.create.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber: '+15551234567',
        toNumber: '+15551234568',
        contactId: 'contact-1',
        userId: 'user-1',
        startedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1'
        })
      })
    })

    it('should handle phone number normalization failures', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: 'invalid-phone',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      // Mock contact lookup with only original phone number
      prismaMock.contact.findFirst.mockResolvedValue(null)
      prismaMock.call.findUnique.mockResolvedValue(null)
      prismaMock.call.create.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber: 'invalid-phone',
        toNumber: '+15551234568',
        contactId: null,
        userId: 'user-1',
        startedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.contact.findFirst).toHaveBeenCalledWith({
        where: {
          phone: {
            in: ['invalid-phone'] // Should filter out null values
          }
        }
      })
    })
  })

  describe('Voice Webhook - TwiML Responses', () => {
    it('should generate business hours TwiML with recording', async () => {
      // Mock business hours (weekday, 10 AM)
      const mockDate = new Date('2024-01-15T10:00:00Z') // Monday 10 AM
      vi.setSystemTime(mockDate)

      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
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
        twilioCallSid: 'CA1234567890abcdef',
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber: '+15551234567',
        toNumber: '+15551234568',
        contactId: null,
        userId: 'user-1',
        startedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      const twiml = await response.text()
      
      expect(response.status).toBe(200)
      expect(twiml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(require('@/lib/twilio/twiml').answerWithRecording).toHaveBeenCalled()
    })

    it('should generate after hours voicemail TwiML', async () => {
      // Mock after hours (weekend, 10 PM)
      const mockDate = new Date('2024-01-13T22:00:00Z') // Saturday 10 PM
      vi.setSystemTime(mockDate)

      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
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
        twilioCallSid: 'CA1234567890abcdef',
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber: '+15551234567',
        toNumber: '+15551234568',
        contactId: null,
        userId: 'user-1',
        startedAt: new Date()
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        status: 'VOICEMAIL'
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      const twiml = await response.text()
      
      expect(response.status).toBe(200)
      expect(twiml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(require('@/lib/twilio/twiml').generateVoicemailTwiML).toHaveBeenCalled()
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: { status: 'VOICEMAIL' }
      })
    })
  })

  describe('Voice Webhook - Idempotency', () => {
    it('should handle duplicate webhook calls idempotently', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      // Mock existing call
      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber: '+15551234567',
        toNumber: '+15551234568',
        contactId: null,
        userId: 'user-1',
        startedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.create).not.toHaveBeenCalled()
    })
  })

  describe('Status Webhook - Call Status Updates', () => {
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
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { twilioCallSid: 'CA1234567890abcdef' },
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
        status: 'RINGING'
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
        where: { twilioCallSid: 'CA1234567890abcdef' },
        data: {
          status: 'FAILED',
          endedAt: expect.any(Date)
        }
      })
    })
  })

  describe('Recording Webhook - Recording Processing', () => {
    it('should process completed recording', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        RecordingSid: 'RE1234567890abcdef',
        RecordingUrl: 'https://api.twilio.com/recording.mp3',
        RecordingDuration: '120',
        RecordingStatus: 'completed',
        RecordingChannels: '1',
        RecordingStartTime: '2024-01-15T10:00:00Z',
        RecordingSource: 'DialVerb',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
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
        recordingUrl: 'https://api.twilio.com/recording.mp3',
        recordingSid: 'RE1234567890abcdef'
      })

      prismaMock.voicemail.upsert.mockResolvedValue({
        id: 'voicemail-1',
        callId: 'call-1',
        audioUrl: 'https://api.twilio.com/recording.mp3',
        duration: 120
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/recording', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await recordingWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: {
          recordingUrl: 'https://api.twilio.com/recording.mp3',
          recordingSid: 'RE1234567890abcdef',
          status: 'COMPLETED'
        }
      })
    })

    it('should create voicemail record for voicemail calls', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        RecordingSid: 'RE1234567890abcdef',
        RecordingUrl: 'https://api.twilio.com/recording.mp3',
        RecordingDuration: '60',
        RecordingStatus: 'completed',
        RecordingChannels: '1',
        RecordingStartTime: '2024-01-15T10:00:00Z',
        RecordingSource: 'DialVerb',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'VOICEMAIL',
        recordingUrl: null,
        fromNumber: '+15551234567',
        contactId: 'contact-1',
        Contact: {
          id: 'contact-1',
          firstName: 'John',
          lastName: 'Doe'
        }
      })

      prismaMock.call.update.mockResolvedValue({
        id: 'call-1',
        recordingUrl: 'https://api.twilio.com/recording.mp3',
        recordingSid: 'RE1234567890abcdef'
      })

      prismaMock.voicemail.upsert.mockResolvedValue({
        id: 'voicemail-1',
        callId: 'call-1',
        audioUrl: 'https://api.twilio.com/recording.mp3',
        duration: 60
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/recording', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await recordingWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.voicemail.upsert).toHaveBeenCalledWith({
        where: { callId: 'call-1' },
        update: {
          audioUrl: 'https://api.twilio.com/recording.mp3',
          duration: 60,
          updatedAt: expect.any(Date)
        },
        create: {
          id: expect.any(String),
          callId: 'call-1',
          audioUrl: 'https://api.twilio.com/recording.mp3',
          fromNumber: '+15551234567',
          duration: 60,
          contactId: 'contact-1',
          priority: 'NORMAL',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      })
    })

    it('should handle duplicate recording URLs idempotently', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        RecordingSid: 'RE1234567890abcdef',
        RecordingUrl: 'https://api.twilio.com/recording.mp3',
        RecordingDuration: '120',
        RecordingStatus: 'completed',
        RecordingChannels: '1',
        RecordingStartTime: '2024-01-15T10:00:00Z',
        RecordingSource: 'DialVerb',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.call.findUnique.mockResolvedValue({
        id: 'call-1',
        twilioCallSid: 'CA1234567890abcdef',
        status: 'COMPLETED',
        recordingUrl: 'https://api.twilio.com/recording.mp3', // Already has this URL
        Contact: {
          id: 'contact-1',
          firstName: 'John',
          lastName: 'Doe'
        }
      })

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/recording', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await recordingWebhook(request)
      expect(response.status).toBe(200)
      expect(prismaMock.call.update).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling and Retry Logic', () => {
    it('should handle database errors gracefully', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      }

      prismaMock.contact.findFirst.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: new URLSearchParams(webhookData),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(500)
    })

    it('should handle malformed webhook data', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhooks/twilio/voice', {
        method: 'POST',
        body: 'invalid-data',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(400)
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
          'X-Twilio-Signature': 'valid-signature'
        }
      })

      const response = await voiceWebhook(request)
      expect(response.status).toBe(400)
    })
  })
})
