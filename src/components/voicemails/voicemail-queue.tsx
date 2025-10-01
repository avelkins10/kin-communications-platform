'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Play, 
  Phone, 
  Eye, 
  EyeOff, 
  User, 
  Flag, 
  Trash2, 
  Clock,
  MessageSquare
} from 'lucide-react';
import { Voicemail, VoicemailPriority } from '@/types/index';
import { cn } from '@/lib/utils';
import { VoicemailAssignment } from './voicemail-assignment';
import { PresenceIndicator } from '@/components/ui/presence-indicator';
import { useSocket } from '@/components/socket-provider';
import { QueueItemList } from '@/components/ui/queue-item-card';
import { QueueItem } from '@/types/layout';

interface VoicemailQueueProps {
  voicemails: Voicemail[];
  loading?: boolean;
  onPlay?: (voicemail: Voicemail) => void;
  onCallback?: (voicemail: Voicemail) => void;
  onMarkRead?: (voicemail: Voicemail) => void;
  onMarkUnread?: (voicemail: Voicemail) => void;
  onAssign?: (voicemailId: string, data: any) => void;
  onDelete?: (voicemail: Voicemail) => void;
  selectedVoicemails?: string[];
  onSelectionChange?: (voicemailIds: string[]) => void;
  useUnifiedView?: boolean; // New prop to use unified queue view
}

