import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { duration, timestamp } = body;

    // Emit call duration update event
    io.emit('call:duration-update', {
      timestamp,
      duration,
      callId: 'test-call-' + Date.now(),
      formattedDuration: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
    });

    return NextResponse.json({
      success: true,
      message: `Call duration update (${duration}s) simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate call duration update' },
      { status: 500 }
    );
  }
}
