import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { overflowCount, timestamp } = body;

    // Emit queue overflow event
    io.emit('queue:overflow', {
      timestamp,
      overflowCount,
      message: `Queue overflow: ${overflowCount} customers waiting`,
      alertLevel: overflowCount > 20 ? 'critical' : 'warning'
    });

    return NextResponse.json({
      success: true,
      message: `Queue overflow (${overflowCount}) simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate queue overflow' },
      { status: 500 }
    );
  }
}
