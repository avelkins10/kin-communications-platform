import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { status, timestamp } = body;

    // Emit call status change event
    io.emit('call:status-change', {
      timestamp,
      status,
      callId: 'test-call-' + Date.now(),
      previousStatus: 'active'
    });

    return NextResponse.json({
      success: true,
      message: `Call status change (${status}) simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate call status change' },
      { status: 500 }
    );
  }
}
