import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { concurrentUsers, duration, timestamp } = body;

    // Emit socket event for real-time UI updates
    io.emit('system:high-load', {
      concurrentUsers: concurrentUsers || 50,
      duration: duration || 30000,
      timestamp: timestamp || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'High load simulation triggered',
      concurrentUsers: concurrentUsers || 50,
      duration: duration || 30000
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}