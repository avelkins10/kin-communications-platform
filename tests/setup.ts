import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'
import { Server } from 'socket.io'
import { createServer } from 'http'

// Mock Prisma Client
export const prismaMock = mockDeep<PrismaClient>()

// Mock Socket.io Server
export const mockSocketServer = mockDeep<Server>()

// Mock HTTP Server
export const mockHttpServer = mockDeep<ReturnType<typeof createServer>>()

// Global test database client
let testPrisma: PrismaClient

// Test environment setup
beforeAll(async () => {
  // Set up test database connection
  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kin_communications_test'
      }
    }
  })
  
  // Connect to test database
  await testPrisma.$connect()
  
  // Run database migrations
  await testPrisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS test`
  
  // Set up global mocks
  global.prisma = prismaMock
  global.socketServer = mockSocketServer
  global.httpServer = mockHttpServer
})

// Clean up after all tests
afterAll(async () => {
  // Disconnect from test database
  await testPrisma.$disconnect()
  
  // Clean up global mocks
  delete global.prisma
  delete global.socketServer
  delete global.httpServer
})

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock)
  mockReset(mockSocketServer)
  mockReset(mockHttpServer)
})

// Clean up after each test
afterEach(async () => {
  // Clean up test data
  await testPrisma.contact.deleteMany()
  await testPrisma.user.deleteMany()
  await testPrisma.webhookLog.deleteMany()
  await testPrisma.session.deleteMany()
  await testPrisma.account.deleteMany()
  await testPrisma.verificationToken.deleteMany()
})

// Mock Twilio SDK
vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        sid: 'test-message-sid',
        status: 'sent',
        to: '+15551234567',
        from: '+15551234567',
        body: 'Test message'
      })
    },
    calls: {
      create: vi.fn().mockResolvedValue({
        sid: 'test-call-sid',
        status: 'initiated',
        to: '+15551234567',
        from: '+15551234567'
      })
    },
    recordings: {
      list: vi.fn().mockResolvedValue([])
    },
    transcriptions: {
      list: vi.fn().mockResolvedValue([])
    }
  }))
}))

// Mock NextAuth
vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: {
      GET: vi.fn(),
      POST: vi.fn()
    },
    auth: vi.fn().mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      },
      session: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER'
        }
      }
    })
  })),
  NextAuthConfig: vi.fn()
}))

// Mock Socket.io
vi.mock('socket.io', () => ({
  Server: vi.fn(() => mockSocketServer)
}))

// Mock HTTP server
vi.mock('http', () => ({
  createServer: vi.fn(() => mockHttpServer)
}))

// Mock Quickbase SDK
vi.mock('@/lib/quickbase', () => ({
  quickbaseClient: {
    query: vi.fn().mockResolvedValue({
      data: [],
      fields: [],
      metadata: {}
    }),
    insert: vi.fn().mockResolvedValue({
      data: [{ recordId: 'test-record-id' }]
    }),
    update: vi.fn().mockResolvedValue({
      data: [{ recordId: 'test-record-id' }]
    }),
    delete: vi.fn().mockResolvedValue({
      data: [{ recordId: 'test-record-id' }]
    })
  }
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.NEXTAUTH_SECRET = 'test-secret-key'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/kin_communications_test'
process.env.TWILIO_ACCOUNT_SID = 'test-account-sid'
process.env.TWILIO_AUTH_TOKEN = 'test-auth-token'
process.env.TWILIO_PHONE_NUMBER = '+15551234567'
process.env.TWILIO_WEBHOOK_URL = 'https://test.ngrok.io'
process.env.QUICKBASE_REALM = 'test-realm'
process.env.QUICKBASE_USER_TOKEN = 'test-user-token'
process.env.QUICKBASE_APP_ID = 'test-app-id'
process.env.SOCKET_IO_CORS_ORIGIN = 'http://localhost:3000'

// Test utilities
export const testUtils = {
  // Create test user
  createTestUser: async (overrides = {}) => {
    return await testPrisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        ...overrides
      }
    })
  },
  
  // Create test contact
  createTestContact: async (overrides = {}) => {
    return await testPrisma.contact.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales',
        ...overrides
      }
    })
  },
  
  // Create test session
  createTestSession: async (userId: string, overrides = {}) => {
    return await testPrisma.session.create({
      data: {
        userId,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        sessionToken: 'test-session-token',
        ...overrides
      }
    })
  },
  
  // Mock Twilio webhook payload
  createTwilioWebhookPayload: (overrides = {}) => ({
    CallSid: 'test-call-sid',
    From: '+15551234567',
    To: '+15551234567',
    CallStatus: 'completed',
    Direction: 'inbound',
    Duration: '60',
    ...overrides
  }),
  
  // Mock SMS webhook payload
  createSMSWebhookPayload: (overrides = {}) => ({
    MessageSid: 'test-message-sid',
    From: '+15551234567',
    To: '+15551234567',
    Body: 'Test message',
    MessageStatus: 'delivered',
    ...overrides
  }),
  
  // Generate Twilio signature
  generateTwilioSignature: (url: string, params: Record<string, string>, authToken: string) => {
    // Simple mock signature for testing
    return 'test-signature'
  },
  
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Clean up test data
  cleanup: async () => {
    await testPrisma.contact.deleteMany()
    await testPrisma.user.deleteMany()
    await testPrisma.webhookLog.deleteMany()
    await testPrisma.session.deleteMany()
    await testPrisma.account.deleteMany()
    await testPrisma.verificationToken.deleteMany()
  }
}

// Global test helpers
declare global {
  var prisma: DeepMockProxy<PrismaClient>
  var socketServer: DeepMockProxy<Server>
  var httpServer: DeepMockProxy<ReturnType<typeof createServer>>
  var testUtils: typeof testUtils
}

global.testUtils = testUtils
