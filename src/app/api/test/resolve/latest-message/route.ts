import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    // In a real implementation, this would query the database for the latest message
    // For testing purposes, we'll return a test message SID
    const latestMessageSid = `SM_test_${Date.now()}`;

    return NextResponse.json({
      success: true,
      messageSid: latestMessageSid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve latest message' }, { status: 500 });
  }
}
