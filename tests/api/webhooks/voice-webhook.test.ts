import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as voiceWebhook } from '@/app/api/webhooks/twilio/voice/route'
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

// Mock Quickbase service
vi.mock('@/lib/quickbase/service', () => ({
  quickbaseService: {
    findCustomerByPhone: vi.fn()
  }
}))

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn()
}))

describe('Voice Webhook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default environment variables
    process.env.DEFAULT_EMPLOYEE_NUMBER = '+15551234568'
    process.env.QUICKBASE_ENABLED = 'true'
  })

  afterEach(async () => {
    await testUtils.cleanup()
  })

  describe('Signature Validation', () => {
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
      expect(response.status).toBe(200)
    })

    it('should reject invalid Twilio signature', async () => {
      vi.mocked(require('@/lib/twilio/signature').verifyTwilioSignature).mockReturnValue(false)

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
      expect(response.status).toBe(401)
    })
  })

  describe('Call/User Assignment', () => {
    it('should assign call to local project coordinator when contact exists', async () => {
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

    it('should assign call to Quickbase project coordinator when found', async () => {
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
        twilioCallSid: 'CA1234567890abcdef',
        direction: 'INBOUND',
        status: 'RINGING',
        fromNumber: '+15551234567',
        toNumber: '+15551234568',
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
      
      // Verify call was updated with Quickbase coordinator
      expect(prismaMock.call.update).toHaveBeenCalledWith({
        where: { id: 'call-1' },
        data: { userId: 'qb-coordinator-1' }
      })
    })

    it('should assign call to default employee when no coordinator found', async () => {
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

  describe('TwiML Responses', () => {
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

    it('should customize routing message for project coordinator', async () => {
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
        email: 'coordinator@example.com',
        PhoneNumber: [{
          phoneNumber: '+15551234569',
          status: 'active'
        }]
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

      const mockAnswerWithRecording = vi.mocked(require('@/lib/twilio/twiml').answerWithRecording)
      mockAnswerWithRecording.mockReturnValue('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Connecting you to your project coordinator, Project Coordinator.</Say><Dial>+15551234569</Dial></Response>')

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
      expect(twiml).toContain('Connecting you to your project coordinator, Project Coordinator.')
    })
  })

  describe('Retry-Safe Behavior', () => {
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

    it('should handle Quickbase service failures gracefully', async () => {
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

      // Mock Quickbase service failure
      const mockQuickbaseService = require('@/lib/quickbase/service').quickbaseService
      mockQuickbaseService.findCustomerByPhone.mockRejectedValue(new Error('Quickbase API error'))

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
      expect(response.status).toBe(200) // Should still succeed despite Quickbase failure
    })
  })
})

