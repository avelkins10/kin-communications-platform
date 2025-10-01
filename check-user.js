const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'austin@kinhome.com' }
    });

    console.log('User found:', JSON.stringify(user, null, 2));

    // Also check total user count
    const totalUsers = await prisma.user.count();
    console.log('\nTotal users in database:', totalUsers);

    // List all users
    const allUsers = await prisma.user.findMany();
    console.log('\nAll users:', JSON.stringify(allUsers, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();