import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
// import { prisma } from '@/lib/db'; // Commented out for development
// import { metricsCollector } from '@/lib/monitoring/metrics'; // Commented out for development
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents,
  SocketServer,
  SocketUserSession,
  RoomType,
  SocketConfig
} from '@/types/socket';

// Global Socket.io server instance
let io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents> | null = null;

// User sessions map for tracking connected users
const userSessions = new Map<string, SocketUserSession>();

// Socket.io configuration
const socketConfig: SocketConfig = {
  port: parseInt(process.env.SOCKET_IO_PORT || '3001'),
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  adapter: process.env.SOCKET_IO_ADAPTER,
  enablePresence: process.env.REALTIME_NOTIFICATIONS_ENABLED === 'true',
  presenceTimeout: parseInt(process.env.PRESENCE_TIMEOUT || '30000'),
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '10000'),
  maxReconnectAttempts: parseInt(process.env.MAX_RECONNECT_ATTEMPTS || '5'),
  reconnectDelay: parseInt(process.env.RECONNECT_DELAY || '1000')
};

/**
 * Initialize Socket.io server
 */
export function initializeSocketServer(httpServer: any): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents> {
  if (io) {
    return io;
  }

  // HTTP server must be provided (from Next.js)
  if (!httpServer) {
    throw new Error('HTTP server is required for Socket.io initialization');
  }

  // Initialize Socket.io server with performance optimizations
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents>(httpServer, {
    cors: socketConfig.cors,
    transports: ['websocket', 'polling'],
    pingTimeout: socketConfig.presenceTimeout,
    pingInterval: socketConfig.heartbeatInterval,
    // Use default Socket.IO path '/socket.io'
    // Performance optimizations
    allowEIO3: false, // Disable Engine.IO v3 for better performance
    maxHttpBufferSize: 1e6, // 1MB max buffer size
    compression: true, // Enable compression
    // Connection optimization
    connectTimeout: 45000, // 45 second connection timeout
    upgradeTimeout: 10000, // 10 second upgrade timeout
    // Memory optimization
    perMessageDeflate: {
      threshold: 1024, // Only compress messages > 1KB
      concurrencyLimit: 10,
      memLevel: 7
    }
  });

  // Authentication middleware
  io.use(async (socket: SocketServer, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token - no fallback to insecure decode
      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as any;
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
        return next(new Error('Invalid or expired token'));
      }
      
      // Get user from token (mock for development)
      const userId = decoded?.userId;
      const userEmail = decoded?.email;
      const userName = decoded?.name;
      
      if (!userId) {
        return next(new Error('User ID not found in token'));
      }
      
      // Mock user data for development
      const user = {
        id: userId,
        email: userEmail || 'user@example.com',
        name: userName || 'User',
        role: 'employee', // Default role
        department: 'support' // Default department
      };

      // Attach user to socket
      (socket as any).user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handling
  io.on('connection', (socket: SocketServer) => {
    const user = (socket as any).user;
    const sessionId = socket.id;
    const connectionStartTime = Date.now();
    
    console.log(`User ${user.email} connected with session ${sessionId}`);
    
    // Record connection metrics (commented out for development)
    // metricsCollector.recordMetric('socket_connection', 1, {
    //   userId: user.id,
    //   userRole: user.role,
    //   department: user.department
    // });

    // Create user session
    const userSession: SocketUserSession = {
      user,
      sessionId,
      connectedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      rooms: [],
      presence: {
        status: 'online',
        currentActivity: 'available'
      }
    };

    userSessions.set(sessionId, userSession);

    // Join user to appropriate rooms
    const rooms = getUserRooms(user);
    rooms.forEach(room => {
      socket.join(room);
      userSession.rooms.push(room);
    });

    // Broadcast user presence
    if (socketConfig.enablePresence) {
      broadcastUserPresence(socket, userSession, 'online');
      
      // Also broadcast using the new presence events
      const { broadcastUserOnline, broadcastUserJoined } = require('./events');
      broadcastUserOnline(user.id, {
        name: user.name,
        email: user.email,
        department: user.department
      });
      
      // Emit user_joined event
      broadcastUserJoined(user.id, {
        name: user.name,
        email: user.email,
        department: user.department
      });
    }

    // Handle authentication
    socket.on('authenticate', (token: string) => {
      // Already authenticated via middleware
      socket.emit('authenticated', { success: true });
    });

    // Handle room management
    socket.on('join_room', (room: string) => {
      if (isValidRoom(room, user)) {
        socket.join(room);
        userSession.rooms.push(room);
        console.log(`User ${user.email} joined room: ${room}`);
      }
    });

    socket.on('leave_room', (room: string) => {
      socket.leave(room);
      userSession.rooms = userSession.rooms.filter(r => r !== room);
      console.log(`User ${user.email} left room: ${room}`);
    });

    // Handle presence updates
    socket.on('update_presence', (data) => {
      userSession.presence = { ...userSession.presence, ...data };
      userSession.lastActivity = new Date().toISOString();
      
      if (socketConfig.enablePresence) {
        broadcastUserPresence(socket, userSession, 'updated');
        
        // Also broadcast using the new presence events
        const { broadcastPresenceUpdate } = require('./events');
        broadcastPresenceUpdate(user.id, {
          status: data.status,
          lastSeen: new Date().toISOString(),
          activity: data.currentActivity
        });
      }
    });

    // Handle heartbeat
    socket.on('heartbeat', () => {
      userSession.lastActivity = new Date().toISOString();
    });

    // Handle user actions
    socket.on('mark_voicemail_read', (voicemailId: string) => {
      // Broadcast to relevant users
      socket.to(`voicemail:${voicemailId}`).emit('voicemail_updated', {
        id: voicemailId,
        status: 'read',
        updatedBy: user.id,
        updatedAt: new Date().toISOString()
      });
    });

    socket.on('accept_task', (taskId: string) => {
      // Broadcast task acceptance
      socket.to(`task:${taskId}`).emit('task_accepted', {
        id: taskId,
        acceptedBy: user.id,
        acceptedAt: new Date().toISOString()
      });
    });

    socket.on('reject_task', (taskId: string) => {
      // Broadcast task rejection
      socket.to(`task:${taskId}`).emit('task_rejected', {
        id: taskId,
        rejectedBy: user.id,
        rejectedAt: new Date().toISOString()
      });
    });

    // Handle custom events
    socket.on('custom_event', (data) => {
      // Log custom events for debugging
      console.log(`Custom event from ${user.email}:`, data);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      const connectionDuration = Date.now() - connectionStartTime;
      console.log(`User ${user.email} disconnected: ${reason}`);
      
      // Record disconnection metrics (commented out for development)
      // metricsCollector.recordMetric('socket_disconnection', 1, {
      //   userId: user.id,
      //   userRole: user.role,
      //   department: user.department,
      //   reason: reason,
      //   duration: connectionDuration
      // });
      
      // Update presence to offline
      if (socketConfig.enablePresence) {
        broadcastUserPresence(socket, userSession, 'offline');
        
        // Also broadcast using the new presence events
        const { broadcastUserOffline, broadcastUserLeft } = require('./events');
        broadcastUserOffline(user.id, {
          name: user.name,
          email: user.email,
          department: user.department
        });
        
        // Emit user_left event
        broadcastUserLeft(user.id, {
          name: user.name,
          email: user.email,
          department: user.department
        });
      }
      
      // Remove user session
      userSessions.delete(sessionId);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${user.email}:`, error);
    });
  });

  // Set up periodic cleanup for inactive users (only in non-serverless environments)
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SOCKET_CLEANUP === 'true') {
    setInterval(() => {
      cleanupInactiveUsers();
    }, socketConfig.presenceTimeout);
  }

  console.log('Socket.io server initialized');
  return io;
}

/**
 * Get Socket.io server instance
 */
export function getSocketServer(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents> | null {
  return io;
}

// Export the io instance for direct access
export { io };

/**
 * Get rooms a user should be in based on their role and department
 */
function getUserRooms(user: any): string[] {
  const rooms: string[] = ['global'];
  
  if (user.role) {
    rooms.push(`role:${user.role}`);
  }
  
  if (user.department) {
    rooms.push(`department:${user.department}`);
  }
  
  rooms.push(`user:${user.id}`);
  
  return rooms;
}

/**
 * Validate if user can join a room
 */
function isValidRoom(room: string, user: any): boolean {
  // Global room - everyone can join
  if (room === 'global') return true;
  
  // User-specific room
  if (room.startsWith('user:') && room === `user:${user.id}`) return true;
  
  // Role-based room
  if (room.startsWith('role:') && room === `role:${user.role}`) return true;
  
  // Department-based room
  if (room.startsWith('department:') && room === `department:${user.department}`) return true;
  
  // Admin can join any room
  if (user.role === 'admin') return true;
  
  return false;
}

/**
 * Broadcast user presence to relevant rooms
 */
function broadcastUserPresence(socket: SocketServer, userSession: SocketUserSession, status: 'online' | 'offline' | 'updated') {
  const presenceData = {
    userId: userSession.user.id,
    userName: userSession.user.name || userSession.user.email,
    userEmail: userSession.user.email,
    department: userSession.user.department,
    role: userSession.user.role,
    status: status === 'offline' ? 'offline' : userSession.presence.status,
    lastSeen: new Date().toISOString(),
    currentActivity: userSession.presence.currentActivity,
    location: userSession.presence.location
  };

  // Broadcast to user's rooms
  userSession.rooms.forEach(room => {
    socket.to(room).emit('user_presence_updated', presenceData);
  });

  // Emit to the user themselves
  socket.emit('user_presence_updated', presenceData);
}

/**
 * Clean up inactive user sessions
 */
function cleanupInactiveUsers() {
  const now = new Date();
  const timeout = socketConfig.presenceTimeout;
  
  for (const [sessionId, session] of userSessions.entries()) {
    const lastActivity = new Date(session.lastActivity);
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    
    if (timeSinceActivity > timeout) {
      console.log(`Cleaning up inactive session: ${sessionId}`);
      userSessions.delete(sessionId);
    }
  }
}

/**
 * Get all connected users
 */
export function getConnectedUsers(): SocketUserSession[] {
  return Array.from(userSessions.values());
}

/**
 * Get users in a specific room
 */
export function getUsersInRoom(room: string): SocketUserSession[] {
  return Array.from(userSessions.values()).filter(session => 
    session.rooms.includes(room)
  );
}

/**
 * Check if user is online
 */
export function isUserOnline(userId: string): boolean {
  return Array.from(userSessions.values()).some(session => 
    session.user.id === userId
  );
}

/**
 * Get user's current presence
 */
export function getUserPresence(userId: string): any {
  const session = Array.from(userSessions.values()).find(session => 
    session.user.id === userId
  );
  
  return session ? session.presence : null;
}
