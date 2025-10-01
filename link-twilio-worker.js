/**
 * Link Existing Twilio Worker to User
 * Finds and links an existing Twilio worker to the database user
 */

const { PrismaClient } = require('@prisma/client');
const twilio = require('twilio');

const prisma = new PrismaClient();

// Configuration
const USER_EMAIL = 'austin@kincommunications.com';
const WORKER_NAME = 'Austin Elkins'; // The friendly name in Twilio

// Twilio configuration from environment
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WORKSPACE_SID = process.env.TWILIO_WORKSPACE_SID;

function generateCuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function linkTwilioWorker() {
  console.log('🔗 Linking Twilio worker to user...\n');

  try {
    // Step 1: Find user
    console.log('👤 Finding user in database...');
    const user = await prisma.user.findUnique({
      where: { email: USER_EMAIL }
    });

    if (!user) {
      throw new Error(`User not found: ${USER_EMAIL}`);
    }
    console.log(`   ✓ Found user: ${user.id} (${user.email})`);

    // Step 2: Find Twilio worker
    console.log('\n📞 Finding Twilio worker...');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WORKSPACE_SID) {
      throw new Error('Missing Twilio credentials. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WORKSPACE_SID');
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // List all workers and find by friendly name
    const workers = await client.taskrouter.v1
      .workspaces(TWILIO_WORKSPACE_SID)
      .workers
      .list({ limit: 100 });

    console.log(`   Found ${workers.length} workers in Twilio workspace`);

    const twilioWorker = workers.find(w => w.friendlyName === WORKER_NAME);

    if (!twilioWorker) {
      console.log('\n   Available workers:');
      workers.forEach(w => console.log(`   - ${w.friendlyName} (${w.sid})`));
      throw new Error(`Worker not found with name: ${WORKER_NAME}`);
    }

    console.log(`   ✓ Found Twilio worker: ${twilioWorker.sid} (${twilioWorker.friendlyName})`);
    console.log(`   Activity: ${twilioWorker.activityName} (${twilioWorker.activitySid})`);
    console.log(`   Available: ${twilioWorker.available}`);
    console.log(`   Attributes: ${twilioWorker.attributes}`);

    // Step 3: Check if worker already exists in database
    console.log('\n💾 Checking database...');
    const existingWorker = await prisma.worker.findUnique({
      where: { twilioWorkerSid: twilioWorker.sid }
    });

    let dbWorker;

    if (existingWorker) {
      console.log(`   ✓ Worker already exists in database, updating link...`);

      // Update to link to this user
      dbWorker = await prisma.worker.update({
        where: { id: existingWorker.id },
        data: {
          userId: user.id,
          friendlyName: twilioWorker.friendlyName,
          attributes: JSON.parse(twilioWorker.attributes),
          activitySid: twilioWorker.activitySid,
          available: twilioWorker.available,
          updatedAt: new Date(),
        },
      });
      console.log('   ✓ Updated worker link');
    } else {
      console.log('   Creating new worker record in database...');

      // Create worker record
      dbWorker = await prisma.worker.create({
        data: {
          id: generateCuid(),
          twilioWorkerSid: twilioWorker.sid,
          userId: user.id,
          friendlyName: twilioWorker.friendlyName,
          attributes: JSON.parse(twilioWorker.attributes),
          activitySid: twilioWorker.activitySid,
          available: twilioWorker.available,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log('   ✓ Created worker record');
    }

    // Step 4: Update user with worker SID
    console.log('\n🔄 Updating user with worker SID...');
    await prisma.user.update({
      where: { id: user.id },
      data: { twilioWorkerSid: twilioWorker.sid },
    });
    console.log('   ✓ User updated');

    console.log('\n✅ Twilio worker linked successfully!\n');
    console.log('Details:');
    console.log(`   User: ${user.email} (${user.id})`);
    console.log(`   Worker: ${twilioWorker.friendlyName} (${twilioWorker.sid})`);
    console.log(`   Activity: ${twilioWorker.activityName}`);
    console.log(`   Available: ${twilioWorker.available}`);
    console.log('\n💡 You can now log in and receive tasks!\n');

  } catch (error) {
    console.error('❌ Error linking Twilio worker:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the link
linkTwilioWorker().catch(console.error);