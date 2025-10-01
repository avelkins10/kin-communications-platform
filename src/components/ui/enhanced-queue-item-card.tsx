"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ProfessionalCard } from "@/components/ui/professional-card"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { ActionButton } from "@/components/ui/action-button"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageSquare, Clock, User, AlertCircle, CheckCircle, Play, Pause } from "lucide-react"
import { EnhancedSlaIndicator } from "@/components/ui/enhanced-sla-indicator"
import { QuickActionsToolbar } from "@/components/ui/quick-actions-toolbar"
import { QueueItem } from "@/types/layout"

export interface EnhancedQueueItemCardProps {
  item: QueueItem
  isSelected?: boolean
  onClick?: () => void
  onCall?: (phone: string) => void
  onText?: (phone: string) => void
  onCallback?: () => void
  onAssign?: (itemId: string) => void
  onComplete?: (itemId: string) => void
  onEscalate?: (itemId: string) => void
  onPlayRecording?: (itemId: string) => void
  className?: string
}

export function EnhancedQueueItemCard({
  item,
  isSelected = false,
  onClick,
  onCall,
  onText,
  onCallback,
  onAssign,
  onComplete,
  onEscalate,
  onPlayRecording,
  className,
}: EnhancedQueueItemCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-50 border-red-200"
      case "high": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "medium": return "text-green-600 bg-green-50 border-green-200"
      case "low": return "text-blue-600 bg-blue-50 border-blue-200"
      default: return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "voicemail": return <AlertCircle className="h-4 w-4" />
      case "task": return <CheckCircle className="h-4 w-4" />
      case "call": return <Phone className="h-4 w-4" />
      case "message": return <MessageSquare className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "text-orange-600 bg-orange-50"
      case "assigned": return "text-blue-600 bg-blue-50"
      case "in-progress": return "text-blue-600 bg-blue-50"
      case "completed": return "text-green-600 bg-green-50"
      case "overdue": return "text-red-600 bg-red-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return ""
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (hours > 24) {
      return new Date(date).toLocaleDateString()
    } else if (hours > 0) {
      return `${hours}h ago`
    } else {
      return `${minutes}m ago`
    }
  }

  return (
    <ProfessionalCard
      variant="interactive"
      className={cn(
        "transition-all duration-200",
        isSelected && "ring-2 ring-primary border-primary",
        isHovered && "shadow-lg",
        getPriorityColor(item.priority),
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="space-y-3">
        {/* Top Row: Critical Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTypeIcon(item.type)}
            <Badge variant="outline" className="capitalize">
              {item.type}
            </Badge>
            <StatusIndicator
              variant="badge"
              status={item.priority === "medium" ? "normal" : item.priority}
              label={item.priority.toUpperCase()}
              pulse={item.priority === "urgent"}
            />
          </div>
          
          <div className="flex items-center space-x-1">
            {item.customer.phone && (
              <>
                <ActionButton
                  size="sm"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCall?.(item.customer.phone!)
                  }}
                  tooltip="Call customer"
                  keyboardShortcut="C"
                >
                  <Phone className="h-3 w-3" />
                </ActionButton>
                <ActionButton
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onText?.(item.customer.phone!)
                  }}
                  tooltip="Send text"
                  keyboardShortcut="T"
                >
                  <MessageSquare className="h-3 w-3" />
                </ActionButton>
              </>
            )}
            <ActionButton
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onCallback?.()
              }}
              tooltip="Schedule callback"
              keyboardShortcut="B"
            >
              <Clock className="h-3 w-3" />
            </ActionButton>
          </div>
        </div>

        {/* Middle Row: Context Information */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{item.customer.name}</h3>
            <Badge variant="outline" className={cn("text-xs", getStatusColor(item.status))}>
              {item.status.replace("-", " ")}
            </Badge>
          </div>
          
          {item.assignedTo?.name && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-3 w-3 mr-1" />
              PC: {item.assignedTo.name}
            </div>
          )}
          
          {item.project?.status && (
            <div className="flex items-center">
              <Badge variant={item.project.status === "PRE-PTO" ? "default" : "secondary"} className="text-xs">
                {item.project.status}
              </Badge>
            </div>
          )}
          
          {item.metadata.content && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.metadata.content}
            </p>
          )}
        </div>

        {/* Bottom Row: Timing/SLA Information */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimestamp(item.metadata.createdAt)}
            </div>
            
            {item.metadata.duration && (
              <div className="flex items-center">
                <Play className="h-3 w-3 mr-1" />
                {formatDuration(item.metadata.duration)}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {item.sla?.deadline && (
              <EnhancedSlaIndicator
                deadline={new Date(item.sla.deadline)}
                size="sm"
              />
            )}
            
            {item.assignedTo && (
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                Assigned
              </div>
            )}
          </div>
        </div>

        {/* Additional Actions for Specific Types */}
        {item.type === "voicemail" && item.metadata?.attachments && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2">
              <ActionButton
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onPlayRecording?.(item.id)
                }}
                tooltip="Play recording"
              >
                <Play className="h-3 w-3" />
                Play
              </ActionButton>
            </div>
            
            <div className="flex items-center space-x-1">
              <ActionButton
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onAssign?.(item.id)
                }}
                tooltip="Assign to team member"
              >
                Assign
              </ActionButton>
              <ActionButton
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onComplete?.(item.id)
                }}
                tooltip="Mark as complete"
              >
                Complete
              </ActionButton>
              <ActionButton
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onEscalate?.(item.id)
                }}
                tooltip="Escalate to manager"
              >
                Escalate
              </ActionButton>
            </div>
          </div>
        )}
      </div>
    </ProfessionalCard>
  )
}
