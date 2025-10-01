import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { timestamp } = body;

    // Emit corrupted customer data event
    io.emit('quickbase:corrupted-data', {
      timestamp,
      customerId: 'test-customer-' + Date.now(),
      corruptedFields: ['name', 'email'],
      error: 'Data corruption detected'
    });

    return NextResponse.json({
      success: true,
      message: 'Corrupted customer data simulated',
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate corrupted customer data' },
      { status: 500 }
    );
  }
}
