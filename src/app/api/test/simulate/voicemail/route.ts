import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  // Only allow in TEST_MODE
  if (process.env.TEST_MODE !== 'true' && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Test endpoints only available in TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { from, to, transcription, duration, recordingUrl } = body;

    // Emit socket event for real-time UI updates
    io.emit('voicemail:received', {
      voicemailSid: `VM_test_${Date.now()}`,
      from,
      to,
      transcription,
      duration: duration || 30,
      recordingUrl: recordingUrl || `https://test.example.com/voicemails/test_${Date.now()}.mp3`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Voicemail simulation triggered',
      voicemailSid: `VM_test_${Date.now()}`,
      from,
      to,
      transcription,
      duration: duration || 30
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}