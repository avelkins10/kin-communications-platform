"use client";

import { useState, useEffect, useCallback } from "react";
import { QBCustomer, QBProjectCoordinator, QBProject, QBCommunication } from "@/types/quickbase";

// Custom hook for customer lookup
export function useCustomerLookup(phone?: string) {
  const [customer, setCustomer] = useState<QBCustomer | null>(null);
  const [projectCoordinator, setProjectCoordinator] = useState<QBProjectCoordinator | null>(null);
  const [project, setProject] = useState<QBProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupCustomer = useCallback(async (phoneNumber: string) => {
    if (!phoneNumber) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quickbase/customers?phone=${encodeURIComponent(phoneNumber)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to lookup customer");
      }

      if (data.success && data.data.found) {
        setCustomer(data.data.customer);
        setProjectCoordinator(data.data.projectCoordinator);
        setProject(data.data.project);
      } else {
        setCustomer(null);
        setProjectCoordinator(null);
        setProject(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to lookup customer");
      setCustomer(null);
      setProjectCoordinator(null);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (phone) {
      lookupCustomer(phone);
    }
  }, [phone, lookupCustomer]);

  return {
    customer,
    projectCoordinator,
    project,
    loading,
    error,
    lookupCustomer
  };
}

// Custom hook for project coordinator retrieval
export function useProjectCoordinator(customerId?: string, pcEmail?: string) {
  const [projectCoordinator, setProjectCoordinator] = useState<QBProjectCoordinator | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectCoordinator = useCallback(async () => {
    if (!customerId && !pcEmail) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (customerId) params.append("customerId", customerId);
      if (pcEmail) params.append("email", pcEmail);

      const response = await fetch(`/api/quickbase/project-coordinators?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project coordinator");
      }

      if (data.success && data.data) {
        setProjectCoordinator(data.data);
      } else {
        setProjectCoordinator(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project coordinator");
      setProjectCoordinator(null);
    } finally {
      setLoading(false);
    }
  }, [customerId, pcEmail]);

  useEffect(() => {
    fetchProjectCoordinator();
  }, [fetchProjectCoordinator]);

  return {
    projectCoordinator,
    loading,
    error,
    refetch: fetchProjectCoordinator
  };
}

// Custom hook for project status queries
export function useProjectStatus(customerId: string) {
  const [project, setProject] = useState<QBProject | null>(null);
  const [status, setStatus] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectStatus = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quickbase/projects?customerId=${customerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project status");
      }

      if (data.success) {
        setProject(data.data.project);
        setStatus(data.data.status);
        setStage(data.data.stage);
      } else {
        setProject(null);
        setStatus("");
        setStage("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project status");
      setProject(null);
      setStatus("");
      setStage("");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchProjectStatus();
  }, [fetchProjectStatus]);

  return {
    project,
    status,
    stage,
    loading,
    error,
    refetch: fetchProjectStatus
  };
}

// Custom hook for communication logging
export function useCommunicationLogger() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logCommunication = useCallback(async (communication: {
    customerId: string;
    type: 'call' | 'sms' | 'voicemail' | 'email';
    direction: 'inbound' | 'outbound';
    duration?: number;
    agentId?: string;
    notes?: string;
    recordingUrl?: string;
    status: 'completed' | 'failed' | 'missed';
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quickbase/communications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(communication)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log communication");
      }

      return data.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log communication");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logBatchCommunications = useCallback(async (communications: Array<{
    customerId: string;
    type: 'call' | 'sms' | 'voicemail' | 'email';
    direction: 'inbound' | 'outbound';
    duration?: number;
    agentId?: string;
    notes?: string;
    recordingUrl?: string;
    status: 'completed' | 'failed' | 'missed';
  }>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/quickbase/communications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ communications })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to log communications");
      }

      return data.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log communications");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logCommunication,
    logBatchCommunications,
    loading,
    error
  };
}

// Custom hook for real-time customer data updates
export function useCustomerData(customerId: string, refreshInterval?: number) {
  const [customer, setCustomer] = useState<QBCustomer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomerData = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quickbase/customers/${customerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch customer data");
      }

      if (data.success && data.data.customer) {
        setCustomer(data.data.customer);
      } else {
        setCustomer(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch customer data");
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomerData();

    // Set up refresh interval if provided
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchCustomerData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchCustomerData, refreshInterval]);

  return {
    customer,
    loading,
    error,
    refetch: fetchCustomerData
  };
}

// Custom hook for customer synchronization
export function useCustomerSync() {
  const [syncStatus, setSyncStatus] = useState<{
    isRunning: boolean;
    progress: number;
    result?: any;
    error?: string;
  }>({
    isRunning: false,
    progress: 0
  });

  const startSync = useCallback(async (options: {
    type: 'full' | 'incremental';
    force?: boolean;
    customerIds?: string[];
  }) => {
    setSyncStatus({
      isRunning: true,
      progress: 0
    });

    try {
      const response = await fetch("/api/quickbase/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(options)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setSyncStatus({
        isRunning: false,
        progress: 100,
        result: data.data
      });

      return data.data;
    } catch (err) {
      setSyncStatus({
        isRunning: false,
        progress: 0,
        error: err instanceof Error ? err.message : "Sync failed"
      });
      throw err;
    }
  }, []);

  return {
    syncStatus,
    startSync
  };
}
