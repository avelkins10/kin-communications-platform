import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { timestamp } = body;

    // Emit event processing failure event
    io.emit('event:processing-failure', {
      timestamp,
      eventId: 'event-' + Date.now(),
      error: 'Event processing failed',
      retryCount: 0
    });

    return NextResponse.json({
      success: true,
      message: 'Event processing failure simulated',
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate event processing failure' },
      { status: 500 }
    );
  }
}
