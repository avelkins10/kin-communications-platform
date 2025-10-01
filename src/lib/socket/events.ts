import { getSocketServer } from './server';
import {
  VoicemailEventData,
  CallEventData,
  MessageEventData,
  ConversationEventData,
  TaskEventData,
  WorkerEventData,
  NotificationEventData,
  SystemAlertEventData,
  QueueEventData,
  RoomType
} from '@/types/socket';

/**
 * Socket.io service layer for server-side event broadcasting
 * This service is used by webhook handlers and API routes to notify connected clients
 */

// Voicemail Events
export function broadcastVoicemailCreated(data: VoicemailEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting voicemail_created:', data.id);

  // Broadcast to global room
  io.emit('voicemail_created', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('voicemail_created', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('voicemail_created', data);
  }

  // Broadcast to voicemail-specific room
  io.to(`voicemail:${data.id}`).emit('voicemail_created', data);
}

export function broadcastVoicemailUpdated(data: VoicemailEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting voicemail_updated:', data.id);

  // Broadcast to global room
  io.emit('voicemail_updated', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('voicemail_updated', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('voicemail_updated', data);
  }

  // Broadcast to voicemail-specific room
  io.to(`voicemail:${data.id}`).emit('voicemail_updated', data);
}

export function broadcastVoicemailAssigned(data: VoicemailEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting voicemail_assigned:', data.id);

  // Broadcast to assigned user
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('voicemail_assigned', data);
  }

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('voicemail_assigned', data);
  }

  // Broadcast to voicemail-specific room
  io.to(`voicemail:${data.id}`).emit('voicemail_assigned', data);
}

