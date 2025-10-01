'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from '@/components/socket-provider';
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
  PresenceEventData
} from '@/types/socket';

// Base hook for Socket.io functionality
export function useSocketEvents() {
  const { subscribe, isConnected } = useSocket();
  const [events, setEvents] = useState<any[]>([]);

  // Add event to the events array
  const addEvent = useCallback((event: any) => {
    setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
  }, []);

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    addEvent,
    clearEvents,
    isConnected
  };
}

// Hook for real-time voicemail updates
export function useRealtimeVoicemails() {
  const { subscribe, isConnected } = useSocket();
  const [voicemails, setVoicemails] = useState<VoicemailEventData[]>([]);
  const [newVoicemails, setNewVoicemails] = useState<VoicemailEventData[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to voicemail events
    const unsubscribeCreated = subscribe('voicemail_created', (data: VoicemailEventData) => {
      setVoicemails(prev => [data, ...prev]);
      setNewVoicemails(prev => [data, ...prev]);
    });

    const unsubscribeUpdated = subscribe('voicemail_updated', (data: VoicemailEventData) => {
      setVoicemails(prev => 
        prev.map(v => v.id === data.id ? { ...v, ...data } : v)
      );
    });

    const unsubscribeAssigned = subscribe('voicemail_assigned', (data: VoicemailEventData) => {
      setVoicemails(prev => 
        prev.map(v => v.id === data.id ? { ...v, ...data } : v)
      );
    });

    const unsubscribeStatusChanged = subscribe('voicemail_status_changed', (data: VoicemailEventData) => {
      setVoicemails(prev => 
        prev.map(v => v.id === data.id ? { ...v, ...data } : v)
      );
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeAssigned();
      unsubscribeStatusChanged();
    };
  }, [subscribe, isConnected]);

  // Clear new voicemails
  const clearNewVoicemails = useCallback(() => {
    setNewVoicemails([]);
  }, []);

  return {
    voicemails,
    newVoicemails,
    clearNewVoicemails,
    isConnected
  };
}

// Hook for real-time call updates
export function useRealtimeCalls() {
  const { subscribe, isConnected } = useSocket();
  const [calls, setCalls] = useState<CallEventData[]>([]);
  const [activeCalls, setActiveCalls] = useState<CallEventData[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to call events
    const unsubscribeIncoming = subscribe('call_incoming', (data: CallEventData) => {
      setCalls(prev => [data, ...prev]);
      if (data.status === 'ringing' || data.status === 'in-progress') {
        setActiveCalls(prev => [data, ...prev.filter(c => c.id !== data.id)]);
      }
    });

    const unsubscribeStatusChanged = subscribe('call_status_changed', (data: CallEventData) => {
      setCalls(prev => 
        prev.map(c => c.id === data.id ? { ...c, ...data } : c)
      );
      
      if (data.status === 'completed' || data.status === 'failed') {
        setActiveCalls(prev => prev.filter(c => c.id !== data.id));
      } else if (data.status === 'ringing' || data.status === 'in-progress') {
        setActiveCalls(prev => [data, ...prev.filter(c => c.id !== data.id)]);
      }
    });

    const unsubscribeCompleted = subscribe('call_completed', (data: CallEventData) => {
      setCalls(prev => 
        prev.map(c => c.id === data.id ? { ...c, ...data } : c)
      );
      setActiveCalls(prev => prev.filter(c => c.id !== data.id));
    });

    const unsubscribeRecordingAvailable = subscribe('call_recording_available', (data: CallEventData) => {
      setCalls(prev => 
        prev.map(c => c.id === data.id ? { ...c, ...data } : c)
      );
    });

    return () => {
      unsubscribeIncoming();
      unsubscribeStatusChanged();
      unsubscribeCompleted();
      unsubscribeRecordingAvailable();
    };
  }, [subscribe, isConnected]);

  return {
    calls,
    activeCalls,
    isConnected
  };
}

