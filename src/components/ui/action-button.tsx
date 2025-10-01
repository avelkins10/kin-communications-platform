"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Check, X, AlertCircle } from "lucide-react"

const actionButtonVariants = cva(
  "relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "focus:ring-primary",
        secondary: "focus:ring-secondary",
        destructive: "focus:ring-destructive",
        ghost: "focus:ring-muted",
      },
      state: {
        default: "",
        loading: "cursor-wait",
        success: "cursor-default",
        error: "cursor-default",
        disabled: "cursor-not-allowed opacity-50",
      },
    },
    defaultVariants: {
      variant: "primary",
      state: "default",
    },
  }
)

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  loading?: boolean
  success?: boolean
  error?: boolean
  tooltip?: string
  keyboardShortcut?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  showStateIcon?: boolean
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({
    className,
    variant,
    state,
    loading,
    success,
    error,
    disabled,
    tooltip,
    keyboardShortcut,
    icon,
    iconPosition = "left",
    showStateIcon = true,
    children,
    ...props
  }, ref) => {
    const [isAnimating, setIsAnimating] = React.useState(false)
    
    const currentState = React.useMemo(() => {
      if (disabled) return "disabled"
      if (loading) return "loading"
      if (success) return "success"
      if (error) return "error"
      return "default"
    }, [disabled, loading, success, error])

    const getStateIcon = () => {
      if (!showStateIcon) return null
      
      if (loading) return <Loader2 className="h-4 w-4 animate-spin" />
      if (success) return <Check className="h-4 w-4 text-green-600" />
      if (error) return <X className="h-4 w-4 text-red-600" />
      return null
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        e.preventDefault()
        return
      }

      if (success || error) {
        setIsAnimating(true)
        setTimeout(() => setIsAnimating(false), 2000)
      }

      props.onClick?.(e)
    }

    const buttonContent = (
      <Button
        ref={ref}
        className={cn(
          actionButtonVariants({ variant, state: currentState }),
          "action-button",
          isAnimating && "animate-pulse",
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {icon && iconPosition === "left" && !loading && (
          <span className="mr-2">{icon}</span>
        )}
        {getStateIcon() && (
          <span className={cn(
            "mr-2",
            success && "animate-bounce",
            error && "animate-shake"
          )}>
            {getStateIcon()}
          </span>
        )}
        {children}
        {icon && iconPosition === "right" && !loading && (
          <span className="ml-2">{icon}</span>
        )}
        {keyboardShortcut && !loading && (
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded border">
            {keyboardShortcut}
          </kbd>
        )}
      </Button>
    )

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {buttonContent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
              {keyboardShortcut && (
                <p className="text-xs text-muted-foreground mt-1">
                  Press {keyboardShortcut}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return buttonContent
  }
)
ActionButton.displayName = "ActionButton"

export { ActionButton, actionButtonVariants }