export function broadcastVoicemailStatusChanged(data: VoicemailEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting voicemail_status_changed:', data.id);

  // Broadcast to global room
  io.emit('voicemail_status_changed', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('voicemail_status_changed', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('voicemail_status_changed', data);
  }

  // Broadcast to voicemail-specific room
  io.to(`voicemail:${data.id}`).emit('voicemail_status_changed', data);
}

// Call Events
export function broadcastCallIncoming(data: CallEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting call_incoming:', data.id);

  // Broadcast to global room
  io.emit('call_incoming', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('call_incoming', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('call_incoming', data);
  }
}

export function broadcastCallStatusChanged(data: CallEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting call_status_changed:', data.id);

  // Broadcast to global room
  io.emit('call_status_changed', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('call_status_changed', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('call_status_changed', data);
  }
}

export function broadcastCallCompleted(data: CallEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting call_completed:', data.id);

  // Broadcast to global room
  io.emit('call_completed', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('call_completed', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('call_completed', data);
  }
}

export function broadcastCallRecordingAvailable(data: CallEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting call_recording_available:', data.id);

  // Broadcast to global room
  io.emit('call_recording_available', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('call_recording_available', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('call_recording_available', data);
  }
}

// Message Events
export function broadcastMessageReceived(data: MessageEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting message_received:', data.id);

  // Broadcast to global room
  io.emit('message_received', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('message_received', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('message_received', data);
  }

  // Broadcast to conversation room if specified
  if (data.conversationId) {
    io.to(`conversation:${data.conversationId}`).emit('message_received', data);
  }
}

export function broadcastMessageSent(data: MessageEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting message_sent:', data.id);

  // Broadcast to global room
  io.emit('message_sent', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('message_sent', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('message_sent', data);
  }

  // Broadcast to conversation room if specified
  if (data.conversationId) {
    io.to(`conversation:${data.conversationId}`).emit('message_sent', data);
  }
}

export function broadcastMessageStatusChanged(data: MessageEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting message_status_changed:', data.id);

  // Broadcast to global room
  io.emit('message_status_changed', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('message_status_changed', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('message_status_changed', data);
  }

  // Broadcast to conversation room if specified
  if (data.conversationId) {
    io.to(`conversation:${data.conversationId}`).emit('message_status_changed', data);
  }
}

export function broadcastConversationUpdated(data: ConversationEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting conversation_updated:', data.id);

  // Broadcast to global room
  io.emit('conversation_updated', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('conversation_updated', data);
  }

  // Broadcast to assigned user if specified
  if (data.assignedTo) {
    io.to(`user:${data.assignedTo}`).emit('conversation_updated', data);
  }

  // Broadcast to conversation room
  io.to(`conversation:${data.id}`).emit('conversation_updated', data);
}

// TaskRouter Events
export function broadcastTaskAssigned(data: TaskEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting task_assigned:', data.id);

  // Broadcast to assigned worker
  if (data.workerSid) {
    io.to(`user:${data.workerSid}`).emit('task_assigned', data);
  }

  // Broadcast to task queue room
  io.to(`taskqueue:${data.taskQueueSid}`).emit('task_assigned', data);

  // Broadcast to task-specific room
  io.to(`task:${data.id}`).emit('task_assigned', data);

  // Broadcast to admin users
  io.to('role:admin').emit('task_assigned', data);
}

export function broadcastTaskAccepted(data: TaskEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting task_accepted:', data.id);

  // Broadcast to global room
  io.emit('task_accepted', data);

  // Broadcast to task queue room
  io.to(`taskqueue:${data.taskQueueSid}`).emit('task_accepted', data);

  // Broadcast to task-specific room
  io.to(`task:${data.id}`).emit('task_accepted', data);

  // Broadcast to admin users
  io.to('role:admin').emit('task_accepted', data);
}

export function broadcastTaskRejected(data: TaskEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting task_rejected:', data.id);

  // Broadcast to global room
  io.emit('task_rejected', data);

  // Broadcast to task queue room
  io.to(`taskqueue:${data.taskQueueSid}`).emit('task_rejected', data);

  // Broadcast to task-specific room
  io.to(`task:${data.id}`).emit('task_rejected', data);

  // Broadcast to admin users
  io.to('role:admin').emit('task_rejected', data);
}

export function broadcastTaskCompleted(data: TaskEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting task_completed:', data.id);

  // Broadcast to global room
  io.emit('task_completed', data);

  // Broadcast to task queue room
  io.to(`taskqueue:${data.taskQueueSid}`).emit('task_completed', data);

  // Broadcast to task-specific room
  io.to(`task:${data.id}`).emit('task_completed', data);

  // Broadcast to admin users
  io.to('role:admin').emit('task_completed', data);
}

export function broadcastWorkerStatusChanged(data: WorkerEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting worker_status_changed:', data.id);

  // Broadcast to global room
  io.emit('worker_status_changed', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('worker_status_changed', data);
  }

  // Broadcast to admin users
  io.to('role:admin').emit('worker_status_changed', data);
}

export function broadcastWorkerActivityChanged(data: WorkerEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting worker_activity_changed:', data.id);

  // Broadcast to global room
  io.emit('worker_activity_changed', data);

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('worker_activity_changed', data);
  }

  // Broadcast to admin users
  io.to('role:admin').emit('worker_activity_changed', data);
}

// Notification Events
export function broadcastNotification(data: NotificationEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting notification:', data.id);

  // Broadcast to specific user if specified
  if (data.userId) {
    io.to(`user:${data.userId}`).emit('notification', data);
    return;
  }

  // Broadcast to department if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('notification', data);
    return;
  }

  // Broadcast to role if specified
  if (data.role) {
    io.to(`role:${data.role}`).emit('notification', data);
    return;
  }

  // Broadcast to global room
  io.emit('notification', data);
}

export function broadcastSystemAlert(data: SystemAlertEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting system_alert:', data.id);

  // Broadcast to affected users if specified
  if (data.affectedUsers && data.affectedUsers.length > 0) {
    data.affectedUsers.forEach(userId => {
      io.to(`user:${userId}`).emit('system_alert', data);
    });
    return;
  }

  // Broadcast to affected departments if specified
  if (data.affectedDepartments && data.affectedDepartments.length > 0) {
    data.affectedDepartments.forEach(department => {
      io.to(`department:${department}`).emit('system_alert', data);
    });
    return;
  }

  // Broadcast to global room for critical alerts
  if (data.severity === 'critical') {
    io.emit('system_alert', data);
  } else {
    // Broadcast to admin users for non-critical alerts
    io.to('role:admin').emit('system_alert', data);
  }
}

export function broadcastQueueUpdated(data: QueueEventData): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting queue_updated:', data.department || 'global');

  // Broadcast to department room if specified
  if (data.department) {
    io.to(`department:${data.department}`).emit('queue_updated', data);
  } else {
    // Broadcast to global room
    io.emit('queue_updated', data);
  }

  // Broadcast to admin users
  io.to('role:admin').emit('queue_updated', data);
}

// Utility functions for room management
export function joinUserToRooms(userId: string, rooms: RoomType[]): void {
  const io = getSocketServer();
  if (!io) return;

  rooms.forEach(room => {
    io.to(`user:${userId}`).socketsJoin(room);
  });
}

export function removeUserFromRooms(userId: string, rooms: RoomType[]): void {
  const io = getSocketServer();
  if (!io) return;

  rooms.forEach(room => {
    io.to(`user:${userId}`).socketsLeave(room);
  });
}

export function getConnectedUsersInRoom(room: RoomType): number {
  const io = getSocketServer();
  if (!io) return 0;

  return io.sockets.adapter.rooms.get(room)?.size || 0;
}

export function isUserInRoom(userId: string, room: RoomType): boolean {
  const io = getSocketServer();
  if (!io) return false;

  const userRoom = io.sockets.adapter.rooms.get(`user:${userId}`);
  const targetRoom = io.sockets.adapter.rooms.get(room);
  
  return !!(userRoom && targetRoom && userRoom.has(room));
}

// Presence Events
export function broadcastUserOnline(userId: string, userData: { name?: string; email?: string; department?: string }): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting user_online:', userId);

  const presenceData = {
    userId,
    status: 'online' as const,
    lastSeen: new Date().toISOString(),
    ...userData
  };

  // Broadcast to global room
  io.emit('user_online', presenceData);

  // Broadcast to department room if specified
  if (userData.department) {
    io.to(`department:${userData.department}`).emit('user_online', presenceData);
  }

  // Broadcast to admin users
  io.to('role:admin').emit('user_online', presenceData);
}

export function broadcastUserOffline(userId: string, userData: { name?: string; email?: string; department?: string }): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting user_offline:', userId);

  const presenceData = {
    userId,
    status: 'offline' as const,
    lastSeen: new Date().toISOString(),
    ...userData
  };

  // Broadcast to global room
  io.emit('user_offline', presenceData);

  // Broadcast to department room if specified
  if (userData.department) {
    io.to(`department:${userData.department}`).emit('user_offline', presenceData);
  }

  // Broadcast to admin users
  io.to('role:admin').emit('user_offline', presenceData);
}

export function broadcastUserActivity(userId: string, activity: string, userData: { name?: string; email?: string; department?: string }): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting user_activity:', userId, activity);

  const activityData = {
    userId,
    activity,
    timestamp: new Date().toISOString(),
    ...userData
  };

  // Broadcast to global room
  io.emit('user_activity', activityData);

  // Broadcast to department room if specified
  if (userData.department) {
    io.to(`department:${userData.department}`).emit('user_activity', activityData);
  }

  // Broadcast to admin users
  io.to('role:admin').emit('user_activity', activityData);
}

export function broadcastPresenceUpdate(userId: string, presenceData: { status: 'online' | 'offline' | 'away' | 'busy'; lastSeen: string; activity?: string }): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting presence_update:', userId, presenceData.status);

  const updateData = {
    userId,
    ...presenceData
  };

  // Broadcast to global room
  io.emit('presence_update', updateData);

  // Broadcast to admin users
  io.to('role:admin').emit('presence_update', updateData);
}

export function broadcastOnlineUsersList(onlineUsers: Array<{ userId: string; name?: string; email?: string; department?: string; lastSeen: string }>): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting online_users_list:', onlineUsers.length, 'users');

  // Broadcast to global room
  io.emit('online_users_list', { users: onlineUsers });

  // Broadcast to admin users
  io.to('role:admin').emit('online_users_list', { users: onlineUsers });
}

