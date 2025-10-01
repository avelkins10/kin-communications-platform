import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { eventType, data, timestamp } = body;

    // Emit event broadcast
    io.emit('event:broadcast', {
      timestamp,
      eventType,
      data,
      broadcastId: 'broadcast-' + Date.now()
    });

    return NextResponse.json({
      success: true,
      message: `Event broadcast (${eventType}) simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate event broadcast' },
      { status: 500 }
    );
  }
}
