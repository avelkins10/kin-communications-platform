import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { from, to, direction, context } = body;

    // Emit socket event for real-time UI updates
    io.emit('call:inbound', {
      callSid: `CA_test_${Date.now()}`,
      from,
      to,
      direction: direction || 'inbound',
      context: context || 'Test call simulation',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Call simulation triggered',
      callSid: `CA_test_${Date.now()}`,
      from,
      to,
      direction: direction || 'inbound'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}