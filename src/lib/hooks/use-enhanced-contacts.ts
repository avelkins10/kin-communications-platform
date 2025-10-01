"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Contact, 
  CustomerContact, 
  EmployeeContact, 
  ContactSearchParams, 
  ContactSectionType,
  ContactConfiguration,
  ContactSLAStatus
} from '@/types';

interface UseEnhancedContactsOptions {
  initialSection?: ContactSectionType;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseEnhancedContactsReturn {
  // Data
  customers: CustomerContact[];
  employees: EmployeeContact[];
  configuration: ContactConfiguration | null;
  slaStatuses: Record<string, ContactSLAStatus>;
  
  // State
  loading: boolean;
  error: string | null;
  activeSection: ContactSectionType;
  
  // Search and filtering
  searchParams: ContactSearchParams;
  setSearchParams: (params: Partial<ContactSearchParams>) => void;
  
  // Actions
  switchSection: (section: ContactSectionType) => void;
  refreshData: () => Promise<void>;
  syncCustomerData: (customerId: string) => Promise<void>;
  assignProjectCoordinator: (customerId: string, pcId: string) => Promise<void>;
  updateProjectStatus: (customerId: string, status: 'PRE_PTO' | 'POST_PTO') => Promise<void>;
  updateSLAStatus: (contactId: string, slaData: any) => Promise<void>;
  updateConfiguration: (config: ContactConfiguration) => Promise<void>;
  
  // Bulk operations
  bulkUpdateStatus: (contactIds: string[], status: string) => Promise<void>;
  bulkAssignPC: (contactIds: string[], pcId: string) => Promise<void>;
  bulkMarkStale: (contactIds: string[], isStale: boolean) => Promise<void>;
  
  // Statistics
  stats: {
    totalCustomers: number;
    totalEmployees: number;
    activeCustomers: number;
    staleCustomers: number;
    slaViolations: number;
    approachingSLA: number;
  };
}

export function useEnhancedContacts(options: UseEnhancedContactsOptions = {}): UseEnhancedContactsReturn {
  const {
    initialSection = 'CUSTOMERS',
    autoRefresh = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  // State
  const [customers, setCustomers] = useState<CustomerContact[]>([]);
  const [employees, setEmployees] = useState<EmployeeContact[]>([]);
  const [configuration, setConfiguration] = useState<ContactConfiguration | null>(null);
  const [slaStatuses, setSlaStatuses] = useState<Record<string, ContactSLAStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ContactSectionType>(initialSection);
  const [searchParams, setSearchParamsState] = useState<ContactSearchParams>({
    sectionType: initialSection,
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Statistics
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalEmployees: 0,
    activeCustomers: 0,
    staleCustomers: 0,
    slaViolations: 0,
    approachingSLA: 0
  });

  // Fetch customers
  const fetchCustomers = useCallback(async (params: ContactSearchParams) => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries({ ...params, sectionType: 'CUSTOMERS' }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/contacts?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      const data = await response.json();
      return data.contacts || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async (params: ContactSearchParams) => {
    try {
      const searchParams = new URLSearchParams();
      Object.entries({ ...params, sectionType: 'EMPLOYEES' }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/contacts?${searchParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      
      const data = await response.json();
      return data.contacts || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }, []);

  // Fetch configuration
  const fetchConfiguration = useCallback(async () => {
    try {
      const response = await fetch('/api/contacts/configurations');
      if (response.ok) {
        const data = await response.json();
        return data.current;
      } else if (response.status === 403) {
        // User doesn't have permission to access configuration
        // Return default configuration
        return {
          id: 'default',
          name: 'Default Configuration',
          description: 'Default contact management configuration',
          stalenessRules: {
            activeTimeoutMonths: 6,
            holdTimeoutMonths: 3,
            enabled: true
          },
          statusMappings: {
            activeStatuses: ['active', 'in_progress', 'pending', 'new'],
            inactiveStatuses: ['completed', 'cancelled', 'hold', 'inactive']
          },
          slaSettings: {
            voicemailCallback: {
              sameDayBefore3PM: true,
              nextBusinessDayAfter: true,
              enabled: true
            },
            textResponse: {
              businessHoursMinutes: 30,
              afterHoursNextDay9AM: true,
              enabled: true
            },
            missedCallFollowup: {
              hours: 1,
              enabled: true
            }
          },
          capabilities: {
            slaTracking: false, // Default to disabled for non-managers
            slaEndpoints: false,
            realTimeUpdates: false
          },
          isActive: true,
          createdBy: null,
          createdByUser: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } else {
        throw new Error('Failed to fetch configuration');
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      // Return default configuration on error
      return {
        id: 'default',
        name: 'Default Configuration',
        description: 'Default contact management configuration',
        stalenessRules: {
          activeTimeoutMonths: 6,
          holdTimeoutMonths: 3,
          enabled: true
        },
        statusMappings: {
          activeStatuses: ['active', 'in_progress', 'pending', 'new'],
          inactiveStatuses: ['completed', 'cancelled', 'hold', 'inactive']
        },
        slaSettings: {
          voicemailCallback: {
            sameDayBefore3PM: true,
            nextBusinessDayAfter: true,
            enabled: true
          },
          textResponse: {
            businessHoursMinutes: 30,
            afterHoursNextDay9AM: true,
            enabled: true
          },
          missedCallFollowup: {
            hours: 1,
            enabled: true
          }
        },
        capabilities: {
          slaTracking: false, // Default to disabled on error
          slaEndpoints: false,
          realTimeUpdates: false
        },
        isActive: true,
        createdBy: null,
        createdByUser: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }, []);

  // Fetch SLA statuses
  const fetchSLAStatuses = useCallback(async (contactIds: string[], config: ContactConfiguration | null) => {
    // Check if SLA tracking is enabled in configuration
    const slaEnabled = config?.capabilities?.slaTracking && config?.capabilities?.slaEndpoints;
    
    if (!slaEnabled) {
      console.log('SLA tracking disabled, skipping SLA status fetch');
      return {};
    }

    try {
      const slaPromises = contactIds.map(async (contactId) => {
        const response = await fetch(`/api/contacts/${contactId}/sla`);
        if (response.ok) {
          const slaData = await response.json();
          return { contactId, slaStatus: slaData };
        }
        return { contactId, slaStatus: null };
      });

      const slaResults = await Promise.all(slaPromises);
      const slaMap: Record<string, ContactSLAStatus> = {};
      
      slaResults.forEach(({ contactId, slaStatus }) => {
        if (slaStatus) {
          slaMap[contactId] = slaStatus;
        }
      });

      return slaMap;
    } catch (error) {
      console.error('Error fetching SLA statuses:', error);
      return {};
    }
  }, []);

  // Calculate statistics
  const calculateStats = useCallback((customerList: CustomerContact[], employeeList: EmployeeContact[], slaMap: Record<string, ContactSLAStatus>) => {
    const totalCustomers = customerList.length;
    const totalEmployees = employeeList.length;
    const activeCustomers = customerList.filter(c => c.statusCategory === 'ACTIVE').length;
    const staleCustomers = customerList.filter(c => c.isStale).length;
    
    let slaViolations = 0;
    let approachingSLA = 0;
    
    Object.values(slaMap).forEach(slaStatus => {
      if (slaStatus.hasViolations) {
        slaViolations += slaStatus.totalViolations;
      }
      if (slaStatus.hasApproaching) {
        approachingSLA++;
      }
    });

    return {
      totalCustomers,
      totalEmployees,
      activeCustomers,
      staleCustomers,
      slaViolations,
      approachingSLA
    };
  }, []);

  // Main data fetch function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch configuration
      const config = await fetchConfiguration();
      setConfiguration(config);

      // Fetch customers and employees
      const [customerList, employeeList] = await Promise.all([
        fetchCustomers(searchParams),
        fetchEmployees(searchParams)
      ]);

      setCustomers(customerList);
      setEmployees(employeeList);

      // Fetch SLA statuses for all contacts
      const allContactIds = [...customerList, ...employeeList].map(c => c.id);
      const slaMap = await fetchSLAStatuses(allContactIds, config);
      setSlaStatuses(slaMap);

      // Calculate statistics
      const newStats = calculateStats(customerList, employeeList, slaMap);
      setStats(newStats);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [searchParams, fetchCustomers, fetchEmployees, fetchConfiguration, fetchSLAStatuses, calculateStats]);

  // Set search parameters
  const setSearchParams = useCallback((params: Partial<ContactSearchParams>) => {
    setSearchParamsState(prev => ({ ...prev, ...params, page: 1 }));
  }, []);

  // Switch section
  const switchSection = useCallback((section: ContactSectionType) => {
    setActiveSection(section);
    setSearchParams({ sectionType: section });
  }, [setSearchParams]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Sync customer data with QuickBase
  const syncCustomerData = useCallback(async (customerId: string) => {
    try {
      const response = await fetch('/api/quickbase/sync/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          syncType: 'incremental', 
          customerIds: [customerId] 
        })
      });

      if (!response.ok) throw new Error('Failed to sync customer data');
      
      // Refresh data after sync
      await fetchData();
    } catch (error) {
      console.error('Error syncing customer data:', error);
      throw error;
    }
  }, [fetchData]);

  // Assign Project Coordinator
  const assignProjectCoordinator = useCallback(async (customerId: string, pcId: string) => {
    try {
      const response = await fetch(`/api/contacts/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectCoordinatorId: pcId })
      });

      if (!response.ok) throw new Error('Failed to assign Project Coordinator');
      
      // Update local state
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, projectCoordinatorId: pcId } : c
      ));
    } catch (error) {
      console.error('Error assigning Project Coordinator:', error);
      throw error;
    }
  }, []);

  // Update project status
  const updateProjectStatus = useCallback(async (customerId: string, status: 'PRE_PTO' | 'POST_PTO') => {
    try {
      const response = await fetch(`/api/contacts/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectStatus: status })
      });

      if (!response.ok) throw new Error('Failed to update project status');
      
      // Update local state
      setCustomers(prev => prev.map(c => 
        c.id === customerId ? { ...c, projectStatus: status } : c
      ));
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  }, []);

  // Update SLA status
  const updateSLAStatus = useCallback(async (contactId: string, slaData: any) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/sla`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slaData)
      });

      if (!response.ok) throw new Error('Failed to update SLA status');
      
      // Update local state
      setSlaStatuses(prev => ({ ...prev, [contactId]: slaData }));
    } catch (error) {
      console.error('Error updating SLA status:', error);
      throw error;
    }
  }, []);

  // Update configuration
  const updateConfiguration = useCallback(async (config: ContactConfiguration) => {
    try {
      const response = await fetch('/api/contacts/configurations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (!response.ok) throw new Error('Failed to update configuration');
      
      setConfiguration(config);
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  }, []);

  // Bulk operations
  const bulkUpdateStatus = useCallback(async (contactIds: string[], status: string) => {
    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          contactIds,
          data: { status }
        })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }, [fetchData]);

  const bulkAssignPC = useCallback(async (contactIds: string[], pcId: string) => {
    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign_pc',
          contactIds,
          data: { projectCoordinatorId: pcId }
        })
      });

      if (!response.ok) throw new Error('Failed to assign Project Coordinator');
      
      await fetchData();
    } catch (error) {
      console.error('Error assigning Project Coordinator:', error);
      throw error;
    }
  }, [fetchData]);

  const bulkMarkStale = useCallback(async (contactIds: string[], isStale: boolean) => {
    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_stale',
          contactIds,
          data: { isStale }
        })
      });

      if (!response.ok) throw new Error('Failed to mark stale');
      
      await fetchData();
    } catch (error) {
      console.error('Error marking stale:', error);
      throw error;
    }
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    // Data
    customers,
    employees,
    configuration,
    slaStatuses,
    
    // State
    loading,
    error,
    activeSection,
    
    // Search and filtering
    searchParams,
    setSearchParams,
    
    // Actions
    switchSection,
    refreshData,
    syncCustomerData,
    assignProjectCoordinator,
    updateProjectStatus,
    updateSLAStatus,
    updateConfiguration,
    
    // Bulk operations
    bulkUpdateStatus,
    bulkAssignPC,
    bulkMarkStale,
    
    // Statistics
    stats
  };
}


