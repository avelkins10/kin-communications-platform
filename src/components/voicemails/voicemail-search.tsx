'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  User,
  Flag,
  Eye,
  EyeOff
} from 'lucide-react';
import { VoicemailSearchParams, VoicemailPriority } from '@/types/index';
import { cn } from '@/lib/utils';

interface VoicemailSearchProps {
  onSearch: (params: VoicemailSearchParams) => void;
  loading?: boolean;
  className?: string;
}

const priorityOptions = [
  { value: 'LOW', label: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

const statusOptions = [
  { value: 'false', label: 'Unread', icon: EyeOff },
  { value: 'true', label: 'Read', icon: Eye },
];

const quickFilters = [
  { key: 'my_voicemails', label: 'My Voicemails', icon: User },
  { key: 'unread', label: 'Unread', icon: EyeOff },
  { key: 'high_priority', label: 'High Priority', icon: Flag },
  { key: 'today', label: 'Today', icon: Calendar },
];

export function VoicemailSearch({ onSearch, loading = false, className }: VoicemailSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [isRead, setIsRead] = useState<string>('all');
  const [priority, setPriority] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = () => {
    const params: VoicemailSearchParams = {
      search: searchTerm || undefined,
      assignedToId: assignedToId || undefined,
      isRead: isRead && isRead !== 'all' ? isRead === 'true' : undefined,
      priority: priority && priority !== 'all' ? priority as VoicemailPriority : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    };

    onSearch(params);
  };

  const handleQuickFilter = (filterKey: string) => {
    const newActiveFilters = activeQuickFilters.includes(filterKey)
      ? activeQuickFilters.filter(f => f !== filterKey)
      : [...activeQuickFilters, filterKey];

    setActiveQuickFilters(newActiveFilters);

    // Apply quick filter logic
    const params: VoicemailSearchParams = {};

    if (newActiveFilters.includes('my_voicemails')) {
      // This would be handled by the parent component to get current user ID
      params.assignedToId = 'current_user'; // Placeholder
    }

    if (newActiveFilters.includes('unread')) {
      params.isRead = false; // Show unread voicemails
    }

    if (newActiveFilters.includes('high_priority')) {
      params.priority = 'HIGH';
    }

    if (newActiveFilters.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      params.dateFrom = today.toISOString();
    }

    onSearch(params);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setAssignedToId('');
    setIsRead('all');
    setPriority('all');
    setDateFrom('');
    setDateTo('');
    setActiveQuickFilters([]);
    onSearch({});
  };

  const hasActiveFilters = searchTerm || assignedToId || (isRead && isRead !== 'all') || (priority && priority !== 'all') || dateFrom || dateTo || activeQuickFilters.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search voicemails, caller names, phone numbers, or transcription..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeQuickFilters.includes(filter.key);
          
          return (
            <Button
              key={filter.key}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickFilter(filter.key)}
              className="h-8"
            >
              <Icon className="h-3 w-3 mr-1" />
              {filter.label}
            </Button>
          );
        })}
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            Status
          </label>
          <Select value={isRead} onValueChange={setIsRead}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-3 w-3" />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            Priority
          </label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Badge className={option.color}>
                      {option.label}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            From Date
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        {/* Date To */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            To Date
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setSearchTerm('');
                  handleSearch();
                }}
              />
            </Badge>
          )}
          {isRead && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusOptions.find(s => s.value === isRead)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setIsRead('');
                  handleSearch();
                }}
              />
            </Badge>
          )}
          {priority && (
            <Badge variant="secondary" className="gap-1">
              Priority: {priorityOptions.find(p => p.value === priority)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setPriority('');
                  handleSearch();
                }}
              />
            </Badge>
          )}
          {dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {new Date(dateFrom).toLocaleDateString()}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setDateFrom('');
                  handleSearch();
                }}
              />
            </Badge>
          )}
          {dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {new Date(dateTo).toLocaleDateString()}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setDateTo('');
                  handleSearch();
                }}
              />
            </Badge>
          )}
          {activeQuickFilters.map((filterKey) => {
            const filter = quickFilters.find(f => f.key === filterKey);
            if (!filter) return null;
            
            return (
              <Badge key={filterKey} variant="secondary" className="gap-1">
                {filter.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleQuickFilter(filterKey)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
