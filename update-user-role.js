const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    // Update user to admin role
    const updatedUser = await prisma.user.update({
      where: { email: 'austin@kinhome.com' },
      data: {
        role: 'admin'
      }
    });

    console.log('Updated user:', JSON.stringify(updatedUser, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();