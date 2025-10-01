import { FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')
  
  // Initialize test database
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kin_communications_e2e'
      }
    }
  })
  
  try {
    // Connect to database
    await prisma.$connect()
    console.log('✅ Connected to test database for cleanup')
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...')
    await cleanupTestData(prisma)
    
    console.log('✅ Global teardown completed successfully')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await prisma.$disconnect()
  }
}

async function cleanupTestData(prisma: PrismaClient) {
  // Delete test data in reverse order of dependencies
  await prisma.webhookLog.deleteMany({
    where: {
      OR: [
        { payload: { path: ['CallSid'], equals: 'test-call-sid' } },
        { payload: { path: ['MessageSid'], equals: 'test-message-sid' } }
      ]
    }
  })
  
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { phone: '+15551234567' },
        { phone: '+15551234568' }
      ]
    }
  })
  
  await prisma.session.deleteMany({
    where: {
      OR: [
        { sessionToken: 'test-session-token' },
        { sessionToken: { contains: 'test' } }
      ]
    }
  })
  
  await prisma.account.deleteMany({
    where: {
      OR: [
        { providerAccountId: { contains: 'test' } }
      ]
    }
  })
  
  await prisma.verificationToken.deleteMany({
    where: {
      OR: [
        { token: { contains: 'test' } }
      ]
    }
  })
  
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'test@example.com' },
        { email: 'admin@example.com' }
      ]
    }
  })
  
  console.log('✅ Test data cleaned up successfully')
}

export default globalTeardown
