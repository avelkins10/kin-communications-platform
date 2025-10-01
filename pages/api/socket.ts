import { NextApiRequest, NextApiResponse } from 'next';
import { initializeSocketServer } from '@/lib/socket/server';

// Global Socket.io server instance
let io: any = null;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize Socket.io server if not already done
  if (!io) {
    try {
      // Attach to the Next.js HTTP server
      const server = (res.socket as typeof res.socket & { server?: any })?.server;
      if (!server) {
        console.error('Socket server instance is not available on the response object');
        return res.status(500).json({ error: 'Socket server not available' });
      }
      io = initializeSocketServer(server);
      console.log('Socket.io server initialized via Pages API route');
    } catch (error) {
      console.error('Failed to initialize Socket.io server:', error);
      return res.status(500).json({ error: 'Failed to initialize Socket.io server' });
    }
  }

  // Handle WebSocket upgrade
  if (req.headers.upgrade === 'websocket') {
    // The Socket.io server will handle the WebSocket upgrade
    return res.status(200).json({ message: 'Socket.io server ready' });
  }

  // Return server status
  return res.status(200).json({ 
    message: 'Socket.io server is running',
    connected: io?.engine?.clientsCount || 0
  });
}

// Disable body parsing for Socket.io
export const config = {
  api: {
    bodyParser: false,
  },
};
