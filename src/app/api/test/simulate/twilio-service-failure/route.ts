import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { service, errorType, duration, timestamp } = body;

    // Emit socket event for real-time UI updates
    io.emit('twilio:service-failure', {
      service: service || 'voice',
      errorType: errorType || 'api-timeout',
      duration: duration || 300000, // 5 minutes
      timestamp: timestamp || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Twilio service failure simulation triggered',
      service: service || 'voice',
      errorType: errorType || 'api-timeout',
      duration: duration || 300000
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
