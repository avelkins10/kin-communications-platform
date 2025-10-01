import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { roomId, timestamp } = body;

    // Emit room join failure event
    io.emit('room:join-failure', {
      timestamp,
      roomId,
      error: 'Failed to join room',
      reason: 'Simulated failure'
    });

    return NextResponse.json({
      success: true,
      message: `Room join failure (${roomId}) simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate room join failure' },
      { status: 500 }
    );
  }
}
