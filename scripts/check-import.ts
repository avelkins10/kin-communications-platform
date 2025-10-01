import { RealtimeNotifications } from '../src/components/ui/realtime-notifications';
import { SessionProvider } from '../src/components/session-provider';
import { SocketProvider } from '../src/components/socket-provider';
import { ErrorBoundary } from '../src/components/ui/error-boundary';
import { Toaster } from 'sonner';

console.log('RealtimeNotifications', typeof RealtimeNotifications);
console.log('SessionProvider', typeof SessionProvider);
console.log('SocketProvider', typeof SocketProvider);
console.log('ErrorBoundary', typeof ErrorBoundary);
console.log('Toaster', typeof Toaster);
