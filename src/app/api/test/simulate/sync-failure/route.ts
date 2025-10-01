import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { timestamp } = body;

    // Emit sync failure event
    io.emit('quickbase:sync-failure', {
      timestamp,
      error: 'Sync operation failed',
      retryCount: 0
    });

    return NextResponse.json({
      success: true,
      message: 'Sync failure simulated',
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate sync failure' },
      { status: 500 }
    );
  }
}
