import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { timestamp } = body;

    // Emit broadcast failure event
    io.emit('broadcast:failure', {
      timestamp,
      error: 'Broadcast failed',
      retryCount: 0
    });

    return NextResponse.json({
      success: true,
      message: 'Broadcast failure simulated',
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate broadcast failure' },
      { status: 500 }
    );
  }
}
