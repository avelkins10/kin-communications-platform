import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { customerId, changes, timestamp } = body;

    // Emit Quickbase data change event
    io.emit('quickbase:data-change', {
      timestamp,
      customerId,
      changes,
      changeId: 'change-' + Date.now()
    });

    return NextResponse.json({
      success: true,
      message: `Quickbase data change for customer ${customerId} simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate Quickbase data change' },
      { status: 500 }
    );
  }
}
