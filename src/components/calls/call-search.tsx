"use client";

import { useState, useEffect } from "react";
import { CallDirection, CallStatus } from "@/types/index";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, Calendar } from "lucide-react";

interface CallSearchProps {
  onSearch: (params: {
    search?: string;
    direction?: CallDirection;
    status?: CallStatus;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  loading?: boolean;
}

const callDirections: { value: CallDirection; label: string }[] = [
  { value: "INBOUND", label: "Inbound" },
  { value: "OUTBOUND", label: "Outbound" },
];

const callStatuses: { value: CallStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "RINGING", label: "Ringing" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "MISSED", label: "Missed" },
  { value: "VOICEMAIL", label: "Voicemail" },
];

export function CallSearch({ onSearch, loading = false }: CallSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDirection, setSelectedDirection] = useState<CallDirection | "">("");
  const [selectedStatus, setSelectedStatus] = useState<CallStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedDirection, selectedStatus, dateFrom, dateTo]);

  const handleSearch = () => {
    const params: any = {};
    
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    if (selectedDirection) {
      params.direction = selectedDirection;
    }
    
    if (selectedStatus) {
      params.status = selectedStatus;
    }
    
    if (dateFrom) {
      params.dateFrom = dateFrom;
    }
    
    if (dateTo) {
      params.dateTo = dateTo;
    }

    onSearch(params);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const filters: string[] = [];
    
    if (searchTerm.trim()) filters.push(`Search: "${searchTerm.trim()}"`);
    if (selectedDirection) filters.push(`Direction: ${callDirections.find(d => d.value === selectedDirection)?.label}`);
    if (selectedStatus) filters.push(`Status: ${callStatuses.find(s => s.value === selectedStatus)?.label}`);
    if (dateFrom) filters.push(`From: ${new Date(dateFrom).toLocaleDateString()}`);
    if (dateTo) filters.push(`To: ${new Date(dateTo).toLocaleDateString()}`);

    setActiveFilters(filters);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDirection("");
    setSelectedStatus("");
    setDateFrom("");
    setDateTo("");
    setActiveFilters([]);
    onSearch({});
  };

  const removeFilter = (filterToRemove: string) => {
    if (filterToRemove.startsWith("Search:")) {
      setSearchTerm("");
    } else if (filterToRemove.startsWith("Direction:")) {
      setSelectedDirection("");
    } else if (filterToRemove.startsWith("Status:")) {
      setSelectedStatus("");
    } else if (filterToRemove.startsWith("From:")) {
      setDateFrom("");
    } else if (filterToRemove.startsWith("To:")) {
      setDateTo("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search calls by contact name, phone number, or organization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          disabled={loading}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="direction-filter">Call Direction</Label>
          <Select value={selectedDirection} onValueChange={(value) => setSelectedDirection(value as CallDirection)}>
            <SelectTrigger>
              <SelectValue placeholder="All directions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All directions</SelectItem>
              {callDirections.map((direction) => (
                <SelectItem key={direction.value} value={direction.value}>
                  {direction.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-filter">Call Status</Label>
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as CallStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              {callStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-from">Date From</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-to">Date To</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Active Filters:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {filter}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter)}
                  className="h-4 w-4 p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
