import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { timestamp } = body;

    // Emit missing required fields event
    io.emit('quickbase:missing-required-fields', {
      timestamp,
      customerId: 'test-customer-' + Date.now(),
      missingFields: ['name', 'email', 'phone'],
      error: 'Required fields missing'
    });

    return NextResponse.json({
      success: true,
      message: 'Missing required fields simulated',
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate missing required fields' },
      { status: 500 }
    );
  }
}
