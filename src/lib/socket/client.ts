import { io, Socket } from 'socket.io-client';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  SocketConnectionState,
  EventSubscription,
  RoomType
} from '@/types/socket';

// Socket.io client singleton
class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private connectionState: SocketConnectionState = {
    connected: false,
    connecting: false,
    reconnectAttempts: 0
  };
  private eventSubscriptions: Map<string, EventSubscription[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private authToken: string | null = null;

  constructor() {
    // Ensure clean state on initialization
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionState = {
      connected: false,
      connecting: false,
      reconnectAttempts: 0
    };

    this.setupEventListeners();
  }

  /**
   * Initialize Socket.io client connection
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Only run in browser
      if (typeof window === 'undefined') {
        reject(new Error('Socket.io client can only run in browser'));
        return;
      }

      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.authToken = token;
      this.connectionState.connecting = true;

      // Get Socket.io server URL - use window.location.origin to match current page
      const socketUrl = window.location.origin;

      // Initialize Socket.io client with default path '/socket.io'
      this.socket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        // Use default Socket.IO path (no custom path needed)
      });

      // Connection success
      this.socket.on('connect', () => {
        console.log('Socket.io connected');
        this.connectionState.connected = true;
        this.connectionState.connecting = false;
        this.connectionState.error = undefined;
        this.connectionState.lastConnected = new Date().toISOString();
        this.connectionState.reconnectAttempts = 0;

        // Start heartbeat
        this.startHeartbeat();

        // Re-subscribe to events
        this.resubscribeEvents();

        resolve();
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        this.connectionState.connecting = false;
        this.connectionState.error = error.message;
        this.connectionState.reconnectAttempts++;

        reject(error);
      });

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('Socket.io disconnected:', reason);
        this.connectionState.connected = false;
        this.connectionState.error = reason;
        this.stopHeartbeat();

        // Attempt reconnection for certain disconnect reasons
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          this.scheduleReconnect();
        }
      });

      // Reconnection
      this.socket.on('reconnect', (attemptNumber) => {
        console.log('Socket.io reconnected after', attemptNumber, 'attempts');
        this.connectionState.connected = true;
        this.connectionState.error = undefined;
        this.connectionState.reconnectAttempts = 0;
        this.startHeartbeat();
        this.resubscribeEvents();
      });

      // Reconnection error
      this.socket.on('reconnect_error', (error) => {
        console.error('Socket.io reconnection error:', error);
        this.connectionState.error = error.message;
      });

      // Reconnection failed
      this.socket.on('reconnect_failed', () => {
        console.error('Socket.io reconnection failed');
        this.connectionState.error = 'Reconnection failed';
      });
    });
  }

  /**
   * Disconnect Socket.io client
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Reset connection state completely
    this.connectionState = {
      connected: false,
      connecting: false,
      reconnectAttempts: 0
    };
    this.authToken = null;

    this.stopHeartbeat();
    this.clearReconnectTimer();
  }

  /**
   * Get connection state
   */
  getConnectionState(): SocketConnectionState {
    const state = {
      ...this.connectionState,
      connected: this.socket?.connected || false
    };
    return state;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Join a room
   */
  joinRoom(room: RoomType): void {
    if (this.socket?.connected) {
      this.socket.emit('join_room', room);
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(room: RoomType): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', room);
    }
  }

  /**
   * Update user presence
   */
  updatePresence(data: { status?: 'online' | 'offline' | 'away' | 'busy'; currentActivity?: string; location?: string }): void {
    if (this.socket?.connected) {
      this.socket.emit('update_presence', data);
    }
  }

  /**
   * Mark voicemail as read
   */
  markVoicemailRead(voicemailId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_voicemail_read', voicemailId);
    }
  }

  /**
   * Accept a task
   */
  acceptTask(taskId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('accept_task', taskId);
    }
  }

  /**
   * Reject a task
   */
  rejectTask(taskId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('reject_task', taskId);
    }
  }

  /**
   * Emit custom event
   */
  emitCustomEvent(data: any): void {
    if (this.socket?.connected) {
      this.socket.emit('custom_event', data);
    }
  }

  /**
   * Subscribe to an event
   */
  subscribe<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K],
    once: boolean = false
  ): () => void {
    if (!this.socket) {
      console.warn('Socket not connected, cannot subscribe to event:', event);
      return () => {};
    }

    // Store subscription for reconnection
    const subscription: EventSubscription = { event, handler, once };
    if (!this.eventSubscriptions.has(event)) {
      this.eventSubscriptions.set(event, []);
    }
    this.eventSubscriptions.get(event)!.push(subscription);

    // Add event listener
    if (once) {
      this.socket.once(event, handler);
    } else {
      this.socket.on(event, handler);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(event, handler);
    };
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    if (!this.socket) return;

    // Remove from stored subscriptions
    const subscriptions = this.eventSubscriptions.get(event);
    if (subscriptions) {
      const index = subscriptions.findIndex(sub => sub.handler === handler);
      if (index > -1) {
        subscriptions.splice(index, 1);
      }
    }

    // Remove event listener
    this.socket.off(event, handler);
  }

  /**
   * Unsubscribe from all events
   */
  unsubscribeAll(): void {
    if (!this.socket) return;

    this.socket.removeAllListeners();
    this.eventSubscriptions.clear();
  }

  /**
   * Setup global event listeners
   */
  private setupEventListeners(): void {
    // These will be set up when socket connects
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat');
      }
    }, 10000); // 10 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    
    const delay = Math.min(1000 * Math.pow(2, this.connectionState.reconnectAttempts), 30000);
    
    this.reconnectTimer = setTimeout(() => {
      if (this.authToken && !this.connectionState.connected) {
        console.log('Attempting to reconnect...');
        this.connect(this.authToken).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Re-subscribe to events after reconnection
   */
  private resubscribeEvents(): void {
    if (!this.socket) return;

    for (const [event, subscriptions] of this.eventSubscriptions.entries()) {
      subscriptions.forEach(subscription => {
        if (subscription.once) {
          this.socket!.once(event, subscription.handler);
        } else {
          this.socket!.on(event, subscription.handler);
        }
      });
    }
  }
}

// Export singleton instance
export const socketClient = new SocketClient();

// Export class for testing
export { SocketClient };
