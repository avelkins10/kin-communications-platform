import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authenticated session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Create a JWT token for Socket.io authentication
    const token = jwt.sign(
      { 
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      process.env.NEXTAUTH_SECRET!,
      { 
        expiresIn: '15m' // Token expires in 15 minutes
      }
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Socket token generation error:', error);
    return res.status(500).json({ error: 'Failed to generate socket token' });
  }
}
