import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  formatPhoneNumber, 
  validatePhoneNumber, 
  formatDate, 
  formatTime,
  generateId,
  sanitizeInput,
  parseTwilioWebhook,
  validateTwilioSignature,
  formatCurrency,
  truncateText,
  isValidEmail,
  generateRandomString,
  hashPassword,
  comparePassword,
  createJWT,
  verifyJWT,
  debounce,
  throttle
} from '@/lib/utils'

// Mock crypto for testing
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => Buffer.from('test-random-bytes')),
  createHash: vi.fn(() => ({
    update: vi.fn().returnThis(),
    digest: vi.fn(() => 'hashed-password')
  })),
  createHmac: vi.fn(() => ({
    update: vi.fn().returnThis(),
    digest: vi.fn(() => 'test-signature')
  }))
}))

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  hash: vi.fn(() => Promise.resolve('hashed-password')),
  compare: vi.fn(() => Promise.resolve(true))
}))

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(() => 'test-jwt-token'),
  verify: vi.fn(() => ({ userId: 'test-user-id' }))
}))

describe('Utility Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('formatPhoneNumber', () => {
    it('should format valid phone numbers correctly', () => {
      expect(formatPhoneNumber('+15551234567')).toBe('+1 (555) 123-4567')
      expect(formatPhoneNumber('15551234567')).toBe('+1 (555) 123-4567')
      expect(formatPhoneNumber('5551234567')).toBe('+1 (555) 123-4567')
    })

    it('should handle invalid phone numbers', () => {
      expect(formatPhoneNumber('invalid')).toBe('invalid')
      expect(formatPhoneNumber('')).toBe('')
      expect(formatPhoneNumber('123')).toBe('123')
    })

    it('should handle international numbers', () => {
      expect(formatPhoneNumber('+44123456789')).toBe('+44 123 456 789')
      expect(formatPhoneNumber('+33123456789')).toBe('+33 1 23 45 67 89')
    })
  })

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhoneNumber('+15551234567')).toBe(true)
      expect(validatePhoneNumber('15551234567')).toBe(true)
      expect(validatePhoneNumber('+44123456789')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(validatePhoneNumber('invalid')).toBe(false)
      expect(validatePhoneNumber('123')).toBe(false)
      expect(validatePhoneNumber('')).toBe(false)
      expect(validatePhoneNumber('555-123-4567')).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('January 15, 2024')
      expect(formatDate(date, 'short')).toBe('1/15/2024')
      expect(formatDate(date, 'long')).toBe('Monday, January 15, 2024')
    })

    it('should handle invalid dates', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date')
    })
  })

  describe('formatTime', () => {
    it('should format times correctly', () => {
      const date = new Date('2024-01-15T14:30:00Z')
      expect(formatTime(date)).toBe('2:30 PM')
      expect(formatTime(date, '24h')).toBe('14:30')
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
    })

    it('should generate IDs with correct length', () => {
      const id = generateId()
      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('sanitizeInput', () => {
    it('should sanitize HTML input', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")')
      expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello World')
      expect(sanitizeInput('Normal text')).toBe('Normal text')
    })

    it('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null)).toBe('')
      expect(sanitizeInput(undefined)).toBe('')
    })
  })

  describe('parseTwilioWebhook', () => {
    it('should parse Twilio webhook data correctly', () => {
      const webhookData = {
        CallSid: 'test-call-sid',
        From: '+15551234567',
        To: '+15551234567',
        CallStatus: 'completed'
      }

      const parsed = parseTwilioWebhook(webhookData)
      expect(parsed.callSid).toBe('test-call-sid')
      expect(parsed.from).toBe('+15551234567')
      expect(parsed.to).toBe('+15551234567')
      expect(parsed.status).toBe('completed')
    })

    it('should handle missing fields', () => {
      const webhookData = { CallSid: 'test-call-sid' }
      const parsed = parseTwilioWebhook(webhookData)
      expect(parsed.callSid).toBe('test-call-sid')
      expect(parsed.from).toBeUndefined()
    })
  })

  describe('validateTwilioSignature', () => {
    it('should validate correct Twilio signatures', () => {
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

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(999.99)).toBe('$999.99')
    })

    it('should handle different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated'
      expect(truncateText(longText, 20)).toBe('This is a very long...')
      expect(truncateText(longText, 10)).toBe('This is a...')
    })

    it('should not truncate short text', () => {
      const shortText = 'Short text'
      expect(truncateText(shortText, 20)).toBe('Short text')
    })

    it('should handle custom suffix', () => {
      const longText = 'This is a very long text'
      expect(truncateText(longText, 10, '...')).toBe('This is a...')
      expect(truncateText(longText, 10, ' [more]')).toBe('This is a [more]')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('user+tag@example.org')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('generateRandomString', () => {
    it('should generate random strings of correct length', () => {
      const str1 = generateRandomString(10)
      const str2 = generateRandomString(20)
      
      expect(str1.length).toBe(10)
      expect(str2.length).toBe(20)
      expect(str1).not.toBe(str2)
    })

    it('should generate different strings each time', () => {
      const str1 = generateRandomString(10)
      const str2 = generateRandomString(10)
      
      expect(str1).not.toBe(str2)
    })
  })

  describe('hashPassword', () => {
    it('should hash passwords', async () => {
      const password = 'test-password'
      const hashed = await hashPassword(password)
      
      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(password)
      expect(typeof hashed).toBe('string')
    })
  })

  describe('comparePassword', () => {
    it('should compare passwords correctly', async () => {
      const password = 'test-password'
      const hashed = await hashPassword(password)
      
      expect(await comparePassword(password, hashed)).toBe(true)
      expect(await comparePassword('wrong-password', hashed)).toBe(false)
    })
  })

  describe('createJWT', () => {
    it('should create JWT tokens', () => {
      const payload = { userId: 'test-user-id' }
      const token = createJWT(payload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })
  })

  describe('verifyJWT', () => {
    it('should verify JWT tokens', () => {
      const payload = { userId: 'test-user-id' }
      const token = createJWT(payload)
      const verified = verifyJWT(token)
      
      expect(verified).toBeDefined()
      expect(verified.userId).toBe('test-user-id')
    })
  })

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)
      
      debouncedFn()
      debouncedFn()
      debouncedFn()
      
      expect(mockFn).not.toHaveBeenCalled()
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn()
      const throttledFn = throttle(mockFn, 100)
      
      throttledFn()
      throttledFn()
      throttledFn()
      
      expect(mockFn).toHaveBeenCalledTimes(1)
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      throttledFn()
      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })
})
