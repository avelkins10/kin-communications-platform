import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { taskType, priority, requiredSkills, timeout, timestamp } = body;

    // Emit socket event for real-time UI updates
    io.emit('task:created', {
      taskSid: `TK_test_${Date.now()}`,
      taskType: taskType || 'customer-support',
      priority: priority || 'normal',
      requiredSkills: requiredSkills || [],
      timeout: timeout || 300000, // 5 minutes
      timestamp: timestamp || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Task creation simulation triggered',
      taskSid: `TK_test_${Date.now()}`,
      taskType: taskType || 'customer-support',
      priority: priority || 'normal'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
