'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSocket } from '@/components/socket-provider';
import { PresenceEventData } from '@/types/socket';
import { cn } from '@/lib/utils';

interface PresenceIndicatorProps {
  userId: string;
  userName?: string;
  showName?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function PresenceIndicator({ 
  userId, 
  userName, 
  showName = false, 
  size = 'md',
  showTooltip = true,
  className 
}: PresenceIndicatorProps) {
  const { connectionState } = useSocket();
  
  // For now, we'll use a simple online/offline status based on socket connection
  // In the future, this should be enhanced with actual user presence data
  const isOnline = connectionState.connected;
  const presence = {
    status: isOnline ? 'online' : 'offline',
    userName: userName || 'Unknown User',
    lastSeen: connectionState.lastConnected
  };
  
  // Size classes for the indicator dot
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  // Status colors
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'offline':
      default:
        return 'bg-gray-400';
    }
  };

  // Status text
  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  // Format last seen time
  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Unknown';
    
    const date = new Date(lastSeen);
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

  const indicator = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full border-2 border-white shadow-sm',
            sizeClasses[size],
            getStatusColor(presence?.status)
          )}
        />
        {isOnline && (
          <div
            className={cn(
              'absolute inset-0 rounded-full animate-ping',
              sizeClasses[size],
              getStatusColor(presence?.status),
              'opacity-75'
            )}
          />
        )}
      </div>
      {showName && (
        <span className="text-sm font-medium">
          {userName || presence?.userName || 'Unknown User'}
        </span>
      )}
    </div>
  );

  if (!showTooltip) {
    return indicator;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {indicator}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="font-medium">
              {userName || presence?.userName || 'Unknown User'}
            </div>
            <div className="text-sm text-muted-foreground">
              Status: {getStatusText(presence?.status)}
            </div>
            {presence?.currentActivity && (
              <div className="text-sm text-muted-foreground">
                Activity: {presence.currentActivity}
              </div>
            )}
            {presence?.lastSeen && (
              <div className="text-sm text-muted-foreground">
                Last seen: {formatLastSeen(presence.lastSeen)}
              </div>
            )}
            {presence?.location && (
              <div className="text-sm text-muted-foreground">
                Location: {presence.location}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface PresenceBadgeProps {
  userId: string;
  userName?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  className?: string;
}

export function PresenceBadge({ 
  userId, 
  userName, 
  variant = 'default',
  className 
}: PresenceBadgeProps) {
  const { connectionState } = useSocket();
  
  const isOnline = connectionState.connected;
  const presence = {
    status: isOnline ? 'online' : 'offline',
    userName: userName || 'Unknown User'
  };
  
  // Get badge variant based on status
  const getBadgeVariant = (status?: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'away':
        return 'warning';
      case 'busy':
        return 'destructive';
      case 'offline':
      default:
        return 'secondary';
    }
  };

  // Get status text
  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  return (
    <Badge 
      variant={getBadgeVariant(presence?.status) as any}
      className={cn('flex items-center gap-1', className)}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-white' : 'bg-gray-400'
        )}
      />
      {userName || presence?.userName || 'Unknown User'} - {getStatusText(presence?.status)}
    </Badge>
  );
}

interface PresenceListProps {
  userIds: string[];
  showOffline?: boolean;
  maxDisplay?: number;
  className?: string;
}

export function PresenceList({ 
  userIds, 
  showOffline = false, 
  maxDisplay = 5,
  className 
}: PresenceListProps) {
  const { connectionState } = useSocket();
  
  // Filter users based on online status
  const filteredUsers = userIds.filter(userId => {
    const isOnline = connectionState.connected;
    return showOffline || isOnline;
  });

  // Limit display count
  const displayUsers = filteredUsers.slice(0, maxDisplay);
  const remainingCount = filteredUsers.length - maxDisplay;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {displayUsers.map(userId => {
        return (
          <PresenceIndicator
            key={userId}
            userId={userId}
            userName="Unknown User"
            size="sm"
            showTooltip={true}
          />
        );
      })}
      {remainingCount > 0 && (
        <div className="text-sm text-muted-foreground">
          +{remainingCount} more
        </div>
      )}
    </div>
  );
}

interface OnlineUsersCountProps {
  className?: string;
}

export function OnlineUsersCount({ className }: OnlineUsersCountProps) {
  const { connectionState } = useSocket();
  
  return (
    <div className={cn('text-sm text-muted-foreground', className)}>
      {connectionState.connected ? '1 user online' : '0 users online'}
    </div>
  );
}
