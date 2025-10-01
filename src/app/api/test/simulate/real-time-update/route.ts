import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { customerId, timestamp } = body;

    // Emit real-time update event
    io.emit('quickbase:real-time-update', {
      timestamp,
      customerId,
      updateType: 'data-change',
      fields: ['name', 'email', 'phone']
    });

    return NextResponse.json({
      success: true,
      message: `Real-time update for customer ${customerId} simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate real-time update' },
      { status: 500 }
    );
  }
}
