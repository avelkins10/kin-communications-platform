"use client";

import * as React from "react";
import { Check, CheckCheck, Clock, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'UNDELIVERED';
type MessageDirection = 'INBOUND' | 'OUTBOUND';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  direction: MessageDirection;
  sentAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  errorMessage?: string | null;
  className?: string;
  showText?: boolean;
}

/**
 * Message Status Indicator Component
 *
 * Displays message delivery status similar to iMessage:
 * - QUEUED: Clock icon (gray) - "Sending..."
 * - SENT: Single check (gray) - "Sent"
 * - DELIVERED: Double check (blue) - "Delivered"
 * - FAILED: X icon (red) - "Failed"
 * - UNDELIVERED: Alert icon (orange) - "Not Delivered"
 */
export function MessageStatusIndicator({
  status,
  direction,
  sentAt,
  deliveredAt,
  errorMessage,
  className,
  showText = false
}: MessageStatusIndicatorProps) {
  // Only show status for outbound messages
  if (direction !== 'OUTBOUND') {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'QUEUED':
        return <Clock className="w-3.5 h-3.5 text-gray-400 animate-pulse" />;
      case 'SENT':
        return <Check className="w-3.5 h-3.5 text-gray-400" />;
      case 'DELIVERED':
        return <CheckCheck className="w-3.5 h-3.5 text-blue-500" />;
      case 'FAILED':
        return <XCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'UNDELIVERED':
        return <AlertCircle className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'QUEUED':
        return 'Sending...';
      case 'SENT':
        return 'Sent';
      case 'DELIVERED':
        return 'Delivered';
      case 'FAILED':
        return 'Failed';
      case 'UNDELIVERED':
        return 'Not Delivered';
      default:
        return '';
    }
  };

  const getTooltipContent = () => {
    const formatDate = (date: Date | string | null | undefined) => {
      if (!date) return null;
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    switch (status) {
      case 'QUEUED':
        return 'Message is being sent...';
      case 'SENT':
        return sentAt ? `Sent ${formatDate(sentAt)}` : 'Message sent to carrier';
      case 'DELIVERED':
        return deliveredAt ? `Delivered ${formatDate(deliveredAt)}` : 'Message delivered to recipient';
      case 'FAILED':
        return errorMessage || 'Message failed to send';
      case 'UNDELIVERED':
        return errorMessage || 'Message could not be delivered';
      default:
        return '';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5",
            className
          )}>
            {getStatusIcon()}
            {showText && (
              <span className={cn(
                "text-xs font-medium",
                status === 'QUEUED' && "text-gray-500",
                status === 'SENT' && "text-gray-500",
                status === 'DELIVERED' && "text-blue-600",
                status === 'FAILED' && "text-red-600",
                status === 'UNDELIVERED' && "text-orange-600"
              )}>
                {getStatusText()}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Minimal inline version for message bubbles
 */
export function MessageStatusBadge({
  status,
  direction,
  className
}: Pick<MessageStatusIndicatorProps, 'status' | 'direction' | 'className'>) {
  if (direction !== 'OUTBOUND') return null;

  return (
    <div className={cn("inline-flex", className)}>
      {status === 'QUEUED' && <Clock className="w-3 h-3 text-gray-400 animate-pulse" />}
      {status === 'SENT' && <Check className="w-3 h-3 text-gray-400" />}
      {status === 'DELIVERED' && <CheckCheck className="w-3 h-3 text-blue-500" />}
      {status === 'FAILED' && <XCircle className="w-3 h-3 text-red-500" />}
      {status === 'UNDELIVERED' && <AlertCircle className="w-3 h-3 text-orange-500" />}
    </div>
  );
}
