const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    // Use raw SQL to bypass Prisma client cache
    const users = await prisma.$queryRaw`
      SELECT id, email, name, role, "isActive", "createdAt"
      FROM "User"
      WHERE email = 'austin@kinhome.com'
    `;

    console.log('User found:', JSON.stringify(users, null, 2));

    // Check total user count
    const totalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
    console.log('\nTotal users:', totalCount);

    // List all users
    const allUsers = await prisma.$queryRaw`
      SELECT id, email, name, role, "isActive"
      FROM "User"
      LIMIT 10
    `;
    console.log('\nAll users:', JSON.stringify(allUsers, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();