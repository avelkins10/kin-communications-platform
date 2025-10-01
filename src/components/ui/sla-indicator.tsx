"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type SlaStatus = 'on-time' | 'approaching' | 'violated' | 'informational';
export type SlaType = 'voicemail-callback' | 'text-response' | 'missed-call-followup' | 'custom';

interface SlaIndicatorProps {
  status: SlaStatus;
  timeRemaining?: number; // minutes
  timeOverdue?: number; // minutes
  slaType?: SlaType;
  showCountdown?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onViolation?: () => void;
}

const statusConfig = {
  'on-time': {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    badgeVariant: 'default' as const,
    label: 'On Time',
    icon: '✓'
  },
  'approaching': {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    badgeVariant: 'secondary' as const,
    label: 'Approaching',
    icon: '⚠'
  },
  'violated': {
    color: 'bg-red-500',
    textColor: 'text-red-700',
    badgeVariant: 'destructive' as const,
    label: 'Overdue',
    icon: '🚨'
  },
  'informational': {
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    badgeVariant: 'outline' as const,
    label: 'Info',
    icon: 'ℹ'
  }
};

const sizeConfig = {
  sm: {
    badge: 'text-xs px-2 py-1',
    icon: 'text-xs',
    countdown: 'text-xs'
  },
  md: {
    badge: 'text-sm px-3 py-1',
    icon: 'text-sm',
    countdown: 'text-sm'
  },
  lg: {
    badge: 'text-base px-4 py-2',
    icon: 'text-base',
    countdown: 'text-base'
  }
};

