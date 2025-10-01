const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    // Update user using raw SQL
    const result = await prisma.$executeRaw`
      UPDATE "User"
      SET role = 'admin', "isActive" = true
      WHERE email = 'austin@kinhome.com'
    `;

    console.log('Updated rows:', result);

    // Verify the update
    const user = await prisma.$queryRaw`
      SELECT id, email, name, role, "isActive", "quickbaseUserId"
      FROM "User"
      WHERE email = 'austin@kinhome.com'
    `;

    console.log('User after update:', JSON.stringify(user, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();