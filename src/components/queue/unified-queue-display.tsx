"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useQueue } from "@/lib/hooks/use-queue"
import { useSocket } from "@/components/socket-provider"
import { EnhancedQueueItemCard } from "@/components/ui/enhanced-queue-item-card"
import { EnhancedSearch } from "@/components/ui/enhanced-search"
import { LoadingState } from "@/components/ui/loading-state"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, RefreshCw, AlertCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { QueueItem } from "@/types/layout"

export interface UnifiedQueueDisplayProps {
  className?: string
  onItemSelect?: (item: QueueItem) => void
  selectedItemId?: string
  queueView?: 'my' | 'team'
  userId?: string
}

export function UnifiedQueueDisplay({
  className,
  onItemSelect,
  selectedItemId,
  queueView = 'my',
  userId,
}: UnifiedQueueDisplayProps) {
  const { data: session } = useSession()
  const user = session?.user
  const { items: queueData, loading, error, refresh, setFilters } = useQueue()
  const { socket } = useSocket()
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filterType, setFilterType] = React.useState<string>("all")
  const [filterPriority, setFilterPriority] = React.useState<string>("all")
  const [filterStatus, setFilterStatus] = React.useState<string>("all")
  const [sortBy, setSortBy] = React.useState<"sla" | "priority" | "created">("sla")

  // Enhanced search configuration
  const searchFilters = [
    {
      key: "type",
      label: "Type",
      type: "select" as const,
      options: [
        { value: "voicemail", label: "Voicemails" },
        { value: "task", label: "Tasks" },
        { value: "call", label: "Calls" },
        { value: "message", label: "Messages" },
      ],
    },
    {
      key: "priority",
      label: "Priority",
      type: "select" as const,
      options: [
        { value: "urgent", label: "Urgent" },
        { value: "high", label: "High" },
        { value: "normal", label: "Normal" },
        { value: "low", label: "Low" },
      ],
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "pending", label: "Pending" },
        { value: "in-progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "escalated", label: "Escalated" },
      ],
    },
  ]

  const searchPresets = [
    {
      id: "sla-violations",
      name: "SLA Violations",
      query: "",
      filters: { slaStatus: "violated" },
      isDefault: true,
    },
    {
      id: "urgent-items",
      name: "Urgent Items",
      query: "",
      filters: { priority: "urgent" },
    },
    {
      id: "my-assigned",
      name: "My Assigned Items",
      query: "",
      filters: { assignedTo: user?.id },
    },
  ]

  const handleSearch = (query: string, filters: Record<string, any>) => {
    setSearchQuery(query)
    setFilters({ search: query, ...filters })
  }

  // Real-time updates
  React.useEffect(() => {
    if (!socket) return

    const handleNewItem = (data: any) => {
      // Queue will be refreshed automatically via the hook
      console.log("New queue item received:", data)
    }

    const handleItemUpdate = (data: any) => {
      console.log("Queue item updated:", data)
    }

    const handleItemDelete = (data: any) => {
      console.log("Queue item deleted:", data)
    }

    const handleSlaUpdate = (data: any) => {
      console.log("SLA updated:", data)
    }

    socket.on("queue:new-item", handleNewItem)
    socket.on("queue:item-updated", handleItemUpdate)
    socket.on("queue:item-deleted", handleItemDelete)
    socket.on("queue:sla-updated", handleSlaUpdate)

    return () => {
      socket.off("queue:new-item", handleNewItem)
      socket.off("queue:item-updated", handleItemUpdate)
      socket.off("queue:item-deleted", handleItemDelete)
      socket.off("queue:sla-updated", handleSlaUpdate)
    }
  }, [socket])

  // Filter and sort queue items
  const filteredAndSortedItems = React.useMemo(() => {
    if (!queueData) return []

    let items = [...queueData]

    // Apply filters
    if (filterType !== "all") {
      items = items.filter(item => item.type === filterType)
    }

    if (filterPriority !== "all") {
      items = items.filter(item => item.priority === filterPriority)
    }

    if (filterStatus !== "all") {
      items = items.filter(item => item.status === filterStatus)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter(item =>
        item.customer.name.toLowerCase().includes(query) ||
        item.customer.phone?.includes(query) ||
        item.assignedTo?.name?.toLowerCase().includes(query) ||
        item.metadata?.content?.toLowerCase().includes(query)
      )
    }

    // Queue view filtering
    if (queueView === 'my') {
      // My Queue: Show only items assigned to the current user
      const currentUserId = userId || user?.id
      items = items.filter(item =>
        item.assignedTo?.id === currentUserId ||
        (item.customer.projectCoordinator?.id === currentUserId && !item.assignedTo)
      )
    }
    // Team Queue: Show all items (no additional filtering)

    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case "sla":
          if (!a.sla?.deadline && !b.sla?.deadline) return 0
          if (!a.sla?.deadline) return 1
          if (!b.sla?.deadline) return -1
          return new Date(a.sla.deadline).getTime() - new Date(b.sla.deadline).getTime()
        
        case "priority":
          const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        
        case "created":
          return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
        
        default:
          return 0
      }
    })

    return items
  }, [queueData, filterType, filterPriority, filterStatus, searchQuery, sortBy, user])

  const getQueueStats = () => {
    if (!queueData) return { total: 0, urgent: 0, overdue: 0, mine: 0, unassigned: 0 }

    const now = new Date()
    const currentUserId = userId || user?.id

    const urgent = queueData.filter(item => item.priority === "urgent").length
    const overdue = queueData.filter(item =>
      item.sla?.deadline && new Date(item.sla.deadline) < now
    ).length
    const mine = queueData.filter(item => item.assignedTo?.id === currentUserId).length
    const unassigned = queueData.filter(item => !item.assignedTo).length

    return {
      total: queueData.length,
      urgent,
      overdue,
      mine,
      unassigned,
    }
  }

  const stats = getQueueStats()

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <LoadingState variant="skeleton" size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Queue</h3>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => refresh()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Queue Stats */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-6">
          {queueView === 'my' ? (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold">{filteredAndSortedItems.length}</div>
                <div className="text-sm text-muted-foreground">My Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                <div className="text-sm text-muted-foreground">Urgent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.unassigned}</div>
                <div className="text-sm text-muted-foreground">Unassigned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
                <div className="text-sm text-muted-foreground">Urgent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </>
          )}
        </div>
        <Button onClick={() => refresh()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Enhanced Search */}
      <div className="p-4 bg-background border rounded-lg">
        <EnhancedSearch
          placeholder="Search queue items..."
          value={searchQuery}
          onSearch={handleSearch}
          filters={searchFilters}
          presets={searchPresets}
          context="voicemails"
          showFilters={true}
          showPresets={true}
          showSuggestions={true}
          showHistory={true}
          debounceMs={300}
        />
      </div>

      {/* Legacy Filters (keeping for backward compatibility) */}
      <div className="flex items-center space-x-4 p-4 bg-background border rounded-lg">

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="voicemail">Voicemails</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="call">Calls</SelectItem>
            <SelectItem value="message">Messages</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sla">SLA Deadline</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="created">Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Queue Items */}
      <div className="space-y-2">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-sm">
              {searchQuery || filterType !== "all" || filterPriority !== "all" || filterStatus !== "all"
                ? "Try adjusting your filters or search terms"
                : "No items in the queue at this time"}
            </p>
          </div>
        ) : (
          filteredAndSortedItems.map((item) => (
            <EnhancedQueueItemCard
              key={item.id}
              item={item}
              isSelected={selectedItemId === item.id}
              onClick={() => onItemSelect?.(item)}
            />
          ))
        )}
      </div>
    </div>
  )
}
