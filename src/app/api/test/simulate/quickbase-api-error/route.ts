import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { timestamp } = body;

    // Emit Quickbase API error event
    io.emit('quickbase:api-error', {
      timestamp,
      error: 'Quickbase API error',
      statusCode: 500,
      retryCount: 0
    });

    return NextResponse.json({
      success: true,
      message: 'Quickbase API error simulated',
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate Quickbase API error' },
      { status: 500 }
    );
  }
}
