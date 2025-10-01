import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    console.log('[Socket Token] Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as any)?.id
    });

    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email;
    const userName = session?.user?.name;

    if (!session || !userId) {
      console.log('[Socket Token] Unauthorized - no session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a JWT token for socket authentication
    const token = jwt.sign(
      {
        userId,
        email: userEmail,
        name: userName,
      },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: '24h' }
    );

    console.log('[Socket Token] Generated JWT token for user:', userId);

    return NextResponse.json({
      token,
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('[Socket Token] Error generating socket token:', error);
    return NextResponse.json(
      { error: 'Failed to generate socket token' },
      { status: 500 }
    );
  }
}
