const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testQuery() {
  try {
    console.log('Testing worker query...\n');

    // Test 1: Count all workers
    const count = await prisma.worker.count();
    console.log(`Total workers in database: ${count}`);

    // Test 2: Get all workers with empty where clause (same as the API)
    const workers = await prisma.worker.findMany({
      where: {},
      include: {
        User: true,
        Task: {
          where: {
            assignmentStatus: {
              in: ["PENDING", "ASSIGNED", "RESERVED", "ACCEPTED"],
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`Workers returned from query: ${workers.length}`);

    if (workers.length > 0) {
      console.log(`\nFirst worker:`);
      console.log(`- Name: ${workers[0].friendlyName}`);
      console.log(`- ID: ${workers[0].id}`);
      console.log(`- User: ${workers[0].User?.email || 'no user'}`);
    }

    // Test 3: Try simpler query without includes
    const workersSimple = await prisma.worker.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
    });

    console.log(`\nSimple query (no includes): ${workersSimple.length} workers`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();