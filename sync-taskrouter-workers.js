const { PrismaClient } = require('@prisma/client');
const twilio = require('twilio');

const prisma = new PrismaClient();

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const workspaceSid = process.env.TWILIO_WORKSPACE_SID;

const client = twilio(accountSid, authToken);

function generateCuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function syncWorkers() {
  try {
    console.log('Starting TaskRouter worker sync...\n');

    if (!workspaceSid) {
      console.error('Error: TWILIO_WORKSPACE_SID environment variable not set');
      return;
    }

    // Fetch all workers from Twilio TaskRouter
    console.log('Fetching workers from Twilio TaskRouter...');
    const twilioWorkers = await client.taskrouter.v1
      .workspaces(workspaceSid)
      .workers
      .list();

    console.log(`Found ${twilioWorkers.length} workers in Twilio TaskRouter\n`);

    for (const twilioWorker of twilioWorkers) {
      console.log(`Processing worker: ${twilioWorker.friendlyName} (${twilioWorker.sid})`);

      // Parse attributes
      let attributes = {};
      try {
        attributes = JSON.parse(twilioWorker.attributes);
      } catch (e) {
        console.log('  - Could not parse worker attributes, using empty object');
      }

      // Check if worker already exists in database
      const existingWorker = await prisma.worker.findUnique({
        where: { twilioWorkerSid: twilioWorker.sid }
      });

      if (existingWorker) {
        console.log(`  - Worker already exists in database, updating...`);

        await prisma.worker.update({
          where: { twilioWorkerSid: twilioWorker.sid },
          data: {
            friendlyName: twilioWorker.friendlyName,
            attributes: attributes,
            activitySid: twilioWorker.activitySid,
            available: twilioWorker.available,
            updatedAt: new Date(),
          }
        });

        console.log(`  ✓ Updated worker in database\n`);
        continue;
      }

      // Check if user exists with matching email
      let userId = null;
      let user = null;

      if (attributes.email) {
        user = await prisma.user.findUnique({
          where: { email: attributes.email },
          include: { Worker: true }
        });

        if (user) {
          // Check if this user already has a worker
          if (user.Worker) {
            console.log(`  - User ${attributes.email} already has a worker (${user.Worker.twilioWorkerSid})`);
            console.log(`  - Skipping duplicate worker ${twilioWorker.sid}\n`);
            continue;
          }

          userId = user.id;
          console.log(`  - Found matching user by email: ${attributes.email}`);

          // Update user with worker SID
          await prisma.user.update({
            where: { id: userId },
            data: { twilioWorkerSid: twilioWorker.sid }
          });
        }
      }

      // If no user found, create one
      if (!userId) {
        console.log(`  - No user found, creating new user...`);
        const newUser = await prisma.user.create({
          data: {
            id: generateCuid(),
            email: attributes.email || `worker-${twilioWorker.sid}@taskrouter.local`,
            name: twilioWorker.friendlyName || attributes.name || 'TaskRouter Worker',
            twilioWorkerSid: twilioWorker.sid,
            skills: attributes.skills || [],
            department: attributes.department || null,
            updatedAt: new Date(),
          }
        });
        userId = newUser.id;
        console.log(`  ✓ Created user: ${newUser.email}`);
      }

      // Create worker in database
      await prisma.worker.create({
        data: {
          id: generateCuid(),
          twilioWorkerSid: twilioWorker.sid,
          userId: userId,
          friendlyName: twilioWorker.friendlyName,
          attributes: attributes,
          activitySid: twilioWorker.activitySid,
          available: twilioWorker.available,
          updatedAt: new Date(),
        }
      });

      console.log(`  ✓ Created worker in database\n`);
    }

    // Summary
    console.log('\n=== Sync Summary ===');
    const totalWorkers = await prisma.worker.count();
    const totalUsers = await prisma.user.count();
    console.log(`Total workers in database: ${totalWorkers}`);
    console.log(`Total users in database: ${totalUsers}`);
    console.log('\nSync completed successfully!');

  } catch (error) {
    console.error('Error syncing workers:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

syncWorkers();