export function SlaIndicator({
  status,
  timeRemaining,
  timeOverdue,
  slaType = 'custom',
  showCountdown = true,
  showTooltip = true,
  size = 'md',
  className,
  onViolation
}: SlaIndicatorProps) {
  const [currentTime, setCurrentTime] = React.useState(0);
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  // Update time every minute for countdown
  React.useEffect(() => {
    setCurrentTime(Date.now()); // Initialize on client side
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Trigger violation callback when status changes to violated
  React.useEffect(() => {
    if (status === 'violated' && onViolation) {
      onViolation();
    }
  }, [status, onViolation]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getCountdownText = () => {
    if (status === 'violated' && timeOverdue) {
      return `OVERDUE by ${formatTime(timeOverdue)}`;
    }
    if (status === 'approaching' && timeRemaining) {
      return `${formatTime(timeRemaining)} remaining`;
    }
    if (status === 'on-time' && timeRemaining) {
      return `${formatTime(timeRemaining)} remaining`;
    }
    return null;
  };

  const getSlaTypeDescription = () => {
    switch (slaType) {
      case 'voicemail-callback':
        return 'Voicemail callback SLA: Same day before 3 PM, next business day after';
      case 'text-response':
        return 'Text response SLA: 30 minutes during business hours, next day 9 AM after hours';
      case 'missed-call-followup':
        return 'Missed call follow-up SLA: 1 hour response time';
      default:
        return 'Custom SLA requirements';
    }
  };

  const getEscalationInfo = () => {
    if (status === 'violated') {
      return 'This item has exceeded its SLA deadline and requires immediate attention.';
    }
    if (status === 'approaching') {
      return 'This item is approaching its SLA deadline. Consider prioritizing this item.';
    }
    return null;
  };

  const indicator = (
    <div className={cn("flex items-center gap-1", className)}>
      <Badge 
        variant={config.badgeVariant}
        className={cn(
          sizeStyles.badge,
          "flex items-center gap-1 font-medium"
        )}
      >
        <span className={sizeStyles.icon}>{config.icon}</span>
        <span>{config.label}</span>
        {showCountdown && getCountdownText() && (
          <span className={cn(sizeStyles.countdown, "ml-1")}>
            {getCountdownText()}
          </span>
        )}
      </Badge>
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
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-medium">{config.label}</p>
              <p className="text-sm text-muted-foreground">
                {getSlaTypeDescription()}
              </p>
            </div>
            {getCountdownText() && (
              <div className="text-sm">
                <p className="font-medium">Time Status:</p>
                <p>{getCountdownText()}</p>
              </div>
            )}
            {getEscalationInfo() && (
              <div className="text-sm">
                <p className="font-medium text-orange-600">Action Required:</p>
                <p>{getEscalationInfo()}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface SlaProgressBarProps {
  timeRemaining: number;
  totalTime: number;
  status: SlaStatus;
  className?: string;
}

export function SlaProgressBar({
  timeRemaining,
  totalTime,
  status,
  className
}: SlaProgressBarProps) {
  const progress = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));
  const config = statusConfig[status];

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>SLA Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            config.color
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface SlaAlertProps {
  violations: Array<{
    id: string;
    type: string;
    customer: string;
    overdueBy: number;
    urgency: 'high' | 'medium' | 'low';
  }>;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function SlaAlert({ violations, onDismiss, className }: SlaAlertProps) {
  if (violations.length === 0) return null;

  const highPriorityViolations = violations.filter(v => v.urgency === 'high');
  const mediumPriorityViolations = violations.filter(v => v.urgency === 'medium');
  const lowPriorityViolations = violations.filter(v => v.urgency === 'low');

  return (
    <div className={cn("space-y-2", className)}>
      {highPriorityViolations.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600">🚨</span>
            <span className="font-medium text-red-800">
              {highPriorityViolations.length} High Priority SLA Violation{highPriorityViolations.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {highPriorityViolations.slice(0, 3).map((violation) => (
              <div key={violation.id} className="flex items-center justify-between text-sm">
                <span>{violation.customer} - {violation.type}</span>
                <span className="text-red-600 font-medium">
                  {violation.overdueBy}m overdue
                </span>
              </div>
            ))}
            {highPriorityViolations.length > 3 && (
              <p className="text-xs text-red-600">
                +{highPriorityViolations.length - 3} more violations
              </p>
            )}
          </div>
        </div>
      )}

      {mediumPriorityViolations.length > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600">⚠</span>
            <span className="font-medium text-yellow-800">
              {mediumPriorityViolations.length} Medium Priority SLA Violation{mediumPriorityViolations.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {mediumPriorityViolations.slice(0, 3).map((violation) => (
              <div key={violation.id} className="flex items-center justify-between text-sm">
                <span>{violation.customer} - {violation.type}</span>
                <span className="text-yellow-600 font-medium">
                  {violation.overdueBy}m overdue
                </span>
              </div>
            ))}
            {mediumPriorityViolations.length > 3 && (
              <p className="text-xs text-yellow-600">
                +{mediumPriorityViolations.length - 3} more violations
              </p>
            )}
          </div>
        </div>
      )}

      {lowPriorityViolations.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600">ℹ</span>
            <span className="font-medium text-blue-800">
              {lowPriorityViolations.length} Low Priority SLA Violation{lowPriorityViolations.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1">
            {lowPriorityViolations.slice(0, 3).map((violation) => (
              <div key={violation.id} className="flex items-center justify-between text-sm">
                <span>{violation.customer} - {violation.type}</span>
                <span className="text-blue-600 font-medium">
                  {violation.overdueBy}m overdue
                </span>
              </div>
            ))}
            {lowPriorityViolations.length > 3 && (
              <p className="text-xs text-blue-600">
                +{lowPriorityViolations.length - 3} more violations
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to calculate SLA status
export function calculateSlaStatus(
  deadline: Date,
  currentTime: Date = new Date(),
  warningThreshold: number = 15 // minutes
): { status: SlaStatus; timeRemaining?: number; timeOverdue?: number } {
  const now = currentTime.getTime();
  const deadlineTime = deadline.getTime();
  const diffMinutes = Math.floor((deadlineTime - now) / (1000 * 60));

  if (diffMinutes < 0) {
    return {
      status: 'violated',
      timeOverdue: Math.abs(diffMinutes)
    };
  }

  if (diffMinutes <= warningThreshold) {
    return {
      status: 'approaching',
      timeRemaining: diffMinutes
    };
  }

  return {
    status: 'on-time',
    timeRemaining: diffMinutes
  };
}