// Hook for real-time message updates
export function useRealtimeMessages() {
  const { subscribe, isConnected } = useSocket();
  const [messages, setMessages] = useState<MessageEventData[]>([]);
  const [conversations, setConversations] = useState<ConversationEventData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to message events
    const unsubscribeReceived = subscribe('message_received', (data: MessageEventData) => {
      setMessages(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    const unsubscribeSent = subscribe('message_sent', (data: MessageEventData) => {
      setMessages(prev => [data, ...prev]);
    });

    const unsubscribeStatusChanged = subscribe('message_status_changed', (data: MessageEventData) => {
      setMessages(prev => 
        prev.map(m => m.id === data.id ? { ...m, ...data } : m)
      );
    });

    const unsubscribeConversationUpdated = subscribe('conversation_updated', (data: ConversationEventData) => {
      setConversations(prev => 
        prev.map(c => c.id === data.id ? { ...c, ...data } : c)
      );
      setUnreadCount(data.unreadCount);
    });

    return () => {
      unsubscribeReceived();
      unsubscribeSent();
      unsubscribeStatusChanged();
      unsubscribeConversationUpdated();
    };
  }, [subscribe, isConnected]);

  return {
    messages,
    conversations,
    unreadCount,
    isConnected
  };
}

// Hook for real-time TaskRouter updates
export function useRealtimeTaskRouter() {
  const { subscribe, isConnected } = useSocket();
  const [tasks, setTasks] = useState<TaskEventData[]>([]);
  const [workers, setWorkers] = useState<WorkerEventData[]>([]);
  const [pendingTasks, setPendingTasks] = useState<TaskEventData[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to TaskRouter events
    const unsubscribeTaskAssigned = subscribe('task_assigned', (data: TaskEventData) => {
      setTasks(prev => [data, ...prev]);
      if (data.status === 'pending' || data.status === 'assigned') {
        setPendingTasks(prev => [data, ...prev.filter(t => t.id !== data.id)]);
      }
    });

    const unsubscribeTaskAccepted = subscribe('task_accepted', (data: TaskEventData) => {
      setTasks(prev => 
        prev.map(t => t.id === data.id ? { ...t, ...data } : t)
      );
      setPendingTasks(prev => prev.filter(t => t.id !== data.id));
    });

    const unsubscribeTaskRejected = subscribe('task_rejected', (data: TaskEventData) => {
      setTasks(prev => 
        prev.map(t => t.id === data.id ? { ...t, ...data } : t)
      );
      setPendingTasks(prev => prev.filter(t => t.id !== data.id));
    });

    const unsubscribeTaskCompleted = subscribe('task_completed', (data: TaskEventData) => {
      setTasks(prev => 
        prev.map(t => t.id === data.id ? { ...t, ...data } : t)
      );
      setPendingTasks(prev => prev.filter(t => t.id !== data.id));
    });

    const unsubscribeWorkerStatusChanged = subscribe('worker_status_changed', (data: WorkerEventData) => {
      setWorkers(prev => 
        prev.map(w => w.id === data.id ? { ...w, ...data } : w)
      );
    });

    const unsubscribeWorkerActivityChanged = subscribe('worker_activity_changed', (data: WorkerEventData) => {
      setWorkers(prev => 
        prev.map(w => w.id === data.id ? { ...w, ...data } : w)
      );
    });

    return () => {
      unsubscribeTaskAssigned();
      unsubscribeTaskAccepted();
      unsubscribeTaskRejected();
      unsubscribeTaskCompleted();
      unsubscribeWorkerStatusChanged();
      unsubscribeWorkerActivityChanged();
    };
  }, [subscribe, isConnected]);

  return {
    tasks,
    workers,
    pendingTasks,
    isConnected
  };
}

// Hook for presence indicators
export function usePresence() {
  const { subscribe, updatePresence, isConnected } = useSocket();
  const [presenceData, setPresenceData] = useState<Map<string, PresenceEventData>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<PresenceEventData[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to presence events
    const unsubscribePresenceUpdated = subscribe('user_presence_updated', (data: PresenceEventData) => {
      setPresenceData(prev => new Map(prev.set(data.userId, data)));
      
      if (data.status === 'online') {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          return [...filtered, data];
        });
      } else {
        setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });

    const unsubscribeUserJoined = subscribe('user_joined', (data: PresenceEventData) => {
      setPresenceData(prev => new Map(prev.set(data.userId, data)));
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [...filtered, data];
      });
    });

    const unsubscribeUserLeft = subscribe('user_left', (data: PresenceEventData) => {
      setPresenceData(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    return () => {
      unsubscribePresenceUpdated();
      unsubscribeUserJoined();
      unsubscribeUserLeft();
    };
  }, [subscribe, isConnected]);

  // Update own presence
  const updateOwnPresence = useCallback((data: { status?: 'online' | 'offline' | 'away' | 'busy'; currentActivity?: string; location?: string }) => {
    updatePresence(data);
  }, [updatePresence]);

  // Get presence for a specific user
  const getUserPresence = useCallback((userId: string): PresenceEventData | undefined => {
    return presenceData.get(userId);
  }, [presenceData]);

  // Check if user is online
  const isUserOnline = useCallback((userId: string): boolean => {
    const presence = presenceData.get(userId);
    return presence?.status === 'online';
  }, [presenceData]);

  return {
    presenceData,
    onlineUsers,
    updateOwnPresence,
    getUserPresence,
    isUserOnline,
    isConnected
  };
}

// Hook for real-time notifications
export function useRealtimeNotifications() {
  const { subscribe, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<NotificationEventData[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlertEventData[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to notification events
    const unsubscribeNotification = subscribe('notification', (data: NotificationEventData) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadNotifications(prev => prev + 1);
    });

    const unsubscribeSystemAlert = subscribe('system_alert', (data: SystemAlertEventData) => {
      setSystemAlerts(prev => [data, ...prev]);
      if (data.actionRequired) {
        setUnreadNotifications(prev => prev + 1);
      }
    });

    return () => {
      unsubscribeNotification();
      unsubscribeSystemAlert();
    };
  }, [subscribe, isConnected]);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadNotifications(0);
  }, []);

  return {
    notifications,
    systemAlerts,
    unreadNotifications,
    markNotificationAsRead,
    clearNotifications,
    isConnected
  };
}

// Hook for real-time queue updates
export function useRealtimeQueue() {
  const { subscribe, isConnected } = useSocket();
  const [queueData, setQueueData] = useState<QueueEventData | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to queue updates
    const unsubscribeQueueUpdated = subscribe('queue_updated', (data: QueueEventData) => {
      setQueueData(data);
    });

    return () => {
      unsubscribeQueueUpdated();
    };
  }, [subscribe, isConnected]);

  return {
    queueData,
    isConnected
  };
}

// Hook for general Socket.io events with custom handlers
export function useSocketEvent<K extends keyof ServerToClientEvents>(
  event: K,
  handler: ServerToClientEvents[K],
  deps: any[] = []
) {
  const { subscribe, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(event, handler);
    return unsubscribe;
  }, [subscribe, isConnected, event, ...deps]);
}

// Note: useSocketConnection is now available from @/components/socket-provider
// This ensures a single source of truth for socket connection management
