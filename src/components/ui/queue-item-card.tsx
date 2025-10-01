"use client";
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlaIndicator, calculateSlaStatus } from "@/components/ui/sla-indicator";
import { cn } from "@/lib/utils";
import { 
  Phone, 
  MessageSquare, 
  Voicemail, 
  Clock, 
  User, 
  Building, 
  CheckCircle,
  Play,
  Pause,
  MoreHorizontal,
  AlertTriangle
} from "lucide-react";
import type { QueueItem, QueueItemType, QueueItemPriority, QueueItemStatus } from "@/types/layout";

interface QueueItemCardProps {
  item: QueueItem;
  onAction?: (action: string, item: QueueItem) => void;
  onSelect?: (item: QueueItem) => void;
  isSelected?: boolean;
  showCustomerContext?: boolean;
  className?: string;
  compact?: boolean;
}

const priorityConfig = {
  urgent: { color: 'bg-red-500', textColor: 'text-red-700', label: 'Urgent' },
  high: { color: 'bg-orange-500', textColor: 'text-orange-700', label: 'High' },
  medium: { color: 'bg-yellow-500', textColor: 'text-yellow-700', label: 'Medium' },
  low: { color: 'bg-green-500', textColor: 'text-green-700', label: 'Low' }
};

const statusConfig = {
  new: { color: 'bg-blue-100', textColor: 'text-blue-700', label: 'New' },
  pending: { color: 'bg-gray-100', textColor: 'text-gray-700', label: 'Pending' },
  assigned: { color: 'bg-purple-100', textColor: 'text-purple-700', label: 'Assigned' },
  'in-progress': { color: 'bg-yellow-100', textColor: 'text-yellow-700', label: 'In Progress' },
  completed: { color: 'bg-green-100', textColor: 'text-green-700', label: 'Completed' },
  overdue: { color: 'bg-red-100', textColor: 'text-red-700', label: 'Overdue' }
};

const typeConfig = {
  call: { icon: Phone, label: 'Call', color: 'text-green-600' },
  voicemail: { icon: Voicemail, label: 'Voicemail', color: 'text-blue-600' },
  message: { icon: MessageSquare, label: 'Message', color: 'text-purple-600' },
  task: { icon: CheckCircle, label: 'Task', color: 'text-orange-600' }
};

export function QueueItemCard({
  item,
  onAction,
  onSelect,
  isSelected = false,
  showCustomerContext = true,
  className,
  compact = false
}: QueueItemCardProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const priorityStyle = priorityConfig[item.priority];
  const statusStyle = statusConfig[item.status];
  const typeStyle = typeConfig[item.type];
  const TypeIcon = typeStyle.icon;

  // Calculate SLA status
  const slaStatus = item.sla ? calculateSlaStatus(item.sla.deadline) : null;

  const handleAction = (action: string) => {
    if (onAction) {
      onAction(action, item);
    }
  };

  const handlePlay = () => {
    if (item.type === 'voicemail') {
      setIsPlaying(!isPlaying);
      handleAction('play');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md cursor-pointer",
        isSelected && "ring-2 ring-primary",
        compact && "p-3",
        className
      )}
      onClick={() => onSelect?.(item)}
    >
      <CardHeader className={cn("pb-3", compact && "p-0")}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full bg-muted", typeStyle.color)}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm">{item.customer.name}</h3>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", priorityStyle.textColor)}
                >
                  {priorityStyle.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{typeStyle.label}</span>
                <span>•</span>
                <span>{formatTimeAgo(item.metadata.createdAt)}</span>
                {item.metadata.duration && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(item.metadata.duration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {slaStatus && (
              <SlaIndicator
                status={slaStatus.status}
                timeRemaining={slaStatus.timeRemaining}
                timeOverdue={slaStatus.timeOverdue}
                slaType={item.sla?.type}
                size="sm"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('more');
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0", compact && "p-0")}>
        {/* Customer Context */}
        {showCustomerContext && (
          <div className="mb-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Customer Context</span>
            </div>
            <div className="space-y-1 text-xs">
              {item.customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{item.customer.phone}</span>
                </div>
              )}
              {item.customer.email && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" />
                  <span>{item.customer.email}</span>
                </div>
              )}
              {item.project && (
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  <span>{item.project.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.project.status}
                  </Badge>
                  {item.project.coordinator && (
                    <span className="text-muted-foreground">
                      PC: {item.project.coordinator}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Preview */}
        {!compact && (
          <div className="mb-3">
            {item.type === 'voicemail' && item.metadata.transcript && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {item.metadata.transcript}
              </div>
            )}
            {item.type === 'message' && item.metadata.content && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {item.metadata.content}
              </div>
            )}
            {item.type === 'task' && item.metadata.content && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {item.metadata.content}
              </div>
            )}
          </div>
        )}

        {/* Assignment Status */}
        {item.assignedTo && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                item.assignedTo.status === 'available' && 'bg-green-500',
                item.assignedTo.status === 'busy' && 'bg-yellow-500',
                item.assignedTo.status === 'offline' && 'bg-gray-500'
              )} />
              <span className="text-xs text-muted-foreground">
                Assigned to {item.assignedTo.name}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {item.type === 'voicemail' && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              className="flex items-center gap-1"
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          )}
          
          {item.actions?.canCall && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('call');
              }}
              className="flex items-center gap-1"
            >
              <Phone className="h-3 w-3" />
              Call
            </Button>
          )}

          {item.actions?.canText && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('text');
              }}
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-3 w-3" />
              Text
            </Button>
          )}

          {item.actions?.canCallback && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('callback');
              }}
              className="flex items-center gap-1"
            >
              <Clock className="h-3 w-3" />
              Callback
            </Button>
          )}

          {item.actions?.canComplete && (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('complete');
              }}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Complete
            </Button>
          )}
        </div>

        {/* Status and Priority Indicators */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn("text-xs", statusStyle.textColor)}
            >
              {statusStyle.label}
            </Badge>
            {item.status === 'overdue' && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {formatTimeAgo(item.metadata.updatedAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QueueItemListProps {
  items: QueueItem[];
  onItemAction?: (action: string, item: QueueItem) => void;
  onItemSelect?: (item: QueueItem) => void;
  selectedItemId?: string;
  className?: string;
  compact?: boolean;
  showCustomerContext?: boolean;
}

export function QueueItemList({
  items,
  onItemAction,
  onItemSelect,
  selectedItemId,
  className,
  compact = false,
  showCustomerContext = true
}: QueueItemListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <QueueItemCard
          key={item.id}
          item={item}
          onAction={onItemAction}
          onSelect={onItemSelect}
          isSelected={selectedItemId === item.id}
          compact={compact}
          showCustomerContext={showCustomerContext}
        />
      ))}
      {items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No items in queue</p>
        </div>
      )}
    </div>
  );
}
