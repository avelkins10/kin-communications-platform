import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    // Return a test call SID
    const callSid = 'CA' + Date.now().toString(36).toUpperCase();
    
    return NextResponse.json({
      success: true,
      callSid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to resolve latest call' },
      { status: 500 }
    );
  }
}
