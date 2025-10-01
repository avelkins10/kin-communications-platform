import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { configType, errorType, timestamp } = body;

    // Emit socket event for real-time UI updates
    io.emit('config:save-failure', {
      configType: configType || 'system-settings',
      errorType: errorType || 'database-error',
      timestamp: timestamp || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration save failure simulation triggered',
      configType: configType || 'system-settings',
      errorType: errorType || 'database-error'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
