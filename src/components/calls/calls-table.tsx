"use client";

import { useState, useCallback } from "react";
import { Call, CallDirection, CallStatus } from "@/types/index";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BulkActions, BulkAction, commonBulkActions } from "@/components/ui/bulk-actions";
import { Phone, Play, Eye, ArrowUpRight, ArrowDownLeft, Download, CheckCircle } from "lucide-react";

interface CallsTableProps {
  calls: Call[];
  onPlayRecording: (call: Call) => void;
  onViewDetails: (call: Call) => void;
  onBulkDelete?: (callIds: string[]) => Promise<void>;
  onBulkDownloadRecordings?: (callIds: string[]) => Promise<void>;
  onBulkMarkReviewed?: (callIds: string[]) => Promise<void>;
  loading?: boolean;
}

const callStatusColors: Record<CallStatus, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  PENDING: "warning",
  RINGING: "info",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  FAILED: "destructive",
  MISSED: "warning",
  VOICEMAIL: "secondary",
};

const callStatusLabels: Record<CallStatus, string> = {
  PENDING: "Pending",
  RINGING: "Ringing",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  FAILED: "Failed",
  MISSED: "Missed",
  VOICEMAIL: "Voicemail",
};

const callDirectionColors: Record<CallDirection, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
  INBOUND: "info",
  OUTBOUND: "success",
};

const callDirectionLabels: Record<CallDirection, string> = {
  INBOUND: "Inbound",
  OUTBOUND: "Outbound",
};

export function CallsTable({
  calls,
  onPlayRecording,
  onViewDetails,
  onBulkDelete,
  onBulkDownloadRecordings,
  onBulkMarkReviewed,
  loading = false,
}: CallsTableProps) {
  const [sortField, setSortField] = useState<keyof Call>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());

  const handleSort = (field: keyof Call) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    setSelectedCalls(new Set(calls.map(call => call.id)));
  }, [calls]);

  const handleClearSelection = useCallback(() => {
    setSelectedCalls(new Set());
  }, []);

  const handleSelectionChange = useCallback((selectedItems: string[]) => {
    setSelectedCalls(new Set(selectedItems));
  }, []);

  const handleCallSelect = useCallback((callId: string, selected: boolean) => {
    const newSelection = new Set(selectedCalls);
    if (selected) {
      newSelection.add(callId);
    } else {
      newSelection.delete(callId);
    }
    setSelectedCalls(newSelection);
  }, [selectedCalls]);

  // Bulk action handlers
  const handleBulkDelete = useCallback(async (callIds: string[]) => {
    if (onBulkDelete) {
      await onBulkDelete(callIds);
    }
  }, [onBulkDelete]);

  const handleBulkDownloadRecordings = useCallback(async (callIds: string[]) => {
    if (onBulkDownloadRecordings) {
      await onBulkDownloadRecordings(callIds);
    }
  }, [onBulkDownloadRecordings]);

  const handleBulkMarkReviewed = useCallback(async (callIds: string[]) => {
    if (onBulkMarkReviewed) {
      await onBulkMarkReviewed(callIds);
    }
  }, [onBulkMarkReviewed]);

  // Bulk actions configuration
  const bulkActions: BulkAction[] = [
    ...(onBulkDelete ? [commonBulkActions.delete(handleBulkDelete)] : []),
    ...(onBulkDownloadRecordings ? [{
      id: 'download-recordings',
      label: 'Download Recordings',
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: handleBulkDownloadRecordings,
    }] : []),
    ...(onBulkMarkReviewed ? [{
      id: 'mark-reviewed',
      label: 'Mark Reviewed',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: handleBulkMarkReviewed,
    }] : []),
  ];

  const sortedCalls = [...calls].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortOrder === "asc" 
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }
    
    return 0;
  });

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return "—";
    const d = new Date(date);
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone Numbers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
                <TableCell className="animate-pulse bg-gray-200 h-4"></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">No calls found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <BulkActions
        selectedItems={Array.from(selectedCalls)}
        totalItems={calls.length}
        actions={bulkActions}
        onSelectionChange={handleSelectionChange}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        isLoading={loading}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedCalls.size === calls.length && calls.length > 0}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = selectedCalls.size > 0 && selectedCalls.size < calls.length;
                  }
                }}
                onCheckedChange={handleSelectAll}
                disabled={loading}
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("direction")}
            >
              Direction
              {sortField === "direction" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Phone Numbers</TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("status")}
            >
              Status
              {sortField === "status" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("durationSec")}
            >
              Duration
              {sortField === "durationSec" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort("startedAt")}
            >
              Start Time
              {sortField === "startedAt" && (
                <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
              )}
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCalls.map((call) => (
            <TableRow key={call.id}>
              <TableCell>
                <Checkbox
                  checked={selectedCalls.has(call.id)}
                  onCheckedChange={(checked) => handleCallSelect(call.id, !!checked)}
                  disabled={loading}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {call.direction === "INBOUND" ? (
                    <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  )}
                  <Badge variant={callDirectionColors[call.direction]}>
                    {callDirectionLabels[call.direction]}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                {call.contact ? (
                  <div>
                    <div className="font-medium">
                      {call.contact.firstName} {call.contact.lastName}
                    </div>
                    {call.contact.organization && (
                      <div className="text-sm text-muted-foreground">
                        {call.contact.organization}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-mono text-sm">
                    {call.direction === "INBOUND" ? "From" : "To"}: {call.toNumber}
                  </div>
                  <div className="font-mono text-sm text-muted-foreground">
                    {call.direction === "INBOUND" ? "To" : "From"}: {call.fromNumber}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={callStatusColors[call.status]}>
                  {callStatusLabels[call.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm">
                  {formatDuration(call.durationSec)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {formatDateTime(call.startedAt)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {call.recordingUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPlayRecording(call)}
                      className="h-8 w-8 p-0"
                      title="Play Recording"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(call)}
                    className="h-8 w-8 p-0"
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
