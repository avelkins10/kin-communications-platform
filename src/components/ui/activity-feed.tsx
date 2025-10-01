'use client';

import React, { useState, useMemo } from 'react';
import { useSocketEvents, useRealtimeVoicemails, useRealtimeCalls, useRealtimeMessages, useRealtimeTaskRouter, usePresence } from '@/lib/hooks/use-socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PresenceIndicator } from '@/components/ui/presence-indicator';
import { 
  Voicemail, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  User, 
  Clock, 
  Filter,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  autoRefresh?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'voicemail' | 'call' | 'message' | 'task' | 'presence' | 'system';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  status?: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}

export function ActivityFeed({ 
  className,
  maxItems = 50,
  showFilters = true,
  autoRefresh = true
}: ActivityFeedProps) {
  const { events, clearEvents } = useSocketEvents();
  const { voicemails } = useRealtimeVoicemails();
  const { calls } = useRealtimeCalls();
  const { messages } = useRealtimeMessages();
  const { tasks } = useRealtimeTaskRouter();
  const { onlineUsers } = usePresence();

  const [filters, setFilters] = useState<{
    types: string[];
    users: string[];
    timeRange: 'all' | '1h' | '24h' | '7d';
  }>({
    types: ['voicemail', 'call', 'message', 'task', 'presence'],
    users: [],
    timeRange: '24h'
  });

  // Convert real-time data to activity items
  const activityItems = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add voicemail activities
    voicemails.slice(0, 10).forEach(voicemail => {
      items.push({
        id: `voicemail-${voicemail.id}`,
        type: 'voicemail',
        title: 'New Voicemail',
        description: `From ${voicemail.callerName || voicemail.callerId} (${voicemail.duration}s)`,
        timestamp: voicemail.createdAt,
        status: voicemail.status,
        priority: voicemail.priority,
        metadata: {
          callerId: voicemail.callerId,
          duration: voicemail.duration,
          assignedTo: voicemail.assignedTo
        }
      });
    });

    // Add call activities
    calls.slice(0, 10).forEach(call => {
      items.push({
        id: `call-${call.id}`,
        type: 'call',
        title: 'Call Activity',
        description: `${call.direction} call ${call.status} - ${call.customerName || call.from}`,
        timestamp: call.createdAt,
        status: call.status,
        metadata: {
          direction: call.direction,
          duration: call.duration,
          customerId: call.customerId
        }
      });
    });

    // Add message activities
    messages.slice(0, 10).forEach(message => {
      items.push({
        id: `message-${message.id}`,
        type: 'message',
        title: 'Message Activity',
        description: `${message.direction} message ${message.status} - ${message.customerName || message.from}`,
        timestamp: message.createdAt,
        status: message.status,
        metadata: {
          direction: message.direction,
          conversationId: message.conversationId,
          customerId: message.customerId
        }
      });
    });

    // Add task activities
    tasks.slice(0, 10).forEach(task => {
      items.push({
        id: `task-${task.id}`,
        type: 'task',
        title: 'Task Activity',
        description: `Task ${task.status} in ${task.taskQueueName}`,
        timestamp: task.createdAt,
        status: task.status,
        priority: task.priority > 5 ? 'high' : task.priority > 2 ? 'medium' : 'low',
        metadata: {
          taskQueueName: task.taskQueueName,
          workerSid: task.workerSid,
          attributes: task.attributes
        }
      });
    });

    // Add presence activities
    onlineUsers.slice(0, 5).forEach(user => {
      items.push({
        id: `presence-${user.userId}`,
        type: 'presence',
        title: 'User Online',
        description: `${user.userName} is ${user.status}`,
        timestamp: user.lastSeen,
        user: {
          id: user.userId,
          name: user.userName
        },
        metadata: {
          currentActivity: user.currentActivity,
          location: user.location
        }
      });
    });

    // Sort by timestamp (newest first)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [voicemails, calls, messages, tasks, onlineUsers]);

  // Filter activity items
  const filteredItems = useMemo(() => {
    let filtered = activityItems;

    // Filter by type
    if (filters.types.length > 0) {
      filtered = filtered.filter(item => filters.types.includes(item.type));
    }

    // Filter by user
    if (filters.users.length > 0) {
      filtered = filtered.filter(item => 
        item.user && filters.users.includes(item.user.id)
      );
    }

    // Filter by time range
    const now = new Date();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };

    if (filters.timeRange !== 'all') {
      const timeRange = timeRanges[filters.timeRange];
      filtered = filtered.filter(item => {
        const itemTime = new Date(item.timestamp).getTime();
        return now.getTime() - itemTime <= timeRange;
      });
    }

    return filtered.slice(0, maxItems);
  }, [activityItems, filters, maxItems]);

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'voicemail':
        return <Voicemail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'task':
        return <CheckCircle className="w-4 h-4" />;
      case 'presence':
        return <User className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Get activity color
  const getActivityColor = (type: string, priority?: string) => {
    switch (type) {
      case 'voicemail':
        return priority === 'high' ? 'text-red-600' : 'text-blue-600';
      case 'call':
        return 'text-green-600';
      case 'message':
        return 'text-purple-600';
      case 'task':
        return 'text-orange-600';
      case 'presence':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Toggle filter
  const toggleFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Activity Feed</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearEvents}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="space-y-3">
            {/* Type filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Types:</span>
              {['voicemail', 'call', 'message', 'task', 'presence'].map(type => (
                <Button
                  key={type}
                  variant={filters.types.includes(type) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleFilter(type)}
                  className="h-6 text-xs capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Time range filter */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Time:</span>
              {(['1h', '24h', '7d', 'all'] as const).map(range => (
                <Button
                  key={range}
                  variant={filters.timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, timeRange: range }))}
                  className="h-6 text-xs"
                >
                  {range === 'all' ? 'All' : range}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex-shrink-0 mt-0.5',
                      getActivityColor(item.type, item.priority)
                    )}>
                      {getActivityIcon(item.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">
                          {item.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {item.user && (
                          <div className="flex items-center gap-1">
                            <PresenceIndicator
                              userId={item.user.id}
                              userName={item.user.name}
                              size="sm"
                              showTooltip={false}
                            />
                            <span className="text-xs text-muted-foreground">
                              {item.user.name}
                            </span>
                          </div>
                        )}
                        
                        {item.status && (
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                        )}
                        
                        {item.priority && (
                          <Badge 
                            variant={item.priority === 'high' ? 'destructive' : 
                                   item.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.priority}
                          </Badge>
                        )}
                      </div>
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
}

// Compact activity feed for smaller spaces
export function CompactActivityFeed({ className }: { className?: string }) {
  const { voicemails } = useRealtimeVoicemails();
  const { calls } = useRealtimeCalls();
  const { messages } = useRealtimeMessages();
  const { tasks } = useRealtimeTaskRouter();

  const recentActivity = useMemo(() => {
    const items = [
      ...voicemails.slice(0, 3).map(v => ({ ...v, type: 'voicemail' as const })),
      ...calls.slice(0, 3).map(c => ({ ...c, type: 'call' as const })),
      ...messages.slice(0, 3).map(m => ({ ...m, type: 'message' as const })),
      ...tasks.slice(0, 3).map(t => ({ ...t, type: 'task' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
     .slice(0, 5);

    return items;
  }, [voicemails, calls, messages, tasks]);

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-sm font-medium">Recent Activity</h3>
      {recentActivity.length === 0 ? (
        <p className="text-xs text-muted-foreground">No recent activity</p>
      ) : (
        <div className="space-y-1">
          {recentActivity.map((item, index) => (
            <div key={`${item.type}-${item.id}-${index}`} className="flex items-center gap-2 text-xs">
              <div className={cn(
                'w-2 h-2 rounded-full',
                item.type === 'voicemail' ? 'bg-blue-500' :
                item.type === 'call' ? 'bg-green-500' :
                item.type === 'message' ? 'bg-purple-500' :
                'bg-orange-500'
              )} />
              <span className="truncate">
                {item.type === 'voicemail' ? 'New voicemail' :
                 item.type === 'call' ? 'Call activity' :
                 item.type === 'message' ? 'Message activity' :
                 'Task activity'}
              </span>
              <span className="text-muted-foreground">
                {new Date(item.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
