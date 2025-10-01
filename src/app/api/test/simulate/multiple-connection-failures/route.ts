import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { count, timestamp } = body;

    // Emit multiple connection failures
    for (let i = 0; i < count; i++) {
      io.emit('socket:connection-failure', {
        timestamp,
        attempt: i + 1,
        totalAttempts: count,
        error: `Connection attempt ${i + 1} failed`
      });
    }

    return NextResponse.json({
      success: true,
      message: `Multiple connection failures (${count}) simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate multiple connection failures' },
      { status: 500 }
    );
  }
}
