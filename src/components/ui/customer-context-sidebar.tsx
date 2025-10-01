"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ProfessionalCard, ProfessionalCardContent, ProfessionalCardHeader, ProfessionalCardTitle } from "@/components/ui/professional-card"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { ActionButton } from "@/components/ui/action-button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Phone, Mail, MessageSquare, Clock, User, Building, Calendar, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { useSession } from "next-auth/react"

export interface CustomerData {
  id: string
  name: string
  phone?: string
  email?: string
  company?: string
  projectCoordinator?: {
    name: string
    phone?: string
    email?: string
  }
  projectStatus?: "PRE-PTO" | "POST-PTO"
  slaDeadline?: Date
  lastInteraction?: Date
  interactionHistory?: Array<{
    id: string
    type: "call" | "text" | "email" | "voicemail"
    timestamp: Date
    summary: string
    status: "completed" | "pending" | "failed"
  }>
  quickbaseUrl?: string
}

export interface CustomerContextSidebarProps {
  customer?: CustomerData
  className?: string
  onCall?: (phone: string) => void
  onText?: (phone: string) => void
  onEmail?: (email: string) => void
  onAddNote?: () => void
}

export function CustomerContextSidebar({
  customer,
  className,
  onCall,
  onText,
  onEmail,
  onAddNote,
}: CustomerContextSidebarProps) {
  const { data: session } = useSession()
  const user = session?.user
  const [isQuickBaseOpen, setIsQuickBaseOpen] = React.useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(true)

  if (!customer) {
    return (
      <div className={cn("w-80 p-4", className)}>
        <ProfessionalCard>
          <ProfessionalCardContent className="text-center py-8">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Customer Selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a queue item to view customer context
            </p>
          </ProfessionalCardContent>
        </ProfessionalCard>
      </div>
    )
  }

  const getSlaStatus = () => {
    if (!customer.slaDeadline) return { status: "info" as const, label: "No SLA" }
    
    const now = new Date()
    const deadline = new Date(customer.slaDeadline)
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursRemaining < 0) return { status: "urgent" as const, label: "Overdue" }
    if (hoursRemaining < 2) return { status: "high" as const, label: "Due Soon" }
    if (hoursRemaining < 24) return { status: "warning" as const, label: "Due Today" }
    return { status: "normal" as const, label: "On Track" }
  }

  const slaStatus = getSlaStatus()

  return (
    <div className={cn("w-80 space-y-4", className)}>
      {/* Customer Header */}
      <ProfessionalCard variant="elevated">
        <ProfessionalCardHeader>
          <div className="flex items-start justify-between">
            <div>
              <ProfessionalCardTitle className="text-lg">{customer.name}</ProfessionalCardTitle>
              {customer.company && (
                <p className="text-sm text-muted-foreground flex items-center mt-1">
                  <Building className="h-3 w-3 mr-1" />
                  {customer.company}
                </p>
              )}
            </div>
            <StatusIndicator
              variant="badge"
              status={slaStatus.status}
              label={slaStatus.label}
              pulse={slaStatus.status === "urgent"}
            />
          </div>
        </ProfessionalCardHeader>
        <ProfessionalCardContent className="space-y-3">
          {/* Contact Information */}
          <div className="space-y-2">
            {customer.phone && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {customer.phone}
                </div>
                <ActionButton
                  size="sm"
                  variant="ghost"
                  onClick={() => onCall?.(customer.phone!)}
                  tooltip="Call customer"
                  keyboardShortcut="C"
                >
                  Call
                </ActionButton>
              </div>
            )}
            
            {customer.email && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  {customer.email}
                </div>
                <ActionButton
                  size="sm"
                  variant="ghost"
                  onClick={() => onEmail?.(customer.email!)}
                  tooltip="Email customer"
                  keyboardShortcut="E"
                >
                  Email
                </ActionButton>
              </div>
            )}
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            {customer.phone && (
              <ActionButton
                size="sm"
                variant="primary"
                onClick={() => onText?.(customer.phone!)}
                tooltip="Send text message"
                keyboardShortcut="T"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Text
              </ActionButton>
            )}
            <ActionButton
              size="sm"
              variant="secondary"
              onClick={onAddNote}
              tooltip="Add note"
              keyboardShortcut="N"
            >
              Add Note
            </ActionButton>
          </div>
        </ProfessionalCardContent>
      </ProfessionalCard>

      {/* Project Coordinator */}
      {customer.projectCoordinator && (
        <ProfessionalCard>
          <ProfessionalCardHeader>
            <ProfessionalCardTitle className="text-base">Project Coordinator</ProfessionalCardTitle>
          </ProfessionalCardHeader>
          <ProfessionalCardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{customer.projectCoordinator.name}</p>
                {customer.projectCoordinator.phone && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Phone className="h-3 w-3 mr-1" />
                    {customer.projectCoordinator.phone}
                  </p>
                )}
                {customer.projectCoordinator.email && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {customer.projectCoordinator.email}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              {customer.projectCoordinator.phone && (
                <ActionButton
                  size="sm"
                  variant="outline"
                  onClick={() => onCall?.(customer.projectCoordinator!.phone!)}
                  tooltip="Call PC"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call PC
                </ActionButton>
              )}
              {customer.projectCoordinator.email && (
                <ActionButton
                  size="sm"
                  variant="outline"
                  onClick={() => onEmail?.(customer.projectCoordinator!.email!)}
                  tooltip="Email PC"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email PC
                </ActionButton>
              )}
            </div>
          </ProfessionalCardContent>
        </ProfessionalCard>
      )}

      {/* Project Status */}
      {customer.projectStatus && (
        <ProfessionalCard>
          <ProfessionalCardHeader>
            <ProfessionalCardTitle className="text-base">Project Status</ProfessionalCardTitle>
          </ProfessionalCardHeader>
          <ProfessionalCardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Status</span>
              </div>
              <Badge variant={customer.projectStatus === "PRE-PTO" ? "default" : "secondary"}>
                {customer.projectStatus}
              </Badge>
            </div>
            
            {customer.slaDeadline && (
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">SLA Deadline</span>
                </div>
                <div className="text-sm">
                  {new Date(customer.slaDeadline).toLocaleDateString()}
                </div>
              </div>
            )}
          </ProfessionalCardContent>
        </ProfessionalCard>
      )}

      {/* Interaction History */}
      {customer.interactionHistory && customer.interactionHistory.length > 0 && (
        <ProfessionalCard>
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CollapsibleTrigger asChild>
              <ProfessionalCardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <ProfessionalCardTitle className="text-base">Recent Activity</ProfessionalCardTitle>
                  {isHistoryOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </ProfessionalCardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ProfessionalCardContent className="space-y-3">
                {customer.interactionHistory.slice(0, 5).map((interaction) => (
                  <div key={interaction.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {interaction.type === "call" && <Phone className="h-3 w-3 text-blue-500" />}
                      {interaction.type === "text" && <MessageSquare className="h-3 w-3 text-green-500" />}
                      {interaction.type === "email" && <Mail className="h-3 w-3 text-purple-500" />}
                      {interaction.type === "voicemail" && <AlertCircle className="h-3 w-3 text-orange-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{interaction.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(interaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <StatusIndicator
                      variant="dot"
                      status={interaction.status === "completed" ? "success" : interaction.status === "pending" ? "warning" : "error"}
                    />
                  </div>
                ))}
              </ProfessionalCardContent>
            </CollapsibleContent>
          </Collapsible>
        </ProfessionalCard>
      )}

      {/* QuickBase Integration */}
      {customer.quickbaseUrl && (
        <ProfessionalCard>
          <Collapsible open={isQuickBaseOpen} onOpenChange={setIsQuickBaseOpen}>
            <CollapsibleTrigger asChild>
              <ProfessionalCardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <ProfessionalCardTitle className="text-base">Customer Records</ProfessionalCardTitle>
                  {isQuickBaseOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </ProfessionalCardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ProfessionalCardContent>
                <iframe
                  src={customer.quickbaseUrl}
                  className="w-full h-96 border rounded"
                  title="Customer Records"
                />
              </ProfessionalCardContent>
            </CollapsibleContent>
          </Collapsible>
        </ProfessionalCard>
      )}
    </div>
  )
}
