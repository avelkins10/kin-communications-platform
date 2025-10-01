import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    // Return mock stats for testing
    const stats = {
      total: 0,
      unread: 0,
      read: 0,
      highPriority: 0,
      normalPriority: 0,
      lowPriority: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Voicemails stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voicemail stats' },
      { status: 500 }
    );
  }
};