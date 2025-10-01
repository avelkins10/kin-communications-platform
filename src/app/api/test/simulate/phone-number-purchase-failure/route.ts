import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { phoneNumber, errorType, timestamp } = body;

    // Emit socket event for real-time UI updates
    io.emit('phone:purchase-failure', {
      phoneNumber: phoneNumber || '+15551234567',
      errorType: errorType || 'insufficient-funds',
      timestamp: timestamp || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Phone number purchase failure simulation triggered',
      phoneNumber: phoneNumber || '+15551234567',
      errorType: errorType || 'insufficient-funds'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
