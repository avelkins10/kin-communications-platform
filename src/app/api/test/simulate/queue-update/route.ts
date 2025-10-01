import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { queueId, waitingCount, availableAgents, averageWaitTime, timestamp } = body;

    // Emit socket event for real-time UI updates
    io.emit('queue:update', {
      queueId: queueId || 'support_queue',
      waitingCount: waitingCount || 0,
      availableAgents: availableAgents || 1,
      averageWaitTime: averageWaitTime || 0,
      timestamp: timestamp || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Queue update simulation triggered',
      queueId: queueId || 'support_queue',
      waitingCount: waitingCount || 0,
      availableAgents: availableAgents || 1,
      averageWaitTime: averageWaitTime || 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}