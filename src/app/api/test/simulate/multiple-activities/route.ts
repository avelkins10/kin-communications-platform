import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { count, timestamp } = body;

    // Emit multiple activities
    for (let i = 0; i < count; i++) {
      io.emit('activity', {
        timestamp,
        activityType: 'test-activity',
        data: { index: i, total: count },
        activityId: `activity-${i}-${Date.now()}`
      });
    }

    return NextResponse.json({
      success: true,
      message: `Multiple activities (${count}) simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate multiple activities' },
      { status: 500 }
    );
  }
}
