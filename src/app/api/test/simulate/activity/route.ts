import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { activityType, data, timestamp } = body;

    // Emit activity event
    io.emit('activity', {
      timestamp,
      activityType,
      data,
      activityId: 'activity-' + Date.now()
    });

    return NextResponse.json({
      success: true,
      message: `Activity (${activityType}) simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate activity' },
      { status: 500 }
    );
  }
}
