"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"
import { Search, Filter, X, Clock, Star, History, Settings } from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"

const enhancedSearchVariants = cva(
  "flex items-center space-x-2",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
      variant: {
        default: "w-full",
        compact: "w-64",
        full: "w-full",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
)

export interface SearchFilter {
  key: string
  label: string
  type: "select" | "multiselect" | "date" | "range"
  options?: Array<{ value: string; label: string }>
  value?: string | string[]
}

export interface SearchPreset {
  id: string
  name: string
  query: string
  filters: Record<string, any>
  isDefault?: boolean
}

export interface SearchSuggestion {
  id: string
  text: string
  type: "recent" | "saved" | "suggestion"
  count?: number
}

export interface EnhancedSearchProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof enhancedSearchVariants> {
  placeholder?: string
  value?: string
  onSearch?: (query: string, filters: Record<string, any>) => void
  onFilterChange?: (filters: Record<string, any>) => void
  filters?: SearchFilter[]
  presets?: SearchPreset[]
  suggestions?: SearchSuggestion[]
  showFilters?: boolean
  showPresets?: boolean
  showSuggestions?: boolean
  showHistory?: boolean
  debounceMs?: number
  maxHistoryItems?: number
  context?: "contacts" | "calls" | "messages" | "voicemails" | "general"
}

export function EnhancedSearch({
  className,
  size,
  variant,
  placeholder = "Search...",
  value = "",
  onSearch,
  onFilterChange,
  filters = [],
  presets = [],
  suggestions = [],
  showFilters = true,
  showPresets = true,
  showSuggestions = true,
  showHistory = true,
  debounceMs = 300,
  maxHistoryItems = 10,
  context = "general",
  ...props
}: EnhancedSearchProps) {
  const [searchQuery, setSearchQuery] = React.useState(value)
  const [activeFilters, setActiveFilters] = React.useState<Record<string, any>>({})
  const [searchHistory, setSearchHistory] = React.useState<string[]>([])
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false)
  const [isPresetsOpen, setIsPresetsOpen] = React.useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)

  const debouncedQuery = useDebounce(searchQuery, debounceMs)

  // Load search history from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem(`search-history-${context}`)
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch {
        setSearchHistory([])
      }
    }
  }, [context])

  // Save search history
  const saveToHistory = (query: string) => {
    if (!query.trim()) return
    
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, maxHistoryItems)
      localStorage.setItem(`search-history-${context}`, JSON.stringify(newHistory))
      return newHistory
    })
  }

  // Handle search
  React.useEffect(() => {
    if (debouncedQuery !== value) {
      onSearch?.(debouncedQuery, activeFilters)
    }
  }, [debouncedQuery, activeFilters, onSearch, value])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      saveToHistory(query)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearFilters = () => {
    setActiveFilters({})
    onFilterChange?.({})
  }

  const applyPreset = (preset: SearchPreset) => {
    setSearchQuery(preset.query)
    setActiveFilters(preset.filters)
    onSearch?.(preset.query, preset.filters)
    setIsPresetsOpen(false)
  }

  const getContextPlaceholder = () => {
    switch (context) {
      case "contacts": return "Search contacts..."
      case "calls": return "Search call history..."
      case "messages": return "Search messages..."
      case "voicemails": return "Search voicemails..."
      default: return placeholder
    }
  }

  const getContextIcon = () => {
    switch (context) {
      case "contacts": return <Search className="h-4 w-4" />
      case "calls": return <Search className="h-4 w-4" />
      case "messages": return <Search className="h-4 w-4" />
      case "voicemails": return <Search className="h-4 w-4" />
      default: return <Search className="h-4 w-4" />
    }
  }

  const activeFilterCount = Object.keys(activeFilters).filter(key => 
    activeFilters[key] !== undefined && activeFilters[key] !== ""
  ).length

  return (
    <div className={cn(enhancedSearchVariants({ size, variant }), className)} {...props}>
      {/* Search Input */}
      <div className="relative flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={getContextPlaceholder()}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsSuggestionsOpen(true)}
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearch("")}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && isSuggestionsOpen && (suggestions.length > 0 || searchHistory.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50">
            <Command>
              <CommandList>
                {suggestions.length > 0 && (
                  <CommandGroup heading="Suggestions">
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.id}
                        onSelect={() => {
                          handleSearch(suggestion.text)
                          setIsSuggestionsOpen(false)
                        }}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {suggestion.text}
                        {suggestion.count && (
                          <Badge variant="secondary" className="ml-auto">
                            {suggestion.count}
                          </Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {showHistory && searchHistory.length > 0 && (
                  <CommandGroup heading="Recent Searches">
                    {searchHistory.slice(0, 5).map((item, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => {
                          handleSearch(item)
                          setIsSuggestionsOpen(false)
                        }}
                      >
                        <History className="h-4 w-4 mr-2" />
                        {item}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      {/* Filter Button */}
      {showFilters && filters.length > 0 && (
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-2">
                    <label className="text-sm font-medium">{filter.label}</label>
                    {filter.type === "select" && (
                      <Select
                        value={activeFilters[filter.key] || ""}
                        onValueChange={(value) => handleFilterChange(filter.key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${filter.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All</SelectItem>
                          {filter.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {filter.type === "multiselect" && (
                      <div className="space-y-2">
                        {filter.options?.map((option) => (
                          <label key={option.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={(activeFilters[filter.key] || []).includes(option.value)}
                              onChange={(e) => {
                                const current = activeFilters[filter.key] || []
                                const newValue = e.target.checked
                                  ? [...current, option.value]
                                  : current.filter((v: string) => v !== option.value)
                                handleFilterChange(filter.key, newValue)
                              }}
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Presets Button */}
      {showPresets && presets.length > 0 && (
        <Popover open={isPresetsOpen} onOpenChange={setIsPresetsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-2" />
              Presets
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-2">
              <h4 className="font-medium">Saved Searches</h4>
              {presets.map((preset) => (
                <Button
                  key={preset.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="w-full justify-start"
                >
                  {preset.isDefault && <Star className="h-3 w-3 mr-2 fill-current" />}
                  {preset.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}


