/**
 * Fix User Email - Update to correct email
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const OLD_EMAIL = 'austin@kincommunications.com';
const CORRECT_EMAIL = 'austin@kinhome.com';
const TWILIO_WORKER_SID = 'WKb74733581d0bb71af3a1e2b9e9aa189c';

async function fixUserEmail() {
  console.log('📧 Fixing user email...\n');

  try {
    // Find the user with wrong email
    console.log('🔍 Finding user with incorrect email...');
    const wrongEmailUser = await prisma.user.findUnique({
      where: { email: OLD_EMAIL }
    });

    if (!wrongEmailUser) {
      console.log('   User with old email not found, checking if correct email exists...');
    } else {
      console.log(`   ✓ Found user: ${wrongEmailUser.id} (${wrongEmailUser.email})`);
    }

    // Find user with correct email
    const correctEmailUser = await prisma.user.findUnique({
      where: { email: CORRECT_EMAIL },
      include: { Worker: true }
    });

    if (correctEmailUser) {
      console.log(`   ✓ Found existing user with correct email: ${correctEmailUser.id}`);

      // Delete the wrong email user if it exists and move the worker link
      if (wrongEmailUser && wrongEmailUser.id !== correctEmailUser.id) {
        console.log('\n🗑️  Removing duplicate user with wrong email...');

        // First remove the worker link from wrong user
        await prisma.user.update({
          where: { id: wrongEmailUser.id },
          data: { twilioWorkerSid: null }
        });
        console.log('   ✓ Removed worker link from wrong user');

        // Now link worker to correct user
        if (correctEmailUser.twilioWorkerSid !== TWILIO_WORKER_SID) {
          console.log('🔗 Linking worker to correct user...');
          await prisma.user.update({
            where: { id: correctEmailUser.id },
            data: { twilioWorkerSid: TWILIO_WORKER_SID }
          });
          console.log('   ✓ Worker linked to correct user');
        }

        // Delete the wrong user
        await prisma.user.delete({
          where: { id: wrongEmailUser.id }
        });
        console.log('   ✓ Removed duplicate user');
      } else {
        // Make sure this user has the worker linked
        if (correctEmailUser.twilioWorkerSid !== TWILIO_WORKER_SID) {
          console.log('\n🔗 Linking worker to correct user...');
          await prisma.user.update({
            where: { id: correctEmailUser.id },
            data: { twilioWorkerSid: TWILIO_WORKER_SID }
          });
          console.log('   ✓ Worker linked');
        } else {
          console.log('   ✓ Worker already linked to this user');
        }
      }
    } else if (wrongEmailUser) {
      // Just update the email
      console.log('\n✏️  Updating email address...');
      await prisma.user.update({
        where: { id: wrongEmailUser.id },
        data: { email: CORRECT_EMAIL }
      });
      console.log('   ✓ Email updated');
    } else {
      throw new Error('No user found with either email address');
    }

    // Verify final state
    const finalUser = await prisma.user.findUnique({
      where: { email: CORRECT_EMAIL },
      include: { Worker: true }
    });

    console.log('\n✅ User email fixed!\n');
    console.log('Details:');
    console.log(`   Email: ${finalUser.email}`);
    console.log(`   Name: ${finalUser.name}`);
    console.log(`   User ID: ${finalUser.id}`);
    console.log(`   Worker SID: ${finalUser.twilioWorkerSid}`);
    console.log(`   Worker Name: ${finalUser.Worker?.friendlyName || 'N/A'}`);
    console.log('\n💡 You can now log in at http://localhost:3000/login');
    console.log(`   Email: ${finalUser.email}`);
    console.log('   Password: anything (validation disabled in dev mode)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixUserEmail().catch(console.error);