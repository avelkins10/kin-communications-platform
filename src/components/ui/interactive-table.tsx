"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronUp, ChevronDown, Search, Filter, MoreHorizontal } from "lucide-react"
import { LoadingState } from "@/components/ui/loading-state"

const interactiveTableVariants = cva(
  "w-full border rounded-lg overflow-hidden",
  {
    variants: {
      density: {
        compact: "text-sm",
        comfortable: "text-base",
        spacious: "text-lg",
      },
      variant: {
        default: "bg-background",
        striped: "bg-background",
        bordered: "border-2",
      },
    },
    defaultVariants: {
      density: "comfortable",
      variant: "default",
    },
  }
)

export interface Column<T> {
  key: string
  title: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
  align?: "left" | "center" | "right"
}

export interface InteractiveTableProps<T>
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof interactiveTableVariants> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  selectable?: boolean
  onSelectionChange?: (selectedRows: T[]) => void
  onSort?: (column: string, direction: "asc" | "desc") => void
  onFilter?: (column: string, value: string) => void
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  stickyHeader?: boolean
  virtualScrolling?: boolean
  emptyMessage?: string
  bulkActions?: React.ReactNode
}

function InteractiveTable<T extends Record<string, any>>({
  className,
  density,
  variant,
  data,
  columns,
  loading = false,
  selectable = false,
  onSelectionChange,
  onSort,
  onFilter,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  stickyHeader = false,
  virtualScrolling = false,
  emptyMessage = "No data available",
  bulkActions,
  ...props
}: InteractiveTableProps<T>) {
  const [selectedRows, setSelectedRows] = React.useState<T[]>([])
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = React.useState("")

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows([...data])
      onSelectionChange?.(data)
    } else {
      setSelectedRows([])
      onSelectionChange?.([])
    }
  }

  const handleSelectRow = (row: T, checked: boolean) => {
    let newSelection: T[]
    if (checked) {
      newSelection = [...selectedRows, row]
    } else {
      newSelection = selectedRows.filter(r => r !== row)
    }
    setSelectedRows(newSelection)
    onSelectionChange?.(newSelection)
  }

  const handleSort = (column: string) => {
    const newDirection = sortColumn === column && sortDirection === "asc" ? "desc" : "asc"
    setSortColumn(column)
    setSortDirection(newDirection)
    onSort?.(column, newDirection)
  }

  const handleFilter = (column: string, value: string) => {
    const newFilters = { ...filters, [column]: value }
    setFilters(newFilters)
    onFilter?.(column, value)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const isAllSelected = data.length > 0 && selectedRows.length === data.length
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length

  if (loading) {
    return (
      <div className={cn(interactiveTableVariants({ density, variant }), className)} {...props}>
        <LoadingState variant="skeleton" context="table" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {/* Search and Filters */}
      {(searchable || columns.some(col => col.filterable)) && (
        <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {columns
            .filter(col => col.filterable)
            .map(column => (
              <Select
                key={column.key}
                value={filters[column.key] || ""}
                onValueChange={(value) => handleFilter(column.key, value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={`Filter ${column.title}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {Array.from(new Set(data.map(row => row[column.key])))
                    .filter(Boolean)
                    .map(value => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ))}
        </div>
      )}

      {/* Bulk Actions */}
      {selectable && selectedRows.length > 0 && bulkActions && (
        <div className="flex items-center space-x-2 p-2 bg-primary/10 rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} selected
          </span>
          {bulkActions}
        </div>
      )}

      {/* Table */}
      <div className={cn(interactiveTableVariants({ density, variant }))}>
        <Table className="interactive-table">
          <TableHeader className={cn(stickyHeader && "sticky top-0 bg-background z-10")}>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map(column => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.width && `w-[${column.width}]`,
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right"
                  )}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSort(column.key)}
                      >
                        {sortColumn === column.key ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <div className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={index}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(row)}
                        onCheckedChange={(checked) => handleSelectRow(row, !!checked)}
                      />
                    </TableCell>
                  )}
                  {columns.map(column => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right"
                      )}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export { InteractiveTable, interactiveTableVariants }
