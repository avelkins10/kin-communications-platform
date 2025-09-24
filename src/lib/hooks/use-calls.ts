"use client";

import { useState, useEffect, useCallback } from "react";
import { Call, CallDirection, CallStatus } from "@/types/index";

interface CallSearchParams {
  search?: string;
  direction?: CallDirection;
  status?: CallStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface CallControlAction {
  action: "mute" | "unmute" | "hold" | "unhold" | "hangup" | "transfer";
  to?: string;
}

interface UseCallsReturn {
  calls: Call[];
  loading: boolean;
  error: string | null;
  searchCalls: (params: CallSearchParams) => Promise<void>;
  getCall: (id: string) => Promise<Call>;
  controlCall: (id: string, action: CallControlAction) => Promise<void>;
  refreshCalls: () => Promise<void>;
}

export function useCalls(): UseCallsReturn {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    console.error("Call operation error:", err);
    setError(err.message || "An error occurred");
  };

  const searchCalls = useCallback(async (params: CallSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.append("search", params.search);
      if (params.direction) searchParams.append("direction", params.direction);
      if (params.status) searchParams.append("status", params.status);
      if (params.dateFrom) searchParams.append("dateFrom", params.dateFrom);
      if (params.dateTo) searchParams.append("dateTo", params.dateTo);
      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const response = await fetch(`/api/calls?${searchParams}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch calls");
      }

      const data = await response.json();
      setCalls(data.calls || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCall = useCallback(async (id: string): Promise<Call> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/calls/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch call");
      }

      const call = await response.json();
      return call;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const controlCall = useCallback(async (id: string, action: CallControlAction): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/calls/${id}/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to control call");
      }

      // Update local call state if needed
      if (action.action === "hangup") {
        setCalls(prev => prev.map(call => 
          call.id === id 
            ? { ...call, status: "COMPLETED" as CallStatus, endedAt: new Date() }
            : call
        ));
      }
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshCalls = useCallback(async (): Promise<void> => {
    await searchCalls({});
  }, [searchCalls]);

  // Load initial data
  useEffect(() => {
    searchCalls({});
  }, [searchCalls]);

  return {
    calls,
    loading,
    error,
    searchCalls,
    getCall,
    controlCall,
    refreshCalls,
  };
}

// Hook for real-time call status updates
interface UseCallStatusReturn {
  callStatus: CallStatus | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useCallStatus(callId?: string): UseCallStatusReturn {
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!callId) return;

    // TODO: Implement WebSocket connection for real-time updates
    // This would connect to a WebSocket endpoint that provides
    // real-time call status updates
    console.log("Connecting to call status updates for call:", callId);
    setIsConnected(true);
  }, [callId]);

  const disconnect = useCallback(() => {
    // TODO: Disconnect WebSocket
    console.log("Disconnecting from call status updates");
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (callId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [callId, connect, disconnect]);

  return {
    callStatus,
    isConnected,
    connect,
    disconnect,
  };
}

// Hook for call statistics
interface CallStats {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  missedCalls: number;
  averageDuration: number;
  totalDuration: number;
}

interface UseCallStatsReturn {
  stats: CallStats | null;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export function useCallStats(dateRange?: { from: Date; to: Date }): UseCallStatsReturn {
  const [stats, setStats] = useState<CallStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      if (dateRange) {
        searchParams.append("dateFrom", dateRange.from.toISOString());
        searchParams.append("dateTo", dateRange.to.toISOString());
      }

      const response = await fetch(`/api/calls/stats?${searchParams}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch call statistics");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching call stats:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
}