// Helper function for task queue room naming
export function getTaskQueueRoom(taskQueueSid: string): RoomType {
  return `taskqueue:${taskQueueSid}` as RoomType;
}

// Additional presence events
export function broadcastUserJoined(userId: string, userData: { name?: string; email?: string; department?: string }): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting user_joined:', userId);

  const presenceData = {
    userId,
    userName: userData.name || userData.email || 'Unknown User',
    userEmail: userData.email || '',
    department: userData.department,
    role: 'user', // Default role, could be enhanced
    status: 'online' as const,
    lastSeen: new Date().toISOString(),
    currentActivity: 'available'
  };

  // Broadcast to global room
  io.emit('user_joined', presenceData);

  // Broadcast to department room if specified
  if (userData.department) {
    io.to(`department:${userData.department}`).emit('user_joined', presenceData);
  }

  // Broadcast to admin users
  io.to('role:admin').emit('user_joined', presenceData);
}

export function broadcastUserLeft(userId: string, userData: { name?: string; email?: string; department?: string }): void {
  const io = getSocketServer();
  if (!io) return;

  console.log('Broadcasting user_left:', userId);

  const presenceData = {
    userId,
    userName: userData.name || userData.email || 'Unknown User',
    userEmail: userData.email || '',
    department: userData.department,
    role: 'user', // Default role, could be enhanced
    status: 'offline' as const,
    lastSeen: new Date().toISOString(),
    currentActivity: 'offline'
  };

  // Broadcast to global room
  io.emit('user_left', presenceData);

  // Broadcast to department room if specified
  if (userData.department) {
    io.to(`department:${userData.department}`).emit('user_left', presenceData);
  }

  // Broadcast to admin users
  io.to('role:admin').emit('user_left', presenceData);
}
