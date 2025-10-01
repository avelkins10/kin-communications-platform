"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ActionButton } from "@/components/ui/action-button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Phone, MessageSquare, Clock, User, CheckCircle, AlertTriangle, MoreHorizontal } from "lucide-react"
import { useSession } from "next-auth/react"

const quickActionsToolbarVariants = cva(
  "flex items-center space-x-2 p-2 bg-background border rounded-lg shadow-sm",
  {
    variants: {
      layout: {
        horizontal: "flex-row",
        vertical: "flex-col space-y-2 space-x-0",
        floating: "fixed bottom-4 right-4 z-50 shadow-lg",
      },
      size: {
        sm: "p-1",
        md: "p-2",
        lg: "p-3",
      },
    },
    defaultVariants: {
      layout: "horizontal",
      size: "md",
    },
  }
)

export interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  variant?: "primary" | "secondary" | "destructive" | "ghost"
  keyboardShortcut?: string
  disabled?: boolean
  loading?: boolean
  success?: boolean
  error?: boolean
  tooltip?: string
}

export interface QuickActionsToolbarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof quickActionsToolbarVariants> {
  actions?: QuickAction[]
  showLabels?: boolean
  showKeyboardShortcuts?: boolean
  onCall?: (phone?: string) => void
  onText?: (phone?: string) => void
  onCallback?: () => void
  onAssign?: () => void
  onComplete?: () => void
  onEscalate?: () => void
  selectedItem?: {
    id: string
    type: string
    customerPhone?: string
  }
}

export function QuickActionsToolbar({
  className,
  layout,
  size,
  actions,
  showLabels = true,
  showKeyboardShortcuts = true,
  onCall,
  onText,
  onCallback,
  onAssign,
  onComplete,
  onEscalate,
  selectedItem,
  ...props
}: QuickActionsToolbarProps) {
  const { data: session } = useSession()
  const user = session?.user
  const [recentActions, setRecentActions] = React.useState<QuickAction[]>([])

  // Default actions if none provided
  const defaultActions: QuickAction[] = React.useMemo(() => [
    {
      id: "call",
      label: "Call",
      icon: <Phone className="h-4 w-4" />,
      action: () => onCall?.(selectedItem?.customerPhone),
      variant: "primary",
      keyboardShortcut: "C",
      tooltip: "Call customer",
      disabled: !selectedItem?.customerPhone,
    },
    {
      id: "text",
      label: "Text",
      icon: <MessageSquare className="h-4 w-4" />,
      action: () => onText?.(selectedItem?.customerPhone),
      variant: "secondary",
      keyboardShortcut: "T",
      tooltip: "Send text message",
      disabled: !selectedItem?.customerPhone,
    },
    {
      id: "callback",
      label: "Callback",
      icon: <Clock className="h-4 w-4" />,
      action: () => onCallback?.(),
      variant: "secondary",
      keyboardShortcut: "B",
      tooltip: "Schedule callback",
    },
    {
      id: "assign",
      label: "Assign",
      icon: <User className="h-4 w-4" />,
      action: () => onAssign?.(),
      variant: "ghost",
      keyboardShortcut: "A",
      tooltip: "Assign to team member",
      disabled: user?.role !== "manager",
    },
    {
      id: "complete",
      label: "Complete",
      icon: <CheckCircle className="h-4 w-4" />,
      action: () => onComplete?.(),
      variant: "ghost",
      keyboardShortcut: "Enter",
      tooltip: "Mark as complete",
    },
    {
      id: "escalate",
      label: "Escalate",
      icon: <AlertTriangle className="h-4 w-4" />,
      action: () => onEscalate?.(),
      variant: "destructive",
      keyboardShortcut: "E",
      tooltip: "Escalate to manager",
    },
  ], [onCall, onText, onCallback, onAssign, onComplete, onEscalate, selectedItem, user])

  const toolbarActions = actions || defaultActions

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const action = toolbarActions.find(a => 
        a.keyboardShortcut && 
        a.keyboardShortcut.toLowerCase() === event.key.toLowerCase()
      )

      if (action && !action.disabled) {
        event.preventDefault()
        action.action()
        
        // Add to recent actions
        setRecentActions(prev => [action, ...prev.slice(0, 4)])
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [toolbarActions])

  const renderAction = (action: QuickAction) => {
    const button = (
      <ActionButton
        key={action.id}
        variant={action.variant || "ghost"}
        size="sm"
        onClick={action.action}
        disabled={action.disabled}
        loading={action.loading}
        success={action.success}
        error={action.error}
        keyboardShortcut={showKeyboardShortcuts ? action.keyboardShortcut : undefined}
        icon={action.icon}
        iconPosition="left"
      >
        {showLabels && action.label}
      </ActionButton>
    )

    if (action.tooltip) {
      return (
        <TooltipProvider key={action.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>{action.tooltip}</p>
              {showKeyboardShortcuts && action.keyboardShortcut && (
                <p className="text-xs text-muted-foreground mt-1">
                  Press {action.keyboardShortcut}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return button
  }

  return (
    <div
      className={cn(quickActionsToolbarVariants({ layout, size }), className)}
      {...props}
    >
      {toolbarActions.map(renderAction)}
      
      {recentActions.length > 0 && (
        <>
          <Separator orientation={layout === "vertical" ? "horizontal" : "vertical"} />
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground">Recent:</span>
            {recentActions.slice(0, 2).map((action) => (
              <TooltipProvider key={`recent-${action.id}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={action.action}
                      className="p-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {action.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Repeat: {action.tooltip || action.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
