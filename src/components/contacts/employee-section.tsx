"use client";

import React, { useState, useEffect } from 'react';
import { EmployeeContact, ContactSearchParams } from '@/types';
import { InteractiveTable } from '@/components/ui/interactive-table';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Phone, 
  MessageSquare, 
  Plus,
  Edit,
  Trash2,
  User,
  Building
} from 'lucide-react';

interface EmployeeSectionProps {
  onContactSelect?: (contact: EmployeeContact) => void;
  onCall?: (contact: EmployeeContact) => void;
  onMessage?: (contact: EmployeeContact) => void;
  onEdit?: (contact: EmployeeContact) => void;
  onDelete?: (contact: EmployeeContact) => void;
}

export function EmployeeSection({ 
  onContactSelect, 
  onCall, 
  onMessage, 
  onEdit,
  onDelete
}: EmployeeSectionProps) {
  const [employees, setEmployees] = useState<EmployeeContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<ContactSearchParams>({
    sectionType: 'EMPLOYEES',
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch employees data
  useEffect(() => {
    fetchEmployees();
  }, [searchParams]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/contacts?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch employees');
      
      const data = await response.json();
      setEmployees(data.contacts || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
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

  const handleSelectEmployee = (employeeId: string, selected: boolean) => {
    if (selected) {
      setSelectedEmployees(prev => [...prev, employeeId]);
    } else {
      setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedEmployees(employees.map(e => e.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedEmployees.length === 0) return;

    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          contactIds: selectedEmployees,
          data: {}
        })
      });

      if (response.ok) {
        setSelectedEmployees([]);
        fetchEmployees(); // Refresh data
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const getEmployeeTypeColor = (type: string) => {
    switch (type) {
      case 'FIELD_CREW':
        return 'bg-blue-100 text-blue-800';
      case 'SALES_REP':
        return 'bg-green-100 text-green-800';
      case 'VENDOR':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeTypeLabel = (type: string) => {
    switch (type) {
      case 'FIELD_CREW':
        return 'Field Crew';
      case 'SALES_REP':
        return 'Sales Rep';
      case 'VENDOR':
        return 'Vendor';
      default:
        return type;
    }
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedEmployees.length === employees.length && employees.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="rounded border-gray-300"
        />
      ),
      render: (employee: EmployeeContact) => (
        <input
          type="checkbox"
          checked={selectedEmployees.includes(employee.id)}
          onChange={(e) => handleSelectEmployee(employee.id, e.target.checked)}
          className="rounded border-gray-300"
        />
      )
    },
    {
      key: 'name',
      header: 'Employee Name',
      sortable: true,
      render: (employee: EmployeeContact) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium">
              {employee.firstName} {employee.lastName}
            </span>
            <span className="text-sm text-gray-500">{employee.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Role',
      sortable: true,
      render: (employee: EmployeeContact) => (
        <div className="flex flex-col space-y-1">
          <Badge className={getEmployeeTypeColor(employee.type)}>
            {getEmployeeTypeLabel(employee.type)}
          </Badge>
          {employee.role && (
            <span className="text-sm text-gray-600">{employee.role}</span>
          )}
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (employee: EmployeeContact) => (
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-gray-400" />
          <span>{employee.department}</span>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (employee: EmployeeContact) => (
        <div className="flex flex-col space-y-1">
          <span className="text-sm font-medium">{employee.phone}</span>
          {employee.email && (
            <span className="text-sm text-gray-500">{employee.email}</span>
          )}
        </div>
      )
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (employee: EmployeeContact) => (
        <StatusIndicator 
          status={employee.isAvailable ? 'ACTIVE' : 'INACTIVE'}
          isStale={false}
        />
      )
    },
    {
      key: 'lastContact',
      header: 'Last Contact',
      sortable: true,
      render: (employee: EmployeeContact) => (
        <div className="flex flex-col">
          <span className="text-sm">
            {employee.lastContactDate 
              ? new Date(employee.lastContactDate).toLocaleDateString()
              : 'Never'
            }
          </span>
          {employee.lastContactByUser && (
            <span className="text-xs text-gray-500">
              by {employee.lastContactByUser.name}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (employee: EmployeeContact) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCall?.(employee)}
            className="h-8 w-8 p-0"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMessage?.(employee)}
            className="h-8 w-8 p-0"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit?.(employee)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete?.(employee)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-gray-600">
            KIN staff members with role and department information
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
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
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={searchParams.type === 'FIELD_CREW' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange({ 
                type: searchParams.type === 'FIELD_CREW' ? undefined : 'FIELD_CREW' 
              })}
            >
              Field Crew
            </Button>
            <Button
              variant={searchParams.type === 'SALES_REP' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange({ 
                type: searchParams.type === 'SALES_REP' ? undefined : 'SALES_REP' 
              })}
            >
              Sales Rep
            </Button>
            <Button
              variant={searchParams.type === 'VENDOR' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange({ 
                type: searchParams.type === 'VENDOR' ? undefined : 'VENDOR' 
              })}
            >
              Vendor
            </Button>
            <Button
              variant={searchParams.department ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange({ 
                department: searchParams.department ? undefined : 'Engineering' 
              })}
            >
              Engineering
            </Button>
            <Button
              variant={searchParams.department === 'Sales' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange({ 
                department: searchParams.department === 'Sales' ? undefined : 'Sales' 
              })}
            >
              Sales
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedEmployees.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedEmployees.length} employee(s) selected
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
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <InteractiveTable
            data={employees}
            columns={columns}
            loading={loading}
            onSort={handleSort}
            sortBy={searchParams.sortBy}
            sortOrder={searchParams.sortOrder}
            onRowClick={(employee) => onContactSelect?.(employee)}
            emptyMessage="No employees found. Try adjusting your search criteria."
          />
        </CardContent>
      </Card>

      {/* Add Employee Form Modal would go here */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Employee form would be implemented here with proper validation.
              </p>
              <div className="flex justify-end space-x-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setShowAddForm(false)}>
                  Add Employee
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}








