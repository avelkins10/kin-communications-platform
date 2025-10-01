import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { errorType, timestamp } = body;

    // Emit socket error event
    io.emit('socket:error', {
      timestamp,
      errorType,
      message: `Socket error: ${errorType}`,
      code: 'SOCKET_ERROR'
    });

    return NextResponse.json({
      success: true,
      message: `Socket error (${errorType}) simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate socket error' },
      { status: 500 }
    );
  }
}
