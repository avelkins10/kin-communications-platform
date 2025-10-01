"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useSocket } from "@/components/socket-provider"
import { ProfessionalCard, ProfessionalCardContent, ProfessionalCardHeader, ProfessionalCardTitle } from "@/components/ui/professional-card"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageSquare, AlertCircle, CheckCircle, Clock, TrendingUp, TrendingDown } from "lucide-react"

export interface CounterData {
  voicemails: number
  calls: number
  messages: number
  tasks: number
  overdue: number
  urgent: number
  completed: number
  inProgress: number
}

export interface CounterBreakdown {
  label: string
  value: number
  change?: number
  color?: string
}

export interface EnhancedRealtimeCountersProps {
  className?: string
  showBreakdown?: boolean
  showTrends?: boolean
  size?: "sm" | "md" | "lg"
}

export function EnhancedRealtimeCounters({
  className,
  showBreakdown = true,
  showTrends = true,
  size = "md",
}: EnhancedRealtimeCountersProps) {
  const { socket } = useSocket()
  const [counters, setCounters] = React.useState<CounterData>({
    voicemails: 0,
    calls: 0,
    messages: 0,
    tasks: 0,
    overdue: 0,
    urgent: 0,
    completed: 0,
    inProgress: 0,
  })
  const [previousCounters, setPreviousCounters] = React.useState<CounterData>({
    voicemails: 0,
    calls: 0,
    messages: 0,
    tasks: 0,
    overdue: 0,
    urgent: 0,
    completed: 0,
    inProgress: 0,
  })
  const [isAnimating, setIsAnimating] = React.useState(false)

  // Socket event handlers for real-time updates
  React.useEffect(() => {
    if (!socket) return

    const handleCounterUpdate = (data: Partial<CounterData>) => {
      setPreviousCounters(counters)
      setCounters(prev => ({ ...prev, ...data }))
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }

    const handleNewVoicemail = () => {
      setPreviousCounters(counters)
      setCounters(prev => ({ ...prev, voicemails: prev.voicemails + 1 }))
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }

    const handleNewCall = () => {
      setPreviousCounters(counters)
      setCounters(prev => ({ ...prev, calls: prev.calls + 1 }))
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }

    const handleNewMessage = () => {
      setPreviousCounters(counters)
      setCounters(prev => ({ ...prev, messages: prev.messages + 1 }))
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }

    const handleNewTask = () => {
      setPreviousCounters(counters)
      setCounters(prev => ({ ...prev, tasks: prev.tasks + 1 }))
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }

    const handleSlaAlert = () => {
      setPreviousCounters(counters)
      setCounters(prev => ({ ...prev, overdue: prev.overdue + 1 }))
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }

    socket.on("queue:update", handleCounterUpdate)
    socket.on("queue:new-item", handleNewVoicemail)
    socket.on("queue:new-item", handleNewCall)
    socket.on("message:new", handleNewMessage)
    socket.on("queue:new-item", handleNewTask)
    socket.on("queue:sla-updated", handleSlaAlert)

    return () => {
      socket.off("queue:update", handleCounterUpdate)
      socket.off("queue:new-item", handleNewVoicemail)
      socket.off("queue:new-item", handleNewCall)
      socket.off("message:new", handleNewMessage)
      socket.off("queue:new-item", handleNewTask)
      socket.off("queue:sla-updated", handleSlaAlert)
    }
  }, [socket, counters])

  const getCounterIcon = (type: string) => {
    switch (type) {
      case "voicemails": return <AlertCircle className="h-4 w-4" />
      case "calls": return <Phone className="h-4 w-4" />
      case "messages": return <MessageSquare className="h-4 w-4" />
      case "tasks": return <CheckCircle className="h-4 w-4" />
      case "overdue": return <Clock className="h-4 w-4" />
      case "urgent": return <AlertCircle className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "inProgress": return <Clock className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getCounterColor = (type: string) => {
    switch (type) {
      case "voicemails": return "text-orange-600 bg-orange-50 border-orange-200"
      case "calls": return "text-blue-600 bg-blue-50 border-blue-200"
      case "messages": return "text-green-600 bg-green-50 border-green-200"
      case "tasks": return "text-purple-600 bg-purple-50 border-purple-200"
      case "overdue": return "text-red-600 bg-red-50 border-red-200"
      case "urgent": return "text-red-600 bg-red-50 border-red-200"
      case "completed": return "text-green-600 bg-green-50 border-green-200"
      case "inProgress": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default: return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getCounterLabel = (type: string) => {
    switch (type) {
      case "voicemails": return "Voicemails"
      case "calls": return "Calls"
      case "messages": return "Messages"
      case "tasks": return "Tasks"
      case "overdue": return "Overdue"
      case "urgent": return "Urgent"
      case "completed": return "Completed"
      case "inProgress": return "In Progress"
      default: return type
    }
  }

  const getChangeIndicator = (current: number, previous: number) => {
    if (!showTrends) return null
    
    const change = current - previous
    if (change === 0) return null
    
    const isPositive = change > 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const color = isPositive ? "text-green-600" : "text-red-600"
    
    return (
      <div className={cn("flex items-center space-x-1", color)}>
        <Icon className="h-3 w-3" />
        <span className="text-xs">{Math.abs(change)}</span>
      </div>
    )
  }

  const getCounterBreakdown = (type: string): CounterBreakdown[] => {
    switch (type) {
      case "voicemails":
        return [
          { label: "New", value: counters.voicemails, color: "text-orange-600" },
          { label: "Urgent", value: counters.urgent, color: "text-red-600" },
          { label: "Overdue", value: counters.overdue, color: "text-red-600" },
        ]
      case "calls":
        return [
          { label: "Incoming", value: counters.calls, color: "text-blue-600" },
          { label: "In Progress", value: counters.inProgress, color: "text-yellow-600" },
          { label: "Completed", value: counters.completed, color: "text-green-600" },
        ]
      case "messages":
        return [
          { label: "Unread", value: counters.messages, color: "text-green-600" },
          { label: "Pending", value: counters.tasks, color: "text-purple-600" },
        ]
      default:
        return []
    }
  }

  const renderCounter = (type: keyof CounterData) => {
    const value = counters[type]
    const previousValue = previousCounters[type]
    const breakdown = getCounterBreakdown(type)
    
    const content = (
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          {getCounterIcon(type)}
          <span className={cn(
            "font-bold transition-all duration-300",
            size === "sm" && "text-lg",
            size === "md" && "text-xl",
            size === "lg" && "text-2xl",
            isAnimating && "scale-110"
          )}>
            {value}
          </span>
          {getChangeIndicator(value, previousValue)}
        </div>
        <div className="text-xs text-muted-foreground">
          {getCounterLabel(type)}
        </div>
        {showBreakdown && breakdown.length > 0 && (
          <div className="space-y-1">
            {breakdown.map((item, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={cn("font-medium", item.color)}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )

    if (showBreakdown) {
      return (
        <TooltipProvider key={type}>
          <Tooltip>
            <TooltipTrigger asChild>
              <ProfessionalCard
                variant="elevated"
                className={cn(
                  "transition-all duration-300 hover:shadow-lg",
                  getCounterColor(type),
                  isAnimating && "animate-pulse"
                )}
              >
                <ProfessionalCardContent className="p-4">
                  {content}
                </ProfessionalCardContent>
              </ProfessionalCard>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">{getCounterLabel(type)}</p>
                <p className="text-xs">Current: {value}</p>
                {previousValue !== value && (
                  <p className="text-xs">
                    Previous: {previousValue} ({value > previousValue ? "+" : ""}{value - previousValue})
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <div
        key={type}
        className={cn(
          "p-3 rounded-lg border transition-all duration-300",
          getCounterColor(type),
          isAnimating && "animate-pulse"
        )}
      >
        {content}
      </div>
    )
  }

  const mainCounters = ["voicemails", "calls", "messages", "tasks"] as const
  const statusCounters = ["overdue", "urgent", "completed", "inProgress"] as const

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {mainCounters.map(renderCounter)}
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCounters.map(renderCounter)}
      </div>
    </div>
  )
}
