import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { customerId, timestamp } = body;

    // Emit concurrent updates event
    io.emit('quickbase:concurrent-updates', {
      timestamp,
      customerId,
      conflictCount: 3,
      lastUpdate: timestamp
    });

    return NextResponse.json({
      success: true,
      message: `Concurrent updates for customer ${customerId} simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate concurrent updates' },
      { status: 500 }
    );
  }
}
