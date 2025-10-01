"use client";
import * as React from "react";
import { useSocket } from "@/components/socket-provider";
import { useSession } from "next-auth/react";
import { useLayout } from "@/lib/hooks/use-layout";
import { 
  QueueItem, 
  QueueItemType, 
  QueueItemPriority, 
  QueueItemStatus,
  UserRole,
  LayoutMode
} from "@/types/layout";

interface QueueFilters {
  type?: QueueItemType[];
  priority?: QueueItemPriority[];
  status?: QueueItemStatus[];
  assignedTo?: string[];
  slaStatus?: ('on-time' | 'approaching' | 'violated')[];
  search?: string;
}

interface QueueSort {
  field: 'createdAt' | 'updatedAt' | 'priority' | 'sla' | 'customer';
  direction: 'asc' | 'desc';
}

interface QueueStats {
  total: number;
  byType: Record<QueueItemType, number>;
  byPriority: Record<QueueItemPriority, number>;
  byStatus: Record<QueueItemStatus, number>;
  slaViolations: number;
  approachingDeadlines: number;
  averageWaitTime: number;
}

interface QueueHookReturn {
  // Data
  items: QueueItem[];
  selectedItem: QueueItem | null;
  stats: QueueStats;
  loading: boolean;
  error: string | null;
  
  // Filters and sorting
  filters: QueueFilters;
  sort: QueueSort;
  setFilters: (filters: Partial<QueueFilters>) => void;
  setSort: (sort: QueueSort) => void;
  clearFilters: () => void;
  
  // Actions
  selectItem: (item: QueueItem | null) => void;
  assignItem: (itemId: string, userId: string) => Promise<void>;
  completeItem: (itemId: string) => Promise<void>;
  callbackItem: (itemId: string, scheduledTime?: Date) => Promise<void>;
  escalateItem: (itemId: string, reason: string) => Promise<void>;
  bulkAction: (itemIds: string[], action: string, data?: any) => Promise<void>;
  
  // Layout integration
  switchToMode: (mode: LayoutMode) => void;
  getLayoutModeForItem: (item: QueueItem) => LayoutMode;
  
  // Real-time updates
  refresh: () => Promise<void>;
  isConnected: boolean;
}

const defaultFilters: QueueFilters = {
  type: undefined,
  priority: undefined,
  status: undefined,
  assignedTo: undefined,
  slaStatus: undefined,
  search: undefined
};

const defaultSort: QueueSort = {
  field: 'createdAt',
  direction: 'desc'
};

