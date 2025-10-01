/**
 * Fix Worker Link - Remove duplicate and link correctly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const USER_EMAIL = 'austin@kincommunications.com';
const TWILIO_WORKER_SID = 'WKb74733581d0bb71af3a1e2b9e9aa189c';

async function fixWorkerLink() {
  console.log('🔧 Fixing worker link...\n');

  try {
    // Find all users with this worker SID
    console.log('🔍 Finding duplicate users with this worker SID...');
    const usersWithWorkerSid = await prisma.user.findMany({
      where: { twilioWorkerSid: TWILIO_WORKER_SID }
    });

    console.log(`   Found ${usersWithWorkerSid.length} users with worker SID ${TWILIO_WORKER_SID}`);
    usersWithWorkerSid.forEach(u => {
      console.log(`   - ${u.email} (${u.id})`);
    });

    // Find our target user
    console.log('\n👤 Finding target user...');
    const targetUser = await prisma.user.findUnique({
      where: { email: USER_EMAIL }
    });

    if (!targetUser) {
      throw new Error(`User not found: ${USER_EMAIL}`);
    }
    console.log(`   ✓ Target user: ${targetUser.email} (${targetUser.id})`);

    // Remove worker SID from other users
    console.log('\n🧹 Cleaning up duplicate links...');
    for (const user of usersWithWorkerSid) {
      if (user.id !== targetUser.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { twilioWorkerSid: null }
        });
        console.log(`   ✓ Removed worker link from ${user.email}`);
      }
    }

    // Now link to target user
    console.log('\n🔗 Linking worker to target user...');
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { twilioWorkerSid: TWILIO_WORKER_SID }
    });
    console.log('   ✓ Worker linked successfully');

    // Verify
    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUser.id },
      include: { Worker: true }
    });

    console.log('\n✅ Worker link fixed!\n');
    console.log('Details:');
    console.log(`   User: ${updatedUser.email}`);
    console.log(`   Worker SID: ${updatedUser.twilioWorkerSid}`);
    console.log(`   Worker Name: ${updatedUser.Worker?.friendlyName || 'N/A'}`);
    console.log('\n💡 You can now log in and receive tasks!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixWorkerLink().catch(console.error);