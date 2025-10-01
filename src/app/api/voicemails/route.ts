import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    // Return empty voicemails array for testing
    const voicemails = {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    };

    return NextResponse.json(voicemails);
  } catch (error) {
    console.error('Voicemails API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voicemails' },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    console.log('Creating voicemail:', body);
    
    // Return a mock voicemail for testing
    const mockVoicemail = {
      id: 'vm_' + Date.now(),
      callId: body.callId || 'call_123',
      fromNumber: body.fromNumber || '+1234567890',
      toNumber: body.toNumber || '+0987654321',
      duration: body.duration || 30,
      audioUrl: body.audioUrl || 'https://example.com/recording.mp3',
      transcription: body.transcription || 'Test voicemail transcription',
      priority: body.priority || 'normal',
      isRead: false,
      readAt: null,
      emailSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(mockVoicemail, { status: 201 });
  } catch (error) {
    console.error('Create voicemail error:', error);
    return NextResponse.json(
      { error: 'Failed to create voicemail' },
      { status: 500 }
    );
  }
};