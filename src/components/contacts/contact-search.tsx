"use client";

import { useState, useEffect } from "react";
import { ContactType, ContactGroup } from "@/types";
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
import { Search, X, Filter } from "lucide-react";

interface ContactSearchProps {
  onSearch: (params: {
    search?: string;
    type?: ContactType;
    department?: string;
    isFavorite?: boolean;
    groupId?: string;
  }) => void;
  groups: ContactGroup[];
  loading?: boolean;
}

const contactTypes: { value: ContactType; label: string }[] = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "FIELD_CREW", label: "Field Crew" },
  { value: "SALES_REP", label: "Sales Rep" },
  { value: "VENDOR", label: "Vendor" },
];

export function ContactSearch({ onSearch, groups, loading = false }: ContactSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ContactType | "">("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedType, selectedDepartment, selectedGroup, showFavoritesOnly]);

  const handleSearch = () => {
    const params: any = {};
    
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    
    if (selectedType) {
      params.type = selectedType;
    }
    
    if (selectedDepartment.trim()) {
      params.department = selectedDepartment.trim();
    }
    
    if (selectedGroup) {
      params.groupId = selectedGroup;
    }
    
    if (showFavoritesOnly) {
      params.isFavorite = true;
    }

    onSearch(params);
    updateActiveFilters();
  };

  const updateActiveFilters = () => {
    const filters: string[] = [];
    
    if (searchTerm.trim()) filters.push(`Search: "${searchTerm.trim()}"`);
    if (selectedType) filters.push(`Type: ${contactTypes.find(t => t.value === selectedType)?.label}`);
    if (selectedDepartment.trim()) filters.push(`Department: "${selectedDepartment.trim()}"`);
    if (selectedGroup) {
      const group = groups.find(g => g.id === selectedGroup);
      if (group) filters.push(`Group: ${group.name}`);
    }
    if (showFavoritesOnly) filters.push("Favorites only");

    setActiveFilters(filters);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedDepartment("");
    setSelectedGroup("");
    setShowFavoritesOnly(false);
    setActiveFilters([]);
    onSearch({});
  };

  const removeFilter = (filterToRemove: string) => {
    if (filterToRemove.startsWith("Search:")) {
      setSearchTerm("");
    } else if (filterToRemove.startsWith("Type:")) {
      setSelectedType("");
    } else if (filterToRemove.startsWith("Department:")) {
      setSelectedDepartment("");
    } else if (filterToRemove.startsWith("Group:")) {
      setSelectedGroup("");
    } else if (filterToRemove === "Favorites only") {
      setShowFavoritesOnly(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts by name, phone, email, or organization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          disabled={loading}
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type-filter">Contact Type</Label>
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ContactType)}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              {contactTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department-filter">Department</Label>
          <Input
            id="department-filter"
            placeholder="Filter by department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="group-filter">Contact Group</Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger>
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All groups</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Options</Label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="favorites-only"
              checked={showFavoritesOnly}
              onChange={(e) => setShowFavoritesOnly(e.target.checked)}
              className="rounded"
              disabled={loading}
            />
            <Label htmlFor="favorites-only" className="text-sm">
              Favorites only
            </Label>
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
