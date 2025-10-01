import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { workerId, taskType, priority, timestamp } = body;

    // Emit socket event for real-time UI updates
    io.emit('task:assigned', {
      taskSid: `TK_test_${Date.now()}`,
      workerId: workerId || 'test-worker',
      taskType: taskType || 'customer-support',
      priority: priority || 'normal',
      timestamp: timestamp || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Task assignment simulation triggered',
      taskSid: `TK_test_${Date.now()}`,
      workerId: workerId || 'test-worker',
      taskType: taskType || 'customer-support'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
