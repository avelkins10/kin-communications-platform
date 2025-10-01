import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { initializeSocketServer } from '@/lib/socket/server';

// Global Socket.io server instance
let io: SocketIOServer | null = null;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Initialize Socket.io server if not already done
  if (!res.socket.server.io) {
    try {
      io = initializeSocketServer(res.socket.server);
      res.socket.server.io = io;
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
    connected: res.socket.server.io?.engine?.clientsCount || 0
  });
}

// Disable body parsing for Socket.io
export const config = {
  api: {
    bodyParser: false,
  },
};
