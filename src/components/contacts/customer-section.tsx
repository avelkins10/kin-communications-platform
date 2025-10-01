"use client";

import React, { useState, useEffect } from 'react';
import { CustomerContact, ContactSearchParams, ContactSLAStatus } from '@/types';
import { InteractiveTable } from '@/components/ui/interactive-table';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ProjectCoordinatorDisplay } from './project-coordinator-display';
import { SLAViolationIndicator } from './sla-violation-indicator';
import { StalenessFilter } from './staleness-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Phone, 
  MessageSquare, 
  ExternalLink, 
  RefreshCw,
  Filter,
  Download,
  Plus
} from 'lucide-react';

interface CustomerSectionProps {
  onContactSelect?: (contact: CustomerContact) => void;
  onCall?: (contact: CustomerContact) => void;
  onMessage?: (contact: CustomerContact) => void;
  onQuickBaseView?: (contact: CustomerContact) => void;
}

export function CustomerSection({ 
  onContactSelect, 
  onCall, 
  onMessage, 
  onQuickBaseView 
}: CustomerSectionProps) {
  const [customers, setCustomers] = useState<CustomerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<ContactSearchParams>({
    sectionType: 'CUSTOMERS',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [slaStatuses, setSlaStatuses] = useState<Record<string, ContactSLAStatus>>({});
  const [slaCapabilities, setSlaCapabilities] = useState<{slaTracking: boolean, slaEndpoints: boolean}>({slaTracking: false, slaEndpoints: false});

  // Fetch customers data and capabilities
  useEffect(() => {
    fetchCustomers();
    fetchSlaCapabilities();
  }, [searchParams]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      const data = await response.json();
      setCustomers(data.contacts || []);
      
      // Fetch SLA statuses for each customer
      await fetchSLAStatuses(data.contacts || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlaCapabilities = async () => {
    try {
      const response = await fetch('/api/contacts/configurations');
      if (response.ok) {
        const data = await response.json();
        const capabilities = data.current?.capabilities || { slaTracking: false, slaEndpoints: false };
        setSlaCapabilities(capabilities);
      } else {
        // Default to disabled if configuration is not accessible
        setSlaCapabilities({ slaTracking: false, slaEndpoints: false });
      }
    } catch (error) {
      console.error('Error fetching SLA capabilities:', error);
      setSlaCapabilities({ slaTracking: false, slaEndpoints: false });
    }
  };

  const fetchSLAStatuses = async (customerList: CustomerContact[]) => {
    // Only fetch SLA statuses if capabilities are enabled
    if (!slaCapabilities.slaTracking || !slaCapabilities.slaEndpoints) {
      console.log('SLA tracking disabled, skipping SLA status fetch');
      return;
    }

    try {
      const slaPromises = customerList.map(async (customer) => {
        const response = await fetch(`/api/contacts/${customer.id}/sla`);
        if (response.ok) {
          const slaData = await response.json();
          return { customerId: customer.id, slaStatus: slaData };
        }
        return { customerId: customer.id, slaStatus: null };
      });

      const slaResults = await Promise.all(slaPromises);
      const slaMap: Record<string, ContactSLAStatus> = {};
      
      slaResults.forEach(({ customerId, slaStatus }) => {
        if (slaStatus) {
          slaMap[customerId] = slaStatus;
        }
      });

      setSlaStatuses(slaMap);
    } catch (error) {
      console.error('Error fetching SLA statuses:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSearchParams(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (filters: Partial<ContactSearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...filters, page: 1 }));
  };

  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSearchParams(prev => ({ ...prev, sortBy, sortOrder }));
  };

  const handleSelectCustomer = (customerId: string, selected: boolean) => {
    if (selected) {
      setSelectedCustomers(prev => [...prev, customerId]);
    } else {
      setSelectedCustomers(prev => prev.filter(id => id !== customerId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCustomers(customers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCustomers.length === 0) return;

    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          contactIds: selectedCustomers,
          data: {}
        })
      });

      if (response.ok) {
        setSelectedCustomers([]);
        fetchCustomers(); // Refresh data
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleSyncQuickBase = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quickbase/sync/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncType: 'incremental' })
      });

      if (response.ok) {
        fetchCustomers(); // Refresh data
      }
    } catch (error) {
      console.error('Error syncing QuickBase:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedCustomers.length === customers.length && customers.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      render: (customer: CustomerContact) => (
        <input
          type="checkbox"
          checked={selectedCustomers.includes(customer.id)}
          onChange={(e) => handleSelectCustomer(customer.id, e.target.checked)}
          className="rounded border-gray-300"
        />
      )
    },
    {
      key: 'name',
      header: 'Customer Name',
      sortable: true,
      render: (customer: CustomerContact) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {customer.firstName} {customer.lastName}
          </span>
          <span className="text-sm text-gray-500">{customer.organization}</span>
        </div>
      )
    },
    {
      key: 'projectCoordinator',
      header: 'Project Coordinator',
      render: (customer: CustomerContact) => (
        <ProjectCoordinatorDisplay 
          projectCoordinator={customer.projectCoordinator}
          customerId={customer.id}
        />
      )
    },
    {
      key: 'projectStatus',
      header: 'Project Status',
      sortable: true,
      render: (customer: CustomerContact) => (
        <Badge 
          variant={customer.projectStatus === 'PRE_PTO' ? 'default' : 'secondary'}
          className="capitalize"
        >
          {customer.projectStatus?.replace('_', '-') || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'statusCategory',
      header: 'Status',
      sortable: true,
      render: (customer: CustomerContact) => (
        <StatusIndicator 
          status={customer.statusCategory}
          isStale={customer.isStale}
        />
      )
    },
    {
      key: 'lastContact',
      header: 'Last Contact',
      sortable: true,
      render: (customer: CustomerContact) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {customer.lastContactDate 
              ? new Date(customer.lastContactDate).toLocaleDateString()
              : 'Never'
            }
          </span>
          {customer.lastContactByUser && (
            <span className="text-xs text-gray-500">
              by {customer.lastContactByUser.name}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'sla',
      header: 'SLA Status',
      render: (customer: CustomerContact) => (
        slaCapabilities.slaTracking && slaCapabilities.slaEndpoints ? (
          <SLAViolationIndicator 
            slaStatus={slaStatuses[customer.id]}
            contactId={customer.id}
          />
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <span className="text-sm text-gray-500">Disabled</span>
          </div>
        )
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (customer: CustomerContact) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCall?.(customer)}
            className="h-8 w-8 p-0"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMessage?.(customer)}
            className="h-8 w-8 p-0"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          {customer.quickbaseId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onQuickBaseView?.(customer)}
              className="h-8 w-8 p-0"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customers</h2>
          <p className="text-gray-600">
            QuickBase-synced customer contacts with project status and SLA tracking
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleSyncQuickBase}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync QuickBase
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <StalenessFilter
              onFilterChange={handleFilterChange}
              currentFilters={searchParams}
            />
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={searchParams.projectStatus === 'PRE_PTO' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange({ 
                projectStatus: searchParams.projectStatus === 'PRE_PTO' ? undefined : 'PRE_PTO' 
              })}
            >
              PRE-PTO
            </Button>
            <Button
              variant={searchParams.projectStatus === 'POST_PTO' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange({ 
                projectStatus: searchParams.projectStatus === 'POST_PTO' ? undefined : 'POST_PTO' 
              })}
            >
              POST-PTO
            </Button>
            <Button
              variant={searchParams.slaViolation ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange({ 
                slaViolation: searchParams.slaViolation ? undefined : true 
              })}
            >
              SLA Violations
            </Button>
            <Button
              variant={searchParams.isStale ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange({ 
                isStale: searchParams.isStale ? undefined : true 
              })}
            >
              Stale Contacts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedCustomers.length} customer(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('update_status')}
                >
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('assign_pc')}
                >
                  Assign PC
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('mark_stale')}
                >
                  Mark Stale
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Table */}
      <Card>
        <CardContent className="p-0">
          <InteractiveTable
            data={customers}
            columns={columns}
            loading={loading}
            onSort={handleSort}
            sortBy={searchParams.sortBy}
            sortOrder={searchParams.sortOrder}
            onRowClick={(customer) => onContactSelect?.(customer)}
            emptyMessage="No customers found. Try adjusting your search criteria."
          />
        </CardContent>
      </Card>
    </div>
  );
}


