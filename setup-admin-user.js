/**
 * Setup Admin User Script
 * Creates a fully configured admin user with Twilio Worker integration
 */

const { PrismaClient } = require('@prisma/client');
const twilio = require('twilio');

const prisma = new PrismaClient();

// Configuration - update these values
const ADMIN_CONFIG = {
  email: 'austin@kincommunications.com', // Change this to your email
  name: 'Austin Elkins',
  department: 'Admin',
  skills: ['admin', 'support', 'sales'], // Your available skills
  phoneNumber: '+1234567890', // Your phone number for routing (optional)
};

// Twilio configuration from environment
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WORKSPACE_SID = process.env.TWILIO_WORKSPACE_SID;

function generateCuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function setupAdminUser() {
  console.log('🚀 Setting up admin user...\n');

  try {
    // Step 1: Create or update user in database
    console.log('📝 Creating/updating user in database...');

    let user = await prisma.user.findUnique({
      where: { email: ADMIN_CONFIG.email }
    });

    const userData = {
      email: ADMIN_CONFIG.email,
      name: ADMIN_CONFIG.name,
      department: ADMIN_CONFIG.department,
      skills: ADMIN_CONFIG.skills,
      updatedAt: new Date(),
    };

    if (user) {
      console.log(`   ✓ Found existing user: ${user.id}`);
      user = await prisma.user.update({
        where: { id: user.id },
        data: userData,
      });
      console.log('   ✓ Updated user details');
    } else {
      user = await prisma.user.create({
        data: {
          id: generateCuid(),
          ...userData,
          createdAt: new Date(),
        },
      });
      console.log(`   ✓ Created new user: ${user.id}`);
    }

    // Step 2: Create Twilio Worker if credentials are provided
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WORKSPACE_SID) {
      console.log('\n📞 Setting up Twilio Worker...');

      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

      // Check if worker already exists
      let existingWorker = await prisma.worker.findUnique({
        where: { userId: user.id }
      });

      let twilioWorker;

      if (existingWorker) {
        console.log(`   ✓ Found existing worker: ${existingWorker.twilioWorkerSid}`);

        // Update Twilio worker
        try {
          twilioWorker = await client.taskrouter.v1
            .workspaces(TWILIO_WORKSPACE_SID)
            .workers(existingWorker.twilioWorkerSid)
            .update({
              friendlyName: ADMIN_CONFIG.name,
              attributes: JSON.stringify({
                skills: ADMIN_CONFIG.skills,
                department: ADMIN_CONFIG.department,
                email: ADMIN_CONFIG.email,
                contact_uri: ADMIN_CONFIG.phoneNumber,
              }),
            });
          console.log('   ✓ Updated Twilio worker');
        } catch (error) {
          console.log(`   ⚠ Could not update Twilio worker: ${error.message}`);
          twilioWorker = null;
        }
      } else {
        // Create new Twilio worker
        try {
          twilioWorker = await client.taskrouter.v1
            .workspaces(TWILIO_WORKSPACE_SID)
            .workers
            .create({
              friendlyName: ADMIN_CONFIG.name,
              attributes: JSON.stringify({
                skills: ADMIN_CONFIG.skills,
                department: ADMIN_CONFIG.department,
                email: ADMIN_CONFIG.email,
                contact_uri: ADMIN_CONFIG.phoneNumber,
              }),
            });
          console.log(`   ✓ Created Twilio worker: ${twilioWorker.sid}`);
        } catch (error) {
          console.log(`   ⚠ Could not create Twilio worker: ${error.message}`);
          twilioWorker = null;
        }
      }

      // Update database with worker info
      if (twilioWorker) {
        if (existingWorker) {
          await prisma.worker.update({
            where: { id: existingWorker.id },
            data: {
              friendlyName: ADMIN_CONFIG.name,
              attributes: {
                skills: ADMIN_CONFIG.skills,
                department: ADMIN_CONFIG.department,
                email: ADMIN_CONFIG.email,
                contact_uri: ADMIN_CONFIG.phoneNumber,
              },
              updatedAt: new Date(),
            },
          });
          console.log('   ✓ Updated worker in database');
        } else {
          await prisma.worker.create({
            data: {
              id: generateCuid(),
              twilioWorkerSid: twilioWorker.sid,
              userId: user.id,
              friendlyName: ADMIN_CONFIG.name,
              attributes: {
                skills: ADMIN_CONFIG.skills,
                department: ADMIN_CONFIG.department,
                email: ADMIN_CONFIG.email,
                contact_uri: ADMIN_CONFIG.phoneNumber,
              },
              available: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          console.log('   ✓ Created worker in database');
        }

        // Update user with worker SID
        await prisma.user.update({
          where: { id: user.id },
          data: { twilioWorkerSid: twilioWorker.sid },
        });
      }
    } else {
      console.log('\n⚠️  Twilio credentials not found - skipping worker setup');
      console.log('   Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WORKSPACE_SID to enable worker creation');
    }

    console.log('\n✅ Admin user setup complete!\n');
    console.log('User Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Department: ${user.department}`);
    console.log(`   Skills: ${user.skills.join(', ')}`);
    console.log(`   User ID: ${user.id}`);
    if (user.twilioWorkerSid) {
      console.log(`   Twilio Worker SID: ${user.twilioWorkerSid}`);
    }
    console.log('\n💡 You can now log in at http://localhost:3000/login');
    console.log('   Use your email and any password (password validation is disabled in dev mode)\n');

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupAdminUser().catch(console.error);