import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { customerId, timestamp } = body;

    // Emit sync conflict event
    io.emit('quickbase:sync-conflict', {
      timestamp,
      customerId,
      conflictType: 'data-mismatch',
      fields: ['name', 'email']
    });

    return NextResponse.json({
      success: true,
      message: `Sync conflict for customer ${customerId} simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate sync conflict' },
      { status: 500 }
    );
  }
}
