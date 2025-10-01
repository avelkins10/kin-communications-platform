import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Create test users
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER'
      }
    })
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'ADMIN'
      }
    })
    
    console.log('✅ Created test users')
    
    // Create test contacts
    const contacts = [
      {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales',
        userId: testUser.id
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+15551234568',
        email: 'jane.smith@example.com',
        department: 'Marketing',
        userId: testUser.id
      },
      {
        firstName: 'Bob',
        lastName: 'Johnson',
        phone: '+15551234569',
        email: 'bob.johnson@example.com',
        department: 'Engineering',
        userId: adminUser.id
      }
    ]
    
    for (const contactData of contacts) {
      await prisma.contact.upsert({
        where: { phone: contactData.phone },
        update: {},
        create: contactData
      })
    }
    
    console.log('✅ Created test contacts')
    
    // Create test sessions
    await prisma.session.upsert({
      where: { sessionToken: 'test-session-token' },
      update: {},
      create: {
        userId: testUser.id,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        sessionToken: 'test-session-token'
      }
    })
    
    console.log('✅ Created test sessions')
    
    // Create test webhook logs
    const webhookLogs = [
      {
        type: 'voice' as const,
        payload: {
          CallSid: 'test-call-sid',
          From: '+15551234567',
          To: '+15551234568',
          CallStatus: 'completed',
          Direction: 'inbound',
          Duration: '60'
        },
        processed: true
      },
      {
        type: 'sms' as const,
        payload: {
          MessageSid: 'test-message-sid',
          From: '+15551234567',
          To: '+15551234568',
          Body: 'Test message',
          MessageStatus: 'delivered'
        },
        processed: true
      }
    ]
    
    for (const webhookData of webhookLogs) {
      await prisma.webhookLog.create({
        data: webhookData
      })
    }
    
    console.log('✅ Created test webhook logs')
    
    console.log('🎉 Database seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seed()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
