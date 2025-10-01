"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Loader2, Clock, AlertCircle } from "lucide-react"

const loadingStateVariants = cva(
  "flex items-center justify-center transition-all duration-200",
  {
    variants: {
      variant: {
        skeleton: "flex-col space-y-2",
        spinner: "flex-col space-y-2",
        progress: "flex-col space-y-2",
        shimmer: "relative overflow-hidden",
      },
      size: {
        sm: "p-2",
        md: "p-4",
        lg: "p-6",
        full: "min-h-[200px] p-8",
      },
      context: {
        table: "w-full",
        card: "w-full",
        form: "w-full",
        page: "w-full h-full",
      },
    },
    defaultVariants: {
      variant: "spinner",
      size: "md",
      context: "card",
    },
  }
)

export interface LoadingStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingStateVariants> {
  message?: string
  progress?: number
  estimatedTime?: string
  cancellable?: boolean
  onCancel?: () => void
  error?: string
  onRetry?: () => void
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({
    className,
    variant,
    size,
    context,
    message = "Loading...",
    progress,
    estimatedTime,
    cancellable = false,
    onCancel,
    error,
    onRetry,
    ...props
  }, ref) => {
    const [showShimmer, setShowShimmer] = React.useState(false)

    React.useEffect(() => {
      if (variant === "shimmer") {
        setShowShimmer(true)
        const timer = setTimeout(() => setShowShimmer(false), 2000)
        return () => clearTimeout(timer)
      }
    }, [variant])

    if (error) {
      return (
        <div
          ref={ref}
          className={cn(
            loadingStateVariants({ variant, size, context }),
            "text-red-600",
            className
          )}
          {...props}
        >
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm font-medium">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )
    }

    const renderContent = () => {
      switch (variant) {
        case "skeleton":
          return (
            <>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </>
          )
        
        case "spinner":
          return (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{message}</p>
              {estimatedTime && (
                <p className="text-xs text-muted-foreground">
                  Estimated time: {estimatedTime}
                </p>
              )}
            </>
          )
        
        case "progress":
          return (
            <>
              <div className="w-full max-w-xs">
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress}% complete
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{message}</p>
              {estimatedTime && (
                <p className="text-xs text-muted-foreground">
                  Estimated time: {estimatedTime}
                </p>
              )}
            </>
          )
        
        case "shimmer":
          return (
            <div className="w-full space-y-2">
              <div className={cn(
                "h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded",
                showShimmer && "animate-pulse"
              )} />
              <div className={cn(
                "h-3 w-3/4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded",
                showShimmer && "animate-pulse"
              )} />
              <div className={cn(
                "h-3 w-1/2 bg-gradient-to-r from-muted via-muted/50 to-muted rounded",
                showShimmer && "animate-pulse"
              )} />
            </div>
          )
        
        default:
          return null
      }
    }

    return (
      <div
        ref={ref}
        className={cn(loadingStateVariants({ variant, size, context }), className)}
        {...props}
      >
        {renderContent()}
        {cancellable && onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    )
  }
)
LoadingState.displayName = "LoadingState"

// Specialized loading states for common contexts
export const TableLoadingState = React.forwardRef<HTMLDivElement, Omit<LoadingStateProps, 'context'>>(
  (props, ref) => <LoadingState ref={ref} context="table" {...props} />
)
TableLoadingState.displayName = "TableLoadingState"

export const CardLoadingState = React.forwardRef<HTMLDivElement, Omit<LoadingStateProps, 'context'>>(
  (props, ref) => <LoadingState ref={ref} context="card" {...props} />
)
CardLoadingState.displayName = "CardLoadingState"

export const FormLoadingState = React.forwardRef<HTMLDivElement, Omit<LoadingStateProps, 'context'>>(
  (props, ref) => <LoadingState ref={ref} context="form" {...props} />
)
FormLoadingState.displayName = "FormLoadingState"

export const PageLoadingState = React.forwardRef<HTMLDivElement, Omit<LoadingStateProps, 'context'>>(
  (props, ref) => <LoadingState ref={ref} context="page" {...props} />
)
PageLoadingState.displayName = "PageLoadingState"

export { LoadingState, loadingStateVariants }