const priorityColors: Record<VoicemailPriority, string> = {
  LOW: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const priorityIcons: Record<VoicemailPriority, React.ReactNode> = {
  LOW: <Flag className="h-3 w-3" />,
  NORMAL: <Flag className="h-3 w-3" />,
  HIGH: <Flag className="h-3 w-3" />,
  URGENT: <Flag className="h-3 w-3" />,
};

// Convert Voicemail to QueueItem for unified queue model
const convertVoicemailToQueueItem = (voicemail: Voicemail): QueueItem => {
  const priorityMap: Record<VoicemailPriority, 'urgent' | 'high' | 'medium' | 'low'> = {
    URGENT: 'urgent',
    HIGH: 'high',
    NORMAL: 'medium',
    LOW: 'low'
  };

  return {
    id: voicemail.id,
    type: 'voicemail',
    priority: priorityMap[voicemail.priority],
    status: voicemail.readAt ? 'completed' : 'new',
    customer: {
      id: voicemail.contact?.id || voicemail.fromNumber,
      name: voicemail.contact ? `${voicemail.contact.firstName} ${voicemail.contact.lastName}` : voicemail.fromNumber,
      phone: voicemail.fromNumber,
      email: voicemail.contact?.email
    },
    assignedTo: voicemail.assignedTo ? {
      id: voicemail.assignedTo.id,
      name: voicemail.assignedTo.name || voicemail.assignedTo.email,
      email: voicemail.assignedTo.email,
      role: 'employee',
      status: 'available'
    } : undefined,
    sla: voicemail.sla ? {
      deadline: new Date(voicemail.sla.deadline),
      type: 'voicemail-callback',
      warningThreshold: 15,
      escalationLevel: 1,
      autoEscalate: true
    } : undefined,
    metadata: {
      duration: voicemail.duration,
      transcript: voicemail.transcription,
      createdAt: new Date(voicemail.createdAt),
      updatedAt: new Date(voicemail.updatedAt),
      source: 'voicemail'
    },
    actions: {
      canPlay: true,
      canCallback: true,
      canAssign: true,
      canComplete: true,
      canDelete: true
    }
  };
};

export function VoicemailQueue({
  voicemails,
  loading = false,
  onPlay,
  onCallback,
  onMarkRead,
  onMarkUnread,
  onAssign,
  onDelete,
  selectedVoicemails = [],
  onSelectionChange,
  useUnifiedView = false,
}: VoicemailQueueProps) {
  const [sortBy, setSortBy] = useState<'createdAt' | 'priority' | 'readAt' | 'assignedToId'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { isConnected } = useSocket();

  // If using unified view, render with QueueItemList
  if (useUnifiedView) {
    const queueItems = voicemails.map(convertVoicemailToQueueItem);
    
    const handleItemAction = (action: string, item: QueueItem) => {
      const voicemail = voicemails.find(v => v.id === item.id);
      if (!voicemail) return;

      switch (action) {
        case 'play':
          onPlay?.(voicemail);
          break;
        case 'callback':
          onCallback?.(voicemail);
          break;
        case 'complete':
          onMarkRead?.(voicemail);
          break;
        case 'assign':
          // Handle assignment
          break;
        case 'delete':
          onDelete?.(voicemail);
          break;
      }
    };

    return (
      <div className="space-y-4">
        {/* Real-time Status Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Real-time updates active' : 'Real-time updates offline'}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {voicemails.length} voicemail{voicemails.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <QueueItemList
            items={queueItems}
            onItemAction={handleItemAction}
            showCustomerContext={true}
            compact={false}
          />
        )}
      </div>
    );
  }

  const formatDuration = (seconds?: number | null): string => {
    if (!seconds) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCallerName = (voicemail: Voicemail): string => {
    if (voicemail.contact) {
      return `${voicemail.contact.firstName} ${voicemail.contact.lastName}`;
    }
    return voicemail.fromNumber;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(voicemails.map(v => v.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectVoicemail = (voicemailId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedVoicemails, voicemailId]);
    } else {
      onSelectionChange?.(selectedVoicemails.filter(id => id !== voicemailId));
    }
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedVoicemails = [...voicemails].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'priority':
        const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      case 'readAt':
        aValue = a.readAt ? 0 : 1; // Unread (null) comes first
        bValue = b.readAt ? 0 : 1;
        break;
      case 'assignedToId':
        aValue = a.assignedTo?.name || a.assignedTo?.email || '';
        bValue = b.assignedTo?.name || b.assignedTo?.email || '';
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (voicemails.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No voicemails found</h3>
        <p className="text-sm text-muted-foreground">
          New voicemails will appear here when they are received.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Real-time Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Real-time updates active' : 'Real-time updates offline'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {voicemails.length} voicemail{voicemails.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedVoicemails.length === voicemails.length && voicemails.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('readAt')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortBy === 'readAt' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1">
                  Priority
                  {sortBy === 'priority' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead>Caller</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Transcription</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('assignedToId')}
              >
                <div className="flex items-center gap-1">
                  Assigned To
                  {sortBy === 'assignedToId' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1">
                  Received
                  {sortBy === 'createdAt' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVoicemails.map((voicemail) => {
              const isNew = !voicemail.readAt;
              return (
              <TableRow 
                key={voicemail.id}
                className={cn(
                  isNew && 'bg-blue-50/50 border-l-4 border-l-blue-500',
                  'hover:bg-muted/50 transition-colors'
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedVoicemails.includes(voicemail.id)}
                    onCheckedChange={(checked) => 
                      handleSelectVoicemail(voicemail.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={isNew ? 'default' : 'secondary'}
                    className={cn(
                      isNew && 'animate-pulse bg-blue-600 hover:bg-blue-700',
                      'transition-colors'
                    )}
                  >
                    {isNew ? 'New' : 'Read'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[voicemail.priority]}>
                    {priorityIcons[voicemail.priority]}
                    <span className="ml-1">{voicemail.priority}</span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{formatCallerName(voicemail)}</div>
                    <div className="text-sm text-muted-foreground">
                      {voicemail.fromNumber}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatDuration(voicemail.duration)}
                  </div>
                </TableCell>
                <TableCell>
                  {voicemail.transcription ? (
                    <div className="max-w-xs truncate text-sm">
                      {voicemail.transcription}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">No transcription</span>
                  )}
                </TableCell>
                <TableCell>
                  {voicemail.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <PresenceIndicator
                        userId={voicemail.assignedTo.id}
                        userName={voicemail.assignedTo.name || voicemail.assignedTo.email}
                        size="sm"
                        showTooltip={true}
                      />
                      <div className="font-medium">
                        {voicemail.assignedTo.name || voicemail.assignedTo.email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(voicemail.createdAt), 'MMM d, h:mm a')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onPlay?.(voicemail)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCallback?.(voicemail)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => 
                        isNew ? onMarkRead?.(voicemail) : onMarkUnread?.(voicemail)
                      }
                    >
                      {isNew ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <VoicemailAssignment
                      voicemail={voicemail}
                      onAssign={onAssign || (() => {})}
                      loading={loading}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete?.(voicemail)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
