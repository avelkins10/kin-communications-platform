const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    // Check what columns exist in User table
    const schema = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'kin_local'
      AND table_name = 'User'
      ORDER BY ordinal_position
    `;

    console.log('User table columns:', JSON.stringify(schema, null, 2));

    // Try to get all users with just basic columns
    const users = await prisma.$queryRaw`
      SELECT * FROM "User" LIMIT 10
    `;
    console.log('\nUsers:', JSON.stringify(users, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();