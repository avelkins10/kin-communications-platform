'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRealtimeNotifications, useRealtimeVoicemails, useRealtimeCalls, useRealtimeMessages, useRealtimeTaskRouter } from '@/lib/hooks/use-socket';
import { NotificationEventData, SystemAlertEventData } from '@/types/socket';
import { Bell, Phone, MessageSquare, Voicemail, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface RealtimeNotificationsProps {
  className?: string;
  showToast?: boolean;
  showPanel?: boolean;
  maxNotifications?: number;
}

export function RealtimeNotifications({ 
  className,
  showToast = true,
  showPanel = false,
  maxNotifications = 10
}: RealtimeNotificationsProps) {
  const { 
    notifications, 
    systemAlerts, 
    unreadNotifications, 
    markNotificationAsRead, 
    clearNotifications 
  } = useRealtimeNotifications();
  
  const { newVoicemails } = useRealtimeVoicemails();
  const { activeCalls } = useRealtimeCalls();
  const { unreadCount: unreadMessages } = useRealtimeMessages();
  const { pendingTasks } = useRealtimeTaskRouter();

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Show toast notifications for new events
  useEffect(() => {
    if (!showToast) return;

    // Show toast for new voicemails
    newVoicemails.forEach(voicemail => {
      toast.success('New Voicemail', {
        description: `From ${voicemail.callerName || voicemail.callerId}`,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to voicemail or open modal
            console.log('Navigate to voicemail:', voicemail.id);
          }
        },
        duration: 5000
      });
    });

    // Show toast for incoming calls
    activeCalls.forEach(call => {
      if (call.status === 'ringing') {
        toast.info('Incoming Call', {
          description: `From ${call.customerName || call.from}`,
          action: {
            label: 'Answer',
            onClick: () => {
              // Handle call answer
              console.log('Answer call:', call.id);
            }
          },
          duration: 10000,
          data: { 'data-testid': 'incoming-call-notification' }
        });
      }
    });

    // Show toast for new messages
    if (unreadMessages > 0) {
      toast.info('New Message', {
        description: `${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}`,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to messages
            console.log('Navigate to messages');
          }
        },
        duration: 5000
      });
    }

    // Show toast for new tasks
    pendingTasks.forEach(task => {
      toast.warning('New Task Assigned', {
        description: `Task in ${task.taskQueueName}`,
        action: {
          label: 'View',
          onClick: () => {
            // Navigate to task or show details
            console.log('Navigate to task:', task.id);
          }
        },
        duration: 5000
      });
    });

    // Show toast for system notifications
    notifications.forEach(notification => {
      if (notification.priority === 'high') {
        const toastType = notification.type === 'error' ? 'error' : 
                         notification.type === 'warning' ? 'warning' : 
                         notification.type === 'success' ? 'success' : 'info';
        
        toast[toastType](notification.title, {
          description: notification.message,
          action: notification.actionUrl ? {
            label: notification.actionText || 'View',
            onClick: () => {
              // Navigate to action URL
              window.open(notification.actionUrl, '_blank');
            }
          } : undefined,
          duration: notification.autoDismiss ? (notification.dismissAfter || 5000) : undefined
        });
      }
    });

    // Show toast for system alerts
    systemAlerts.forEach(alert => {
      if (alert.severity === 'critical' || alert.severity === 'high') {
        toast.error(alert.title, {
          description: alert.message,
          action: alert.actionUrl ? {
            label: alert.actionText || 'View',
            onClick: () => {
              // Navigate to action URL
              window.open(alert.actionUrl, '_blank');
            }
          } : undefined,
          duration: alert.actionRequired ? undefined : 10000
        });
      }
    });

  }, [newVoicemails, activeCalls, unreadMessages, pendingTasks, notifications, systemAlerts, showToast]);

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'voicemail':
        return <Voicemail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'task':
        return <CheckCircle className="w-4 h-4" />;
      case 'system':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  // Get notification color
  const getNotificationColor = (type: string, priority?: string) => {
    if (priority === 'high') {
      switch (type) {
        case 'error':
          return 'text-red-600';
        case 'warning':
          return 'text-yellow-600';
        case 'success':
          return 'text-green-600';
        default:
          return 'text-blue-600';
      }
    }
    return 'text-gray-600';
  };

  // Format notification time
  const formatNotificationTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Notification panel component
  const NotificationPanel = () => {
    if (!showPanel || !isPanelOpen) return null;

    const allNotifications = [
      ...notifications.map(n => ({ ...n, type: 'notification' as const })),
      ...systemAlerts.map(a => ({ ...a, type: 'alert' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, maxNotifications);

    return (
      <Card className="absolute right-0 top-full mt-2 w-80 z-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Notifications</CardTitle>
            <div className="flex items-center gap-2">
              {unreadNotifications > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadNotifications}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearNotifications}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64">
            {allNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="space-y-1">
                {allNotifications.map((notification, index) => (
                  <div
                    key={`${notification.type}-${notification.id}-${index}`}
                    className="p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      if ('read' in notification && !notification.read) {
                        markNotificationAsRead(notification.id);
                      }
                      if ('actionUrl' in notification && notification.actionUrl) {
                        window.open(notification.actionUrl, '_blank');
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'flex-shrink-0 mt-0.5',
                        getNotificationColor(notification.type, 'priority' in notification ? notification.priority : undefined)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {'title' in notification ? notification.title : 'System Alert'}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {'message' in notification ? notification.message : 'System alert'}
                        </p>
                        {'actionUrl' in notification && notification.actionUrl && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs mt-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(notification.actionUrl, '_blank');
                            }}
                          >
                            {notification.actionText || 'View'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadNotifications > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadNotifications > 99 ? '99+' : unreadNotifications}
          </Badge>
        )}
      </Button>
      <NotificationPanel />
    </div>
  );
}

// Quick notification summary component
export function NotificationSummary({ className }: { className?: string }) {
  const { unreadNotifications } = useRealtimeNotifications();
  const { newVoicemails } = useRealtimeVoicemails();
  const { activeCalls } = useRealtimeCalls();
  const { unreadCount: unreadMessages } = useRealtimeMessages();
  const { pendingTasks } = useRealtimeTaskRouter();

  const totalUnread = unreadNotifications + newVoicemails.length + unreadMessages + pendingTasks.length;

  if (totalUnread === 0) return null;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Bell className="w-4 h-4" />
      <span className="text-sm font-medium">
        {totalUnread} notification{totalUnread !== 1 ? 's' : ''}
      </span>
      {newVoicemails.length > 0 && (
        <Badge variant="secondary" className="text-xs">
          {newVoicemails.length} voicemail{newVoicemails.length !== 1 ? 's' : ''}
        </Badge>
      )}
      {activeCalls.length > 0 && (
        <Badge variant="destructive" className="text-xs">
          {activeCalls.length} call{activeCalls.length !== 1 ? 's' : ''}
        </Badge>
      )}
      {unreadMessages > 0 && (
        <Badge variant="info" className="text-xs">
          {unreadMessages} message{unreadMessages !== 1 ? 's' : ''}
        </Badge>
      )}
      {pendingTasks.length > 0 && (
        <Badge variant="warning" className="text-xs">
          {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}
