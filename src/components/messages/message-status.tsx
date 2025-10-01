"use client";

import { Badge } from "@/components/ui/badge";
import { MessageStatus } from "@/types/index";
import { 
  Check, 
  CheckCheck, 
  Clock, 
  X, 
  AlertCircle,
  MessageSquare
} from "lucide-react";

interface MessageStatusProps {
  status: MessageStatus;
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

export function MessageStatusComponent({ 
  status, 
  showIcon = true, 
  showText = true,
  className = ""
}: MessageStatusProps) {
  const getStatusConfig = (status: MessageStatus) => {
    switch (status) {
      case "QUEUED":
        return {
          icon: <Clock className="h-3 w-3" />,
          variant: "secondary" as const,
          text: "Queued",
          color: "text-gray-500",
        };
      case "SENT":
        return {
          icon: <Check className="h-3 w-3" />,
          variant: "secondary" as const,
          text: "Sent",
          color: "text-gray-500",
        };
      case "DELIVERED":
        return {
          icon: <CheckCheck className="h-3 w-3" />,
          variant: "success" as const,
          text: "Delivered",
          color: "text-green-600",
        };
      case "READ":
        return {
          icon: <CheckCheck className="h-3 w-3" />,
          variant: "info" as const,
          text: "Read",
          color: "text-blue-600",
        };
      case "FAILED":
        return {
          icon: <X className="h-3 w-3" />,
          variant: "destructive" as const,
          text: "Failed",
          color: "text-red-600",
        };
      case "UNDELIVERED":
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          variant: "destructive" as const,
          text: "Undelivered",
          color: "text-red-600",
        };
      case "RECEIVED":
        return {
          icon: <MessageSquare className="h-3 w-3" />,
          variant: "info" as const,
          text: "Received",
          color: "text-blue-600",
        };
      default:
        return {
          icon: <Clock className="h-3 w-3" />,
          variant: "secondary" as const,
          text: "Unknown",
          color: "text-gray-500",
        };
    }
  };

  const config = getStatusConfig(status);

  if (!showIcon && !showText) {
    return null;
  }

  if (showIcon && !showText) {
    return (
      <span className={`inline-flex items-center ${config.color} ${className}`}>
        {config.icon}
      </span>
    );
  }

  if (!showIcon && showText) {
    return (
      <Badge variant={config.variant} className={className}>
        {config.text}
      </Badge>
    );
  }

  return (
    <Badge variant={config.variant} className={`inline-flex items-center gap-1 ${className}`}>
      {config.icon}
      {config.text}
    </Badge>
  );
}

// Status indicator for message bubbles
interface MessageBubbleStatusProps {
  status: MessageStatus;
  direction: "INBOUND" | "OUTBOUND";
  className?: string;
}

export function MessageBubbleStatus({ 
  status, 
  direction, 
  className = "" 
}: MessageBubbleStatusProps) {
  // Only show status for outbound messages
  if (direction === "INBOUND") {
    return null;
  }

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case "QUEUED":
        return <Clock className="h-3 w-3 text-gray-400" />;
      case "SENT":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "DELIVERED":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "READ":
        return <CheckCheck className="h-3 w-3 text-blue-400" />;
      case "FAILED":
      case "UNDELIVERED":
        return <X className="h-3 w-3 text-red-400" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <span className={`inline-flex items-center ${className}`}>
      {getStatusIcon(status)}
    </span>
  );
}

// Status summary for conversation lists
interface ConversationStatusProps {
  lastMessageStatus?: MessageStatus;
  unreadCount: number;
  className?: string;
}

export function ConversationStatus({ 
  lastMessageStatus, 
  unreadCount, 
  className = "" 
}: ConversationStatusProps) {
  if (unreadCount > 0) {
    return (
      <Badge variant="destructive" className={`text-xs ${className}`}>
        {unreadCount}
      </Badge>
    );
  }

  if (lastMessageStatus) {
    return (
      <MessageStatusComponent 
        status={lastMessageStatus} 
        showIcon={true} 
        showText={false}
        className={className}
      />
    );
  }

  return null;
}

// Status tooltip content
export function getStatusTooltip(status: MessageStatus): string {
  switch (status) {
    case "QUEUED":
      return "Message is queued for delivery";
    case "SENT":
      return "Message has been sent to the carrier";
    case "DELIVERED":
      return "Message has been delivered to the recipient's device";
    case "READ":
      return "Message has been read by the recipient";
    case "FAILED":
      return "Message delivery failed";
    case "UNDELIVERED":
      return "Message could not be delivered";
    case "RECEIVED":
      return "Message has been received";
    default:
      return "Unknown status";
  }
}