export function useQueue(): QueueHookReturn {
  const { isConnected, subscribe, emitCustomEvent } = useSocket();
  const { data: session } = useSession();
  const { setMode } = useLayout();
  const [items, setItems] = React.useState<QueueItem[]>([]);
  const [selectedItem, setSelectedItem] = React.useState<QueueItem | null>(null);
  const [stats, setStats] = React.useState<QueueStats>({
    total: 0,
    byType: { call: 0, voicemail: 0, message: 0, task: 0 },
    byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
    byStatus: { new: 0, assigned: 0, 'in-progress': 0, completed: 0, overdue: 0 },
    slaViolations: 0,
    approachingDeadlines: 0,
    averageWaitTime: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filters, setFiltersState] = React.useState<QueueFilters>(defaultFilters);
  const [sort, setSortState] = React.useState<QueueSort>(defaultSort);

  const userRole = (session?.user as any)?.role || 'employee';
  const userId = (session?.user as any)?.id;

  // Fetch queue data
  const fetchQueueData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Add role-based filtering
      if (userRole === 'employee') {
        params.append('assignedTo', userId);
      }
      
      // Add filters
      if (filters.type?.length) {
        params.append('type', filters.type.join(','));
      }
      if (filters.priority?.length) {
        params.append('priority', filters.priority.join(','));
      }
      if (filters.status?.length) {
        params.append('status', filters.status.join(','));
      }
      if (filters.assignedTo?.length) {
        params.append('assignedTo', filters.assignedTo.join(','));
      }
      if (filters.slaStatus?.length) {
        params.append('slaStatus', filters.slaStatus.join(','));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      // Add sorting
      params.append('sortBy', sort.field);
      params.append('sortDirection', sort.direction);

      const response = await fetch(`/api/queue?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch queue data');
      }

      const data = await response.json();
      
      // Map date fields from API strings to Date objects
      const mappedItems = (data.items || []).map((item: any) => ({
        ...item,
        metadata: {
          ...item.metadata,
          createdAt: new Date(item.metadata.createdAt),
          updatedAt: new Date(item.metadata.updatedAt)
        },
        sla: item.sla ? {
          ...item.sla,
          deadline: new Date(item.sla.deadline)
        } : undefined
      }));
      
      setItems(mappedItems);
      setStats(data.stats || stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Failed to fetch queue data:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sort, userRole, userId, stats]);

  // Initial load
  React.useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Real-time socket events
  React.useEffect(() => {
    if (!isConnected) return;

    const handleNewItem = (item: any) => {
      // Map date fields from socket data
      const mappedItem: QueueItem = {
        ...item,
        metadata: {
          ...item.metadata,
          createdAt: new Date(item.metadata.createdAt),
          updatedAt: new Date(item.metadata.updatedAt)
        },
        sla: item.sla ? {
          ...item.sla,
          deadline: new Date(item.sla.deadline)
        } : undefined
      };

      setItems(prev => {
        // Check if item should be visible based on current filters
        if (shouldShowItem(mappedItem, filters, userRole, userId)) {
          return [mappedItem, ...prev];
        }
        return prev;
      });
      updateStats();
    };

    const handleItemUpdate = (updatedItem: any) => {
      // Map date fields from socket data
      const mappedItem: QueueItem = {
        ...updatedItem,
        metadata: {
          ...updatedItem.metadata,
          createdAt: new Date(updatedItem.metadata.createdAt),
          updatedAt: new Date(updatedItem.metadata.updatedAt)
        },
        sla: updatedItem.sla ? {
          ...updatedItem.sla,
          deadline: new Date(updatedItem.sla.deadline)
        } : undefined
      };

      setItems(prev => prev.map(item =>
        item.id === mappedItem.id ? mappedItem : item
      ));
      updateStats();
    };

    const handleItemDelete = (itemId: string) => {
      setItems(prev => prev.filter(item => item.id !== itemId));
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
      updateStats();
    };

    const handleItemAssignment = (data: { itemId: string; userId: string; userName: string }) => {
      setItems(prev => prev.map(item =>
        item.id === data.itemId
          ? { ...item, assignedTo: { id: data.userId, name: data.userName, email: '', role: 'employee', status: 'available' } }
          : item
      ));
    };

    const handleSlaUpdate = (data: { itemId: string; slaStatus: string }) => {
      setItems(prev => prev.map(item =>
        item.id === data.itemId
          ? { ...item, status: data.slaStatus === 'violated' ? 'overdue' : item.status }
          : item
      ));
      updateStats();
    };

    const unsubscribers = [
      subscribe('queue:new-item', handleNewItem),
      subscribe('queue:item-updated', handleItemUpdate),
      subscribe('queue:item-deleted', handleItemDelete),
      subscribe('queue:item-assigned', handleItemAssignment),
      subscribe('queue:sla-updated', handleSlaUpdate)
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe, isConnected, filters, userRole, userId, selectedItem]);

  // Update stats when items change
  const updateStats = React.useCallback((itemsToProcess?: QueueItem[]) => {
    const itemsToUse = itemsToProcess || items;
    
    setStats(prev => {
      const newStats: QueueStats = {
        total: itemsToUse.length,
        byType: { call: 0, voicemail: 0, message: 0, task: 0 },
        byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
        byStatus: { new: 0, assigned: 0, 'in-progress': 0, completed: 0, overdue: 0 },
        slaViolations: 0,
        approachingDeadlines: 0,
        averageWaitTime: 0
      };

      itemsToUse.forEach(item => {
        newStats.byType[item.type]++;
        newStats.byPriority[item.priority]++;
        newStats.byStatus[item.status]++;
        
        if (item.status === 'overdue') {
          newStats.slaViolations++;
        }
        
        if (item.sla) {
          const now = new Date();
          const deadline = item.sla.deadline;
          const diffMinutes = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60));
          
          if (diffMinutes < 0) {
            newStats.slaViolations++;
          } else if (diffMinutes <= 15) {
            newStats.approachingDeadlines++;
          }
        }
      });

      // Calculate average wait time
      const waitTimes = itemsToUse
        .filter(item => item.status !== 'completed')
        .map(item => {
          const now = new Date();
          const createdAt = item.metadata.createdAt;
          return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
        });
      
      newStats.averageWaitTime = waitTimes.length > 0 
        ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length 
        : 0;

      return newStats;
    });
  }, [items]);

  // Update stats when items change
  React.useEffect(() => {
    updateStats(items);
  }, [items, updateStats]);

  // Filter and sort items
  const filteredAndSortedItems = React.useMemo(() => {
    let filtered = items.filter(item => shouldShowItem(item, filters, userRole, userId));
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort.field) {
        case 'createdAt':
          aValue = a.metadata.createdAt.getTime();
          bValue = b.metadata.createdAt.getTime();
          break;
        case 'updatedAt':
          aValue = a.metadata.updatedAt.getTime();
          bValue = b.metadata.updatedAt.getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'sla':
          aValue = a.sla?.deadline.getTime() || 0;
          bValue = b.sla?.deadline.getTime() || 0;
          break;
        case 'customer':
          aValue = a.customer.name.toLowerCase();
          bValue = b.customer.name.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [items, filters, sort, userRole, userId]);

  // Action handlers
  const assignItem = React.useCallback(async (itemId: string, assignUserId: string) => {
    try {
      const response = await fetch(`/api/queue/${itemId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: assignUserId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to assign item');
      }
      
      // Socket event will update the UI
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign item');
    }
  }, []);

  const completeItem = React.useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/queue/${itemId}/complete`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete item');
      }
      
      // Socket event will update the UI
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete item');
    }
  }, []);

  const callbackItem = React.useCallback(async (itemId: string, scheduledTime?: Date) => {
    try {
      const response = await fetch(`/api/queue/${itemId}/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledTime })
      });
      
      if (!response.ok) {
        throw new Error('Failed to schedule callback');
      }
      
      // Socket event will update the UI
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule callback');
    }
  }, []);

  const escalateItem = React.useCallback(async (itemId: string, reason: string) => {
    try {
      const response = await fetch(`/api/queue/${itemId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) {
        throw new Error('Failed to escalate item');
      }
      
      // Socket event will update the UI
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to escalate item');
    }
  }, []);

  const bulkAction = React.useCallback(async (itemIds: string[], action: string, data?: any) => {
    try {
      const response = await fetch('/api/queue/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds, action, data })
      });
      
      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }
      
      // Refresh data
      await fetchQueueData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    }
  }, [fetchQueueData]);

  // Layout integration
  const switchToMode = React.useCallback((mode: LayoutMode) => {
    // Update the layout state
    setMode(mode);
    // Optionally keep socket emit for telemetry
    if (isConnected) {
      emitCustomEvent({ type: 'layout:switch-mode', mode });
    }
  }, [setMode, isConnected, emitCustomEvent]);

  const getLayoutModeForItem = React.useCallback((item: QueueItem): LayoutMode => {
    switch (item.type) {
      case 'voicemail':
        return 'VOICEMAIL_PLAYBACK';
      case 'call':
        return 'ACTIVE_CALL';
      default:
        return 'QUEUE_MANAGEMENT';
    }
  }, []);

  // Filter and sort setters
  const setFilters = React.useCallback((newFilters: Partial<QueueFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setSort = React.useCallback((newSort: QueueSort) => {
    setSortState(newSort);
  }, []);

  const clearFilters = React.useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  return {
    // Data
    items: filteredAndSortedItems,
    selectedItem,
    stats,
    loading,
    error,
    
    // Filters and sorting
    filters,
    sort,
    setFilters,
    setSort,
    clearFilters,
    
    // Actions
    selectItem: setSelectedItem,
    assignItem,
    completeItem,
    callbackItem,
    escalateItem,
    bulkAction,
    
    // Layout integration
    switchToMode,
    getLayoutModeForItem,
    
    // Real-time updates
    refresh: fetchQueueData,
    isConnected
  };
}

// Utility function to check if item should be shown based on filters
function shouldShowItem(
  item: QueueItem, 
  filters: QueueFilters, 
  userRole: UserRole, 
  userId: string
): boolean {
  // Role-based filtering
  if (userRole === 'employee' && item.assignedTo?.id !== userId) {
    return false;
  }
  
  // Type filter
  if (filters.type?.length && !filters.type.includes(item.type)) {
    return false;
  }
  
  // Priority filter
  if (filters.priority?.length && !filters.priority.includes(item.priority)) {
    return false;
  }
  
  // Status filter
  if (filters.status?.length && !filters.status.includes(item.status)) {
    return false;
  }
  
  // Assigned to filter
  if (filters.assignedTo?.length && !filters.assignedTo.includes(item.assignedTo?.id || '')) {
    return false;
  }
  
  // SLA status filter
  if (filters.slaStatus?.length && item.sla) {
    const now = new Date();
    const deadline = item.sla.deadline;
    const diffMinutes = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60));
    
    let itemSlaStatus: 'on-time' | 'approaching' | 'violated';
    if (diffMinutes < 0) {
      itemSlaStatus = 'violated';
    } else if (diffMinutes <= 15) {
      itemSlaStatus = 'approaching';
    } else {
      itemSlaStatus = 'on-time';
    }
    
    if (!filters.slaStatus.includes(itemSlaStatus)) {
      return false;
    }
  }
  
  // Search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    const matchesCustomer = item.customer.name.toLowerCase().includes(searchLower) ||
                          item.customer.phone?.includes(searchLower) ||
                          item.customer.email?.toLowerCase().includes(searchLower);
    const matchesContent = item.metadata.content?.toLowerCase().includes(searchLower) ||
                          item.metadata.transcript?.toLowerCase().includes(searchLower);
    
    if (!matchesCustomer && !matchesContent) {
      return false;
    }
  }
  
  return true;
}
