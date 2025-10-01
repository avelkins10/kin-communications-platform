'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { socketClient } from '@/lib/socket/client';
import { 
  SocketConnectionState, 
  ServerToClientEvents, 
  RoomType,
  EventSubscription 
} from '@/types/socket';

interface SocketContextType {
  // Connection state
  connectionState: SocketConnectionState;
  isConnected: boolean;
  
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Room management
  joinRoom: (room: RoomType) => void;
  leaveRoom: (room: RoomType) => void;
  
  // Presence management
  updatePresence: (data: { status?: 'online' | 'offline' | 'away' | 'busy'; currentActivity?: string; location?: string }) => void;
  
  // User actions
  markVoicemailRead: (voicemailId: string) => void;
  acceptTask: (taskId: string) => void;
  rejectTask: (taskId: string) => void;
  
  // Event subscription
  subscribe: <K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K],
    once?: boolean
  ) => () => void;
  
  // Custom events
  emitCustomEvent: (data: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status } = useSession();
  const [connectionState, setConnectionState] = useState<SocketConnectionState>({
    connected: false,
    connecting: false,
    reconnectAttempts: 0
  });
  const [isConnected, setIsConnected] = useState(false);

  const connect = React.useCallback(async (): Promise<void> => {
    if (!session?.user?.id) {
      return;
    }

    try {
      // Fetch socket token from API
      const response = await fetch('/api/socket/token', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.warn('[Socket] Failed to get socket token:', response.status);
        return;
      }

      const { token } = await response.json();
      await socketClient.connect(token);
    } catch (error) {
      console.error('[Socket] Connection error:', error);
    }
  }, [session?.user?.id]);

  const disconnect = React.useCallback((): void => {
    socketClient.disconnect();
    console.log('Socket.io disconnected');
  }, []);

  useEffect(() => {
    const updateConnectionState = () => {
      const state = socketClient.getConnectionState();
      setConnectionState(state);
      setIsConnected(state.connected);
    };

    updateConnectionState();
    const interval = setInterval(updateConnectionState, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Expose socket client for testing in development/test builds
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      // @ts-ignore
      window.__socketClient = socketClient;
    }

    if (status === 'authenticated' && session?.user?.id && !isConnected) {
      connect();
    } else if (status === 'unauthenticated' && isConnected) {
      disconnect();
    }
  }, [status, session?.user?.id, isConnected, connect, disconnect]);

  // Join a room
  const joinRoom = (room: RoomType): void => {
    socketClient.joinRoom(room);
  };

  // Leave a room
  const leaveRoom = (room: RoomType): void => {
    socketClient.leaveRoom(room);
  };

  // Update user presence
  const updatePresence = (data: { status?: 'online' | 'offline' | 'away' | 'busy'; currentActivity?: string; location?: string }): void => {
    socketClient.updatePresence(data);
  };

  // Mark voicemail as read
  const markVoicemailRead = (voicemailId: string): void => {
    socketClient.markVoicemailRead(voicemailId);
  };

  // Accept a task
  const acceptTask = (taskId: string): void => {
    socketClient.acceptTask(taskId);
  };

  // Reject a task
  const rejectTask = (taskId: string): void => {
    socketClient.rejectTask(taskId);
  };

  // Subscribe to an event
  const subscribe = <K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K],
    once: boolean = false
  ): (() => void) => {
    return socketClient.subscribe(event, handler, once);
  };

  // Emit custom event
  const emitCustomEvent = (data: any): void => {
    socketClient.emitCustomEvent(data);
  };

  // Auto-join user to appropriate rooms when connected
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isConnected && session?.user) {
      const user = session.user as any;
      
      // Join global room
      joinRoom('global');
      
      // Join role-based room
      if (user.role) {
        joinRoom(`role:${user.role}` as RoomType);
      }
      
      // Join department room if user has a department
      if (user.department) {
        joinRoom(`department:${user.department}` as RoomType);
      }
      
      // Join user-specific room
      joinRoom(`user:${user.id}` as RoomType);
      
      // Set initial presence
      updatePresence({
        status: 'online',
        currentActivity: 'available'
      });
    }
  }, [isConnected, session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const contextValue: SocketContextType = {
    connectionState,
    isConnected,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    updatePresence,
    markVoicemailRead,
    acceptTask,
    rejectTask,
    subscribe,
    emitCustomEvent
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook to use Socket.io context
export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Hook to get connection state only
export function useSocketConnection(): SocketConnectionState {
  const { connectionState } = useSocket();
  return connectionState;
}

// Hook to check if connected
export function useSocketConnected(): boolean {
  const { isConnected } = useSocket();
  return isConnected;
}
