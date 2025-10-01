import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { timestamp } = body;

    // Emit rate limiting event
    io.emit('quickbase:rate-limiting', {
      timestamp,
      error: 'Rate limit exceeded',
      retryAfter: 60,
      limit: 100
    });

    return NextResponse.json({
      success: true,
      message: 'Rate limiting simulated',
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate rate limiting' },
      { status: 500 }
    );
  }
}
