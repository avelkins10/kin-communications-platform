import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { timestamp } = body;

    // Emit message delivery failure event
    io.emit('message:delivery-failure', {
      timestamp,
      messageId: 'msg-' + Date.now(),
      error: 'Delivery failed',
      retryCount: 0
    });

    return NextResponse.json({
      success: true,
      message: 'Message delivery failure simulated',
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate message delivery failure' },
      { status: 500 }
    );
  }
}
