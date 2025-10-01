"use client";

import React, { useState, useEffect } from 'react';
import { ContactSearchParams, ContactConfiguration } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Filter, 
  Clock, 
  Settings, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface StalenessFilterProps {
  onFilterChange: (filters: Partial<ContactSearchParams>) => void;
  currentFilters: ContactSearchParams;
  onConfigureRules?: () => void;
}

export function StalenessFilter({ 
  onFilterChange, 
  currentFilters,
  onConfigureRules
}: StalenessFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [configuration, setConfiguration] = useState<ContactConfiguration | null>(null);

  // Fetch current configuration
  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      const response = await fetch('/api/contacts/configurations');
      if (response.ok) {
        const data = await response.json();
        setConfiguration(data.current);
      } else if (response.status === 403) {
        // User doesn't have permission to access configuration
        // Provide default configuration values
        setConfiguration({
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
            slaTracking: false,
            slaEndpoints: false,
            realTimeUpdates: false
          },
          isActive: true,
          createdBy: null,
          createdByUser: null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      // Provide default configuration on error
      setConfiguration({
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
          slaTracking: false,
          slaEndpoints: false,
          realTimeUpdates: false
        },
        isActive: true,
        createdBy: null,
        createdByUser: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  };

  const handleStalenessFilter = (filter: 'all' | 'active_only' | 'include_stale' | 'stale_only') => {
    switch (filter) {
      case 'active_only':
        onFilterChange({ isStale: false });
        break;
      case 'include_stale':
        onFilterChange({ isStale: undefined });
        break;
      case 'stale_only':
        onFilterChange({ isStale: true });
        break;
      case 'all':
      default:
        onFilterChange({ isStale: undefined });
        break;
    }
  };

  const getCurrentFilterLabel = () => {
    if (currentFilters.isStale === false) return 'Active Only';
    if (currentFilters.isStale === true) return 'Stale Only';
    return 'All Contacts';
  };

  const getCurrentFilterColor = () => {
    if (currentFilters.isStale === false) return 'bg-green-100 text-green-800';
    if (currentFilters.isStale === true) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStalenessRuleDescription = () => {
    if (!configuration) return 'Loading configuration...';
    
    const { stalenessRules } = configuration;
    return `Active contacts become stale after ${stalenessRules.activeTimeoutMonths} months, hold contacts after ${stalenessRules.holdTimeoutMonths} months`;
  };

  return (
    <div className="space-y-2">
      {/* Main Filter Button */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Staleness</span>
          <Badge className={getCurrentFilterColor()}>
            {getCurrentFilterLabel()}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Expanded Filter Options */}
      {isExpanded && (
        <Card className="w-full max-w-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Staleness Filter</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={onConfigureRules}
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Current Rules Display */}
            <div className="p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center space-x-1 mb-1">
                <Info className="h-3 w-3 text-gray-500" />
                <span className="font-medium text-gray-700">Current Rules:</span>
              </div>
              <p className="text-gray-600">
                {getStalenessRuleDescription()}
              </p>
            </div>

            {/* Filter Options */}
            <div className="space-y-2">
              <Button
                variant={currentFilters.isStale === undefined ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStalenessFilter('all')}
                className="w-full justify-start"
              >
                <Clock className="h-3 w-3 mr-2" />
                All Contacts
              </Button>
              
              <Button
                variant={currentFilters.isStale === false ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStalenessFilter('active_only')}
                className="w-full justify-start"
              >
                <Clock className="h-3 w-3 mr-2" />
                Active Only
              </Button>
              
              <Button
                variant={currentFilters.isStale === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleStalenessFilter('stale_only')}
                className="w-full justify-start"
              >
                <Clock className="h-3 w-3 mr-2" />
                Stale Only
              </Button>
            </div>

            {/* Status Category Filter */}
            <div className="pt-2 border-t">
              <div className="text-xs font-medium text-gray-700 mb-2">Status Category:</div>
              <div className="space-y-1">
                <Button
                  variant={currentFilters.statusCategory === undefined ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ statusCategory: undefined })}
                  className="w-full justify-start h-7 text-xs"
                >
                  All Statuses
                </Button>
                
                <Button
                  variant={currentFilters.statusCategory === 'ACTIVE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ statusCategory: 'ACTIVE' })}
                  className="w-full justify-start h-7 text-xs"
                >
                  Active
                </Button>
                
                <Button
                  variant={currentFilters.statusCategory === 'INACTIVE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange({ statusCategory: 'INACTIVE' })}
                  className="w-full justify-start h-7 text-xs"
                >
                  Inactive
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="pt-2 border-t">
              <div className="text-xs font-medium text-gray-700 mb-2">Quick Stats:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-green-50 rounded">
                  <div className="font-medium text-green-800">Active</div>
                  <div className="text-green-600">Loading...</div>
                </div>
                <div className="p-2 bg-orange-50 rounded">
                  <div className="font-medium text-orange-800">Stale</div>
                  <div className="text-orange-600">Loading...</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


