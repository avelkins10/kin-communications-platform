"use client";

import React, { useState, useEffect } from 'react';
import { ContactSectionType } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Building, 
  Settings,
  Keyboard
} from 'lucide-react';

interface SectionSwitcherProps {
  activeSection: ContactSectionType;
  onSectionChange: (section: ContactSectionType) => void;
  customerCount?: number;
  employeeCount?: number;
  onConfigure?: () => void;
}

export function SectionSwitcher({ 
  activeSection, 
  onSectionChange, 
  customerCount = 0,
  employeeCount = 0,
  onConfigure
}: SectionSwitcherProps) {
  const [realTimeCounts, setRealTimeCounts] = useState({
    customers: customerCount,
    employees: employeeCount
  });

  // Update real-time counts
  useEffect(() => {
    setRealTimeCounts({
      customers: customerCount,
      employees: employeeCount
    });
  }, [customerCount, employeeCount]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'c' || event.key === 'C') {
        event.preventDefault();
        onSectionChange('CUSTOMERS');
      } else if (event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        onSectionChange('EMPLOYEES');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onSectionChange]);

  const getSectionIcon = (section: ContactSectionType) => {
    switch (section) {
      case 'CUSTOMERS':
        return <Building className="h-4 w-4" />;
      case 'EMPLOYEES':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getSectionLabel = (section: ContactSectionType) => {
    switch (section) {
      case 'CUSTOMERS':
        return 'Customers';
      case 'EMPLOYEES':
        return 'Employees';
      default:
        return 'Contacts';
    }
  };

  const getSectionDescription = (section: ContactSectionType) => {
    switch (section) {
      case 'CUSTOMERS':
        return 'QuickBase-synced customer contacts with project status and SLA tracking';
      case 'EMPLOYEES':
        return 'KIN staff members with role and department information';
      default:
        return 'All contacts';
    }
  };

  const getSectionCount = (section: ContactSectionType) => {
    switch (section) {
      case 'CUSTOMERS':
        return realTimeCounts.customers;
      case 'EMPLOYEES':
        return realTimeCounts.employees;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant={activeSection === 'CUSTOMERS' ? 'default' : 'outline'}
                onClick={() => onSectionChange('CUSTOMERS')}
                className="flex items-center space-x-2"
              >
                <Building className="h-4 w-4" />
                <span>Customers</span>
                <Badge variant={activeSection === 'CUSTOMERS' ? 'secondary' : 'outline'}>
                  {realTimeCounts.customers}
                </Badge>
              </Button>
              
              <Button
                variant={activeSection === 'EMPLOYEES' ? 'default' : 'outline'}
                onClick={() => onSectionChange('EMPLOYEES')}
                className="flex items-center space-x-2"
              >
                <Users className="h-4 w-4" />
                <span>Employees</span>
                <Badge variant={activeSection === 'EMPLOYEES' ? 'secondary' : 'outline'}>
                  {realTimeCounts.employees}
                </Badge>
              </Button>
            </div>
            
            {onConfigure && (
              <Button
                variant="outline"
                size="sm"
                onClick={onConfigure}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Configure</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            activeSection === 'CUSTOMERS' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {getSectionIcon(activeSection)}
          </div>
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <span>{getSectionLabel(activeSection)}</span>
              <Badge variant="outline">
                {getSectionCount(activeSection)} total
              </Badge>
            </h2>
            <p className="text-gray-600">
              {getSectionDescription(activeSection)}
            </p>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <Card className="bg-gray-50">
        <CardContent className="p-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Keyboard className="h-4 w-4" />
            <span>Keyboard shortcuts:</span>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">C</kbd>
                <span>Customers</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">E</kbd>
                <span>Employees</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








