import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { recordId, fieldUpdates, timestamp } = body;

    // Emit socket event for real-time UI updates
    io.emit('quickbase:data-update', {
      recordId: recordId || `QB_test_${Date.now()}`,
      fieldUpdates: fieldUpdates || { status: 'updated' },
      timestamp: timestamp || new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Quickbase data update simulation triggered',
      recordId: recordId || `QB_test_${Date.now()}`,
      fieldUpdates: fieldUpdates || { status: 'updated' }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
