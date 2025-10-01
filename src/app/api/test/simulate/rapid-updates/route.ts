import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { customerId, timestamp } = body;

    // Emit rapid updates event
    io.emit('quickbase:rapid-updates', {
      timestamp,
      customerId,
      updateCount: 10,
      timeWindow: 5000
    });

    return NextResponse.json({
      success: true,
      message: `Rapid updates for customer ${customerId} simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate rapid updates' },
      { status: 500 }
    );
  }
}
