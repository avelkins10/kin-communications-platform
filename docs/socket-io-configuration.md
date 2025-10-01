# Socket.io Configuration

This document outlines the Socket.io real-time functionality implementation in the KIN Communications Platform.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Socket.io Configuration
SOCKET_IO_CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
NEXT_PUBLIC_SOCKET_IO_URL=http://localhost:3000
```

## Features Implemented

### Real-time Events
- **Voicemail Events**: `voicemail_created`, `voicemail_updated`
- **Call Events**: `call_incoming`, `call_status_changed`, `call_completed`, `call_recording_available`
- **Message Events**: `message_received`, `message_status_changed`, `conversation_updated`
- **TaskRouter Events**: `task_assigned`, `task_accepted`, `task_rejected`, `task_completed`, `worker_status_changed`, `worker_activity_changed`
- **Presence Events**: `user_presence_updated`
- **System Notifications**: `system_notification`

### Components
- **SocketProvider**: React context for Socket.io client management
- **RealtimeNotifications**: Toast notifications for real-time events
- **ActivityFeed**: Live activity feed showing recent events
- **PresenceIndicator**: User online/offline status indicator

### Hooks Enhanced
- **useVoicemails**: Real-time voicemail updates
- **useMessages**: Real-time message updates
- **useTaskRouter**: Real-time task and worker updates

### Webhook Integration
All webhook handlers now broadcast real-time events:
- `/api/webhooks/twilio/voice/route.ts`
- `/api/webhooks/twilio/sms/route.ts`
- `/api/webhooks/twilio/recording/route.ts`
- `/api/webhooks/twilio/status/route.ts`
- `/api/webhooks/twilio/message-status/route.ts`
- `/api/webhooks/taskrouter/route.ts`

### API Integration
API routes now broadcast events for:
- Voicemail operations
- Message operations
- TaskRouter worker operations

## Usage

### Client-side
```typescript
import { useSocket } from '@/lib/hooks/use-socket';

function MyComponent() {
  const { on, off, emit, isConnected } = useSocket();
  
  useEffect(() => {
    const handleVoicemailCreated = (payload) => {
      console.log('New voicemail:', payload);
    };
    
    on('voicemail_created', handleVoicemailCreated);
    
    return () => {
      off('voicemail_created', handleVoicemailCreated);
    };
  }, [on, off]);
}
```

### Server-side
```typescript
import { broadcastVoicemailCreated } from '@/lib/socket/events';

// In your API route or webhook handler
broadcastVoicemailCreated({
  id: voicemail.id,
  callerId: voicemail.fromNumber,
  // ... other payload data
});
```

## Room Management

Users are automatically joined to rooms based on:
- Personal room: `user-{userId}`
- Role-based room: `role-{role}`
- Department-based room: `department-{department}`

Events are broadcast to relevant rooms to ensure users only receive notifications they should see.

## Security

- Socket.io connections require authentication via NextAuth.js session
- CORS is configured to restrict origins
- Events are broadcast only to authorized users based on their roles and departments
