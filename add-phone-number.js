const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPhoneNumber() {
  try {
    // Get your user
    const user = await prisma.user.findUnique({
      where: { email: 'austin@kinhome.com' }
    });

    if (!user) {
      console.error('User not found!');
      return;
    }

    console.log('Found user:', user.name, user.email);

    // Prompt for phone number
    const phoneNumber = process.argv[2];

    if (!phoneNumber) {
      console.error('Please provide phone number as argument');
      console.log('Usage: node add-phone-number.js +14063035231');
      return;
    }

    // Check if phone number already exists
    const existing = await prisma.phoneNumber.findFirst({
      where: { phoneNumber }
    });

    if (existing) {
      console.log('Phone number already exists:', existing);
      return;
    }

    // Generate a simple ID
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Add phone number
    const phone = await prisma.phoneNumber.create({
      data: {
        id: id,
        phoneNumber: phoneNumber,
        twilioPhoneNumberSid: 'manual_' + id, // Placeholder SID
        status: 'active',
        capabilities: ['voice', 'sms'],
        userId: user.id
      }
    });

    console.log('\nPhone number added successfully!');
    console.log(JSON.stringify(phone, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

addPhoneNumber();