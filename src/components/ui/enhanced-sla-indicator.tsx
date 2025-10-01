"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Clock, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"

const enhancedSlaIndicatorVariants = cva(
  "inline-flex items-center transition-all duration-200",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
      variant: {
        default: "px-2 py-1 rounded-full",
        progress: "flex-col space-y-1",
        detailed: "flex-col space-y-2 p-2 rounded-lg border",
      },
    },
    defaultVariants: {
      size: "sm",
      variant: "default",
    },
  }
)

export interface EnhancedSlaIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedSlaIndicatorVariants> {
  deadline: Date
  startTime?: Date
  showProgress?: boolean
  showCountdown?: boolean
  escalateOnOverdue?: boolean
  onEscalate?: () => void
}

export function EnhancedSlaIndicator({
  className,
  size,
  variant,
  deadline,
  startTime,
  showProgress = false,
  showCountdown = true,
  escalateOnOverdue = false,
  onEscalate,
  ...props
}: EnhancedSlaIndicatorProps) {
  const [timeRemaining, setTimeRemaining] = React.useState<{
    hours: number
    minutes: number
    seconds: number
    total: number
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 })

  const [slaStatus, setSlaStatus] = React.useState<{
    status: "normal" | "warning" | "urgent" | "overdue"
    color: string
    icon: React.ReactNode
    label: string
  }>({
    status: "normal",
    color: "text-green-600 bg-green-50 border-green-200",
    icon: <CheckCircle className="h-3 w-3" />,
    label: "On Track"
  })

  // Calculate time remaining and SLA status
  React.useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date()
      const deadlineTime = new Date(deadline).getTime()
      const nowTime = now.getTime()
      const diff = deadlineTime - nowTime

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, total: 0 })
        setSlaStatus({
          status: "overdue",
          color: "text-red-600 bg-red-50 border-red-200",
          icon: <AlertCircle className="h-3 w-3" />,
          label: "Overdue"
        })
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({ hours, minutes, seconds, total: diff })

      // Determine SLA status based on time remaining
      if (hours < 0) {
        setSlaStatus({
          status: "overdue",
          color: "text-red-600 bg-red-50 border-red-200",
          icon: <AlertCircle className="h-3 w-3" />,
          label: "Overdue"
        })
      } else if (hours < 1) {
        setSlaStatus({
          status: "urgent",
          color: "text-red-600 bg-red-50 border-red-200",
          icon: <AlertTriangle className="h-3 w-3" />,
          label: "Due Soon"
        })
      } else if (hours < 4) {
        setSlaStatus({
          status: "warning",
          color: "text-yellow-600 bg-yellow-50 border-yellow-200",
          icon: <AlertTriangle className="h-3 w-3" />,
          label: "Due Today"
        })
      } else {
        setSlaStatus({
          status: "normal",
          color: "text-green-600 bg-green-50 border-green-200",
          icon: <CheckCircle className="h-3 w-3" />,
          label: "On Track"
        })
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [deadline])

  // Calculate progress percentage
  const progressPercentage = React.useMemo(() => {
    if (!startTime || slaStatus.status === "overdue") return 100
    
    const totalDuration = new Date(deadline).getTime() - new Date(startTime).getTime()
    const elapsed = totalDuration - timeRemaining.total
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
  }, [startTime, deadline, timeRemaining.total, slaStatus.status])

  const formatTimeRemaining = () => {
    if (slaStatus.status === "overdue") {
      const overdueHours = Math.abs(timeRemaining.hours)
      const overdueMinutes = Math.abs(timeRemaining.minutes)
      return `${overdueHours}h ${overdueMinutes}m overdue`
    }
    
    if (timeRemaining.hours > 24) {
      const days = Math.floor(timeRemaining.hours / 24)
      const remainingHours = timeRemaining.hours % 24
      return `${days}d ${remainingHours}h`
    }
    
    if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`
    }
    
    return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`
  }

  const getTooltipContent = () => {
    const deadlineStr = new Date(deadline).toLocaleString()
    const startStr = startTime ? new Date(startTime).toLocaleString() : "Not specified"
    
    return (
      <div className="space-y-1">
        <p className="font-medium">{slaStatus.label}</p>
        <p className="text-xs">Deadline: {deadlineStr}</p>
        {startTime && <p className="text-xs">Started: {startStr}</p>}
        <p className="text-xs">Time remaining: {formatTimeRemaining()}</p>
        {showProgress && startTime && (
          <p className="text-xs">Progress: {Math.round(progressPercentage)}%</p>
        )}
      </div>
    )
  }

  const renderContent = () => {
    switch (variant) {
      case "progress":
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={cn("flex items-center space-x-1", slaStatus.color)}>
                {slaStatus.icon}
                <span>{slaStatus.label}</span>
              </span>
              {showCountdown && (
                <span className="text-muted-foreground">
                  {formatTimeRemaining()}
                </span>
              )}
            </div>
            {showProgress && startTime && (
              <Progress 
                value={progressPercentage} 
                className="h-1"
              />
            )}
          </div>
        )
      
      case "detailed":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {slaStatus.icon}
                <span className="font-medium">{slaStatus.label}</span>
              </div>
              {escalateOnOverdue && slaStatus.status === "overdue" && onEscalate && (
                <button
                  onClick={onEscalate}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Escalate
                </button>
              )}
            </div>
            
            {showCountdown && (
              <div className="text-sm text-muted-foreground">
                {formatTimeRemaining()}
              </div>
            )}
            
            {showProgress && startTime && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            )}
            
            <div className="text-xs text-muted-foreground">
              Due: {new Date(deadline).toLocaleString()}
            </div>
          </div>
        )
      
      default:
        return (
          <div className="flex items-center space-x-1">
            {slaStatus.icon}
            <span>{slaStatus.label}</span>
            {showCountdown && (
              <span className="text-muted-foreground">
                ({formatTimeRemaining()})
              </span>
            )}
          </div>
        )
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              enhancedSlaIndicatorVariants({ size, variant }),
              slaStatus.color,
              slaStatus.status === "urgent" && "animate-pulse",
              className
            )}
            {...props}
          >
            {renderContent()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}


