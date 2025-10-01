import { NextRequest, NextResponse } from 'next/server';
import { io } from '@/lib/socket/server';

export async function POST(request: NextRequest) {
  if (process.env.TEST_MODE !== 'true') {
    return NextResponse.json({ error: 'Not available outside TEST_MODE' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { customerId, timestamp } = body;

    // Emit cache invalidation event
    io.emit('quickbase:cache-invalidation', {
      timestamp,
      customerId,
      cacheType: 'customer-data',
      invalidatedKeys: ['profile', 'contacts', 'history']
    });

    return NextResponse.json({
      success: true,
      message: `Cache invalidation for customer ${customerId} simulated`,
      timestamp
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to simulate cache invalidation' },
      { status: 500 }
    );
  }
}
