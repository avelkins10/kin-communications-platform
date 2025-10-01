import { chromium, FullConfig } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import TD from './utils/test-data'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...')
  
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
    console.log('✅ Connected to test database')
    
    // Run database migrations
    console.log('🔄 Running database migrations...')
    // Note: In a real setup, you might want to run migrations here
    // For now, we'll assume migrations are handled by the CI/CD pipeline
    
    // Seed test data
    console.log('🌱 Seeding test data...')
    await seedTestData(prisma)
    
    console.log('✅ Global setup completed successfully')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

async function seedTestData(prisma: PrismaClient) {
  console.log('🌱 Seeding test users...')
  
  // Create test users with correct roles
  const adminUser = await prisma.user.upsert({
    where: { email: TD.TEST_USERS.admin.email },
    update: {},
    create: {
      email: TD.TEST_USERS.admin.email,
      name: TD.TEST_USERS.admin.name,
      role: TD.TEST_USERS.admin.role,
      phone: TD.TEST_USERS.admin.phone,
      isActive: TD.TEST_USERS.admin.isActive,
    }
  })
  
  const agentUser = await prisma.user.upsert({
    where: { email: TD.TEST_USERS.agent.email },
    update: {},
    create: {
      email: TD.TEST_USERS.agent.email,
      name: TD.TEST_USERS.agent.name,
      role: TD.TEST_USERS.agent.role,
      phone: TD.TEST_USERS.agent.phone,
      isActive: TD.TEST_USERS.agent.isActive,
    }
  })
  
  const supervisorUser = await prisma.user.upsert({
    where: { email: TD.TEST_USERS.supervisor.email },
    update: {},
    create: {
      email: TD.TEST_USERS.supervisor.email,
      name: TD.TEST_USERS.supervisor.name,
      role: TD.TEST_USERS.supervisor.role,
      phone: TD.TEST_USERS.supervisor.phone,
      isActive: TD.TEST_USERS.supervisor.isActive,
    }
  })
  
  console.log('🌱 Seeding test contacts...')
  
  // Create test contacts
  const customerContact = await prisma.contact.upsert({
    where: { phone: TD.TEST_CONTACTS.customer1.phone },
    update: {},
    create: {
      firstName: TD.TEST_CONTACTS.customer1.name.split(' ')[0],
      lastName: TD.TEST_CONTACTS.customer1.name.split(' ')[1],
      phone: TD.TEST_CONTACTS.customer1.phone,
      email: TD.TEST_CONTACTS.customer1.email,
      company: TD.TEST_CONTACTS.customer1.company,
      userId: agentUser.id, // Assign to an agent for testing
    }
  })
  
  const customer2Contact = await prisma.contact.upsert({
    where: { phone: TD.TEST_CONTACTS.customer2.phone },
    update: {},
    create: {
      firstName: TD.TEST_CONTACTS.customer2.name.split(' ')[0],
      lastName: TD.TEST_CONTACTS.customer2.name.split(' ')[1],
      phone: TD.TEST_CONTACTS.customer2.phone,
      email: TD.TEST_CONTACTS.customer2.email,
      company: TD.TEST_CONTACTS.customer2.company,
      userId: agentUser.id,
    }
  })
  
  console.log('🌱 Seeding test phone numbers...')
  
  // Create test phone numbers
  await prisma.phoneNumber.upsert({
    where: { number: TD.TEST_PHONE_NUMBERS.main.number },
    update: {},
    create: {
      number: TD.TEST_PHONE_NUMBERS.main.number,
      friendlyName: TD.TEST_PHONE_NUMBERS.main.friendlyName,
      type: TD.TEST_PHONE_NUMBERS.main.type,
      isActive: TD.TEST_PHONE_NUMBERS.main.isActive,
    }
  })
  
  await prisma.phoneNumber.upsert({
    where: { number: TD.TEST_PHONE_NUMBERS.support.number },
    update: {},
    create: {
      number: TD.TEST_PHONE_NUMBERS.support.number,
      friendlyName: TD.TEST_PHONE_NUMBERS.support.friendlyName,
      type: TD.TEST_PHONE_NUMBERS.support.type,
      isActive: TD.TEST_PHONE_NUMBERS.support.isActive,
    }
  })
  
  console.log('🌱 Seeding test communications...')
  
  // Create sample test communications
  await prisma.call.createMany({
    data: Object.values(TD.TEST_CALLS).map(call => ({
      twilioCallSid: call.sid,
      from: call.from,
      to: call.to,
      status: call.status,
      direction: call.direction,
      duration: call.duration,
      recordingUrl: call.recordingUrl,
      userId: agentUser.id,
      contactId: customerContact.id,
    })),
    skipDuplicates: true
  })
  
  await prisma.message.createMany({
    data: Object.values(TD.TEST_MESSAGES).map(message => ({
      twilioMessageSid: message.sid,
      from: message.from,
      to: message.to,
      body: message.body,
      direction: message.direction,
      status: message.status,
      userId: agentUser.id,
      contactId: customerContact.id,
    })),
    skipDuplicates: true
  })
  
  await prisma.voicemail.createMany({
    data: Object.values(TD.TEST_VOICEMAILS).map(voicemail => ({
      twilioRecordingSid: voicemail.sid,
      from: voicemail.from,
      to: voicemail.to,
      transcription: voicemail.transcription,
      recordingUrl: voicemail.recordingUrl,
      duration: voicemail.duration,
      priority: voicemail.priority,
      status: voicemail.status,
      userId: agentUser.id,
      contactId: customerContact.id,
    })),
    skipDuplicates: true
  })
  
  console.log('✅ Test data seeded successfully')
  console.log(`   - Users: ${adminUser.email}, ${agentUser.email}, ${supervisorUser.email}`)
  console.log(`   - Contacts: ${customerContact.phone}, ${customer2Contact.phone}`)
  console.log(`   - Phone Numbers: ${TD.TEST_PHONE_NUMBERS.main.number}, ${TD.TEST_PHONE_NUMBERS.support.number}`)
}

export default globalSetup
