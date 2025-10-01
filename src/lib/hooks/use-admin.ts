"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

// Generic admin hook for CRUD operations
export function useAdminData<T>(
  endpoint: string,
  options: {
    initialData?: T[]
    refreshInterval?: number
    onError?: (error: Error) => void
  } = {}
) {
  const [data, setData] = useState<T[]>(options.initialData || [])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      options.onError?.(error)
      toast.error(`Failed to fetch data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [endpoint, options])

  const createItem = useCallback(async (item: Partial<T>) => {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create item")
      }

      const newItem = await response.json()
      setData(prev => [...prev, newItem])
      toast.success("Item created successfully")
      return newItem
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to create item: ${error.message}`)
      throw error
    }
  }, [endpoint])

  const updateItem = useCallback(async (id: string, updates: Partial<T>) => {
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update item")
      }

      const updatedItem = await response.json()
      setData(prev => prev.map(item => 
        (item as any).id === id ? updatedItem : item
      ))
      toast.success("Item updated successfully")
      return updatedItem
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to update item: ${error.message}`)
      throw error
    }
  }, [endpoint])

  const deleteItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete item")
      }

      setData(prev => prev.filter(item => (item as any).id !== id))
      toast.success("Item deleted successfully")
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to delete item: ${error.message}`)
      throw error
    }
  }, [endpoint])

  useEffect(() => {
    fetchData()
    
    if (options.refreshInterval) {
      const interval = setInterval(fetchData, options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, options.refreshInterval])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createItem,
    updateItem,
    deleteItem,
  }
}

// User management hook
export function useUsers() {
  const [data, setData] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/admin/users")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result.users || [])
      setPagination(result.pagination || null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast.error(`Failed to fetch users: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const createItem = useCallback(async (item: any) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create user")
      }

      const newItem = await response.json()
      setData(prev => [...prev, newItem])
      toast.success("User created successfully")
      return newItem
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to create user: ${error.message}`)
      throw error
    }
  }, [])

  const updateItem = useCallback(async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      const updatedItem = await response.json()
      setData(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ))
      toast.success("User updated successfully")
      return updatedItem
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to update user: ${error.message}`)
      throw error
    }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      setData(prev => prev.filter(item => item.id !== id))
      toast.success("User deleted successfully")
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to delete user: ${error.message}`)
      throw error
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchData])

  return {
    data,
    pagination,
    loading,
    error,
    refetch: fetchData,
    createItem,
    updateItem,
    deleteItem,
  }
}

// Phone number management hook
export function usePhoneNumbers() {
  const [data, setData] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/admin/phone-numbers")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch phone numbers: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result.phoneNumbers || [])
      setPagination(result.pagination || null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast.error(`Failed to fetch phone numbers: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const createItem = useCallback(async (item: any) => {
    try {
      const response = await fetch("/api/admin/phone-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to purchase phone number")
      }

      const newItem = await response.json()
      setData(prev => [...prev, newItem])
      toast.success("Phone number purchased successfully")
      return newItem
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to purchase phone number: ${error.message}`)
      throw error
    }
  }, [])

  const updateItem = useCallback(async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/phone-numbers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update phone number")
      }

      const updatedItem = await response.json()
      setData(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ))
      toast.success("Phone number updated successfully")
      return updatedItem
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to update phone number: ${error.message}`)
      throw error
    }
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/phone-numbers/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete phone number")
      }

      setData(prev => prev.filter(item => item.id !== id))
      toast.success("Phone number deleted successfully")
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to delete phone number: ${error.message}`)
      throw error
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [fetchData])

  return {
    data,
    pagination,
    loading,
    error,
    refetch: fetchData,
    createItem,
    updateItem,
    deleteItem,
  }
}

// IVR menu management hook
export function useIVRMenus() {
  return useAdminData("/api/admin/ivr", {
    refreshInterval: 30000,
  })
}

// System settings hook
export function useSystemSettings() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/admin/settings")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`)
      }
      
      const result = await response.json()
      setSettings(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast.error(`Failed to fetch settings: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSettings = useCallback(async (updates: any) => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update settings")
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings)
      toast.success("Settings updated successfully")
      return updatedSettings
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to update settings: ${error.message}`)
      throw error
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
  }
}

// Business hours hook
export function useBusinessHours() {
  const [businessHours, setBusinessHours] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBusinessHours = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/admin/business-hours")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch business hours: ${response.statusText}`)
      }
      
      const result = await response.json()
      setBusinessHours(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast.error(`Failed to fetch business hours: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateBusinessHours = useCallback(async (updates: any) => {
    try {
      const response = await fetch("/api/admin/business-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update business hours")
      }

      const updatedHours = await response.json()
      setBusinessHours(updatedHours)
      toast.success("Business hours updated successfully")
      return updatedHours
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      toast.error(`Failed to update business hours: ${error.message}`)
      throw error
    }
  }, [])

  useEffect(() => {
    fetchBusinessHours()
  }, [fetchBusinessHours])

  return {
    businessHours,
    loading,
    error,
    refetch: fetchBusinessHours,
    updateBusinessHours,
  }
}

// Phone number search hook
export function usePhoneNumberSearch() {
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const searchNumbers = useCallback(async (criteria: {
    areaCode?: string
    contains?: string
    inRegion?: string
    nearLatLng?: string
    nearNumber?: string
    limit?: number
  }) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch("/api/admin/phone-numbers/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to search phone numbers")
      }

      const result = await response.json()
      setSearchResults(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast.error(`Failed to search phone numbers: ${error.message}`)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    searchResults,
    loading,
    error,
    searchNumbers,
  }
}

// Dashboard metrics hook
export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // In a real implementation, this would fetch from a dedicated dashboard API
      // For now, we'll aggregate data from multiple endpoints
      const [usersResponse, phoneNumbersResponse, ivrResponse] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/phone-numbers"),
        fetch("/api/admin/ivr"),
      ])

      const [users, phoneNumbers, ivrMenus] = await Promise.all([
        usersResponse.json(),
        phoneNumbersResponse.json(),
        ivrResponse.json(),
      ])

      const metrics = {
        totalUsers: users.users?.length || 0,
        activeUsers: users.users?.filter((u: any) => u.isActive).length || 0,
        totalPhoneNumbers: phoneNumbers.phoneNumbers?.length || 0,
        activePhoneNumbers: phoneNumbers.phoneNumbers?.filter((p: any) => p.status === "active").length || 0,
        totalIVRMenus: ivrMenus.length || 0,
        activeIVRMenus: ivrMenus.filter((i: any) => i.isActive).length || 0,
        systemHealth: "healthy" as const,
        recentActivity: [],
        performanceMetrics: {
          averageCallDuration: 180,
          callVolume: 156,
          responseTime: 2.3,
          uptime: 99.9,
        },
      }

      setMetrics(metrics)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      toast.error(`Failed to fetch dashboard metrics: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  }
}
