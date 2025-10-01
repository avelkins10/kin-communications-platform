"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertCircle, Clock, CheckCircle, Info, AlertTriangle } from "lucide-react"

const statusIndicatorVariants = cva(
  "inline-flex items-center transition-all duration-200",
  {
    variants: {
      variant: {
        dot: "w-2 h-2 rounded-full",
        badge: "px-2 py-1 rounded-full text-xs font-medium",
        pill: "px-3 py-1 rounded-full text-sm font-medium",
        card: "p-2 rounded-lg border",
      },
      status: {
        urgent: "bg-red-500 text-white",
        high: "bg-yellow-500 text-white",
        normal: "bg-green-500 text-white",
        low: "bg-blue-500 text-white",
        info: "bg-blue-500 text-white",
        warning: "bg-orange-500 text-white",
        success: "bg-green-600 text-white",
        error: "bg-red-600 text-white",
        pending: "bg-gray-500 text-white",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "badge",
      status: "normal",
      size: "sm",
    },
  }
)

const statusIcons = {
  urgent: AlertCircle,
  high: AlertTriangle,
  normal: CheckCircle,
  low: Info,
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertCircle,
  pending: Clock,
}

const statusColors = {
  urgent: "bg-red-500 border-red-200 text-red-900",
  high: "bg-yellow-500 border-yellow-200 text-yellow-900",
  normal: "bg-green-500 border-green-200 text-green-900",
  low: "bg-blue-500 border-blue-200 text-blue-900",
  info: "bg-blue-500 border-blue-200 text-blue-900",
  warning: "bg-orange-500 border-orange-200 text-orange-900",
  success: "bg-green-600 border-green-200 text-green-900",
  error: "bg-red-600 border-red-200 text-red-900",
  pending: "bg-gray-500 border-gray-200 text-gray-900",
}

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string
  description?: string
  showIcon?: boolean
  animated?: boolean
  pulse?: boolean
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({
    className,
    variant,
    status,
    size,
    label,
    description,
    showIcon = true,
    animated = false,
    pulse = false,
    children,
    ...props
  }, ref) => {
    const Icon = status ? statusIcons[status] : null
    const colorClass = status ? statusColors[status] : ""

    const indicatorContent = (
      <div
        ref={ref}
        className={cn(
          statusIndicatorVariants({ variant, status, size }),
          animated && "animate-pulse",
          pulse && status === "urgent" && "animate-pulse",
          className
        )}
        {...props}
      >
        {showIcon && Icon && (
          <Icon className={cn(
            "mr-1",
            size === "sm" && "h-3 w-3",
            size === "md" && "h-4 w-4",
            size === "lg" && "h-5 w-5"
          )} />
        )}
        {label && <span>{label}</span>}
        {children}
      </div>
    )

    if (description) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {indicatorContent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return indicatorContent
  }
)
StatusIndicator.displayName = "StatusIndicator"

// Specialized status indicators for common use cases
export const UrgentStatus = React.forwardRef<HTMLDivElement, Omit<StatusIndicatorProps, 'status'>>(
  (props, ref) => <StatusIndicator ref={ref} status="urgent" pulse {...props} />
)
UrgentStatus.displayName = "UrgentStatus"

export const HighPriorityStatus = React.forwardRef<HTMLDivElement, Omit<StatusIndicatorProps, 'status'>>(
  (props, ref) => <StatusIndicator ref={ref} status="high" {...props} />
)
HighPriorityStatus.displayName = "HighPriorityStatus"

export const NormalStatus = React.forwardRef<HTMLDivElement, Omit<StatusIndicatorProps, 'status'>>(
  (props, ref) => <StatusIndicator ref={ref} status="normal" {...props} />
)
NormalStatus.displayName = "NormalStatus"

export const InfoStatus = React.forwardRef<HTMLDivElement, Omit<StatusIndicatorProps, 'status'>>(
  (props, ref) => <StatusIndicator ref={ref} status="info" {...props} />
)
InfoStatus.displayName = "InfoStatus"

export { StatusIndicator, statusIndicatorVariants }
