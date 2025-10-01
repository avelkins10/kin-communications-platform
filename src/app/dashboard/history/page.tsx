"use client";

import { useState } from "react";
import { Call, CallDirection, CallStatus } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CallsTable } from "@/components/calls/calls-table";
import { CallSearch } from "@/components/calls/call-search";
import { RecordingPlayer } from "@/components/calls/recording-player";
import { CallControls } from "@/components/calls/call-controls";
import { CommunicationHistory } from "@/components/quickbase/communication-history";
import { InteractiveTable } from "@/components/ui/interactive-table";
import { EnhancedSearch } from "@/components/ui/enhanced-search";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { LoadingState } from "@/components/ui/loading-state";
import { ActionButton } from "@/components/ui/action-button";
import { useCalls } from "@/lib/hooks/use-calls";
import { useProjectStatus } from "@/lib/hooks/use-quickbase";
import { useProfessionalInteractions } from "@/lib/hooks/use-professional-interactions";
import { Phone, BarChart3, Clock, Play, Database, Download, Filter, User, Calendar, TrendingUp } from "lucide-react";

export default function HistoryPage() {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [recordingPlayerOpen, setRecordingPlayerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<{
    search?: string;
    direction?: CallDirection;
    status?: CallStatus;
    assigned?: 'assigned' | 'unassigned';
    dateFrom?: string;
    dateTo?: string;
  }>({});

  const { useButtonState, useNotification } = useProfessionalInteractions();
  const exportButtonState = useButtonState();
  const notification = useNotification();

  const {
    calls,
    loading,
    error,
    searchCalls,
    getCall,
    controlCall,
  } = useCalls();

  // Get project status for selected customer
  const { project, loading: projectLoading } = useProjectStatus(selectedCustomerId || "");

  const handleSearch = (params: {
    search?: string;
    direction?: CallDirection;
    status?: CallStatus;
    assigned?: 'assigned' | 'unassigned';
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setSearchParams(params);
    searchCalls(params);
  };

  const handlePlayRecording = async (call: Call) => {
    try {
      const fullCall = await getCall(call.id);
      setSelectedCall(fullCall);
      setRecordingPlayerOpen(true);
    } catch (error) {
      console.error("Failed to load call details:", error);
    }
  };

  const handleViewDetails = async (call: Call) => {
    try {
      const fullCall = await getCall(call.id);
      setSelectedCall(fullCall);
      setRecordingPlayerOpen(true);
    } catch (error) {
      console.error("Failed to load call details:", error);
    }
  };

  const handleCallControl = async (call: Call, action: any) => {
    try {
      await controlCall(call.id, action);
    } catch (error) {
      console.error("Failed to control call:", error);
    }
  };

  const handleExportHistory = async () => {
    await exportButtonState.executeWithState(async () => {
      // TODO: Implement export functionality for compliance reporting
      console.log("Exporting communication history...");
      notification.showSuccess("Export completed successfully");
    });
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  // Calculate basic statistics
  const totalCalls = calls.length;
  const completedCalls = calls.filter(call => call.status === "COMPLETED").length;
  const failedCalls = calls.filter(call => call.status === "FAILED").length;
  const missedCalls = calls.filter(call => call.status === "MISSED").length;
  const unassignedCalls = calls.filter(call => !call.user).length;
  const totalDuration = calls.reduce((sum, call) => sum + (call.durationSec || 0), 0);
  const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call History</h1>
          <p className="text-muted-foreground">
            View and manage your call history, recordings, and Quickbase communications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton
            variant="secondary"
            onClick={handleExportHistory}
            tooltip="Export communication history for compliance reporting"
            keyboardShortcut="E"
          >
            <Download className="h-4 w-4 mr-2" />
            Export History
          </ActionButton>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <ProfessionalCard variant="default" status="active">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="default" status="active">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCalls}</div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="default" status="active">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed/Missed</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCalls + missedCalls}</div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="default" status="active">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(averageDuration)}</div>
          </CardContent>
        </ProfessionalCard>

        <ProfessionalCard variant="default" status="active">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unassignedCalls}</div>
          </CardContent>
        </ProfessionalCard>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Call History
          </TabsTrigger>
          <TabsTrigger value="recordings" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Recordings
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Quickbase Communications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {/* Enhanced Search and Filters */}
          <div className="p-4 bg-background border rounded-lg">
            <EnhancedSearch
              placeholder="Search call history..."
              onSearch={(query, filters) => {
                handleSearch({
                  search: query,
                  direction: filters.direction as CallDirection,
                  status: filters.status as CallStatus,
                  assigned: filters.assigned as 'assigned' | 'unassigned',
                  dateFrom: filters.dateFrom,
                  dateTo: filters.dateTo,
                });
              }}
              filters={[
                {
                  key: "direction",
                  label: "Direction",
                  type: "select",
                  options: [
                    { value: "INBOUND", label: "Inbound" },
                    { value: "OUTBOUND", label: "Outbound" },
                  ],
                },
                {
                  key: "status",
                  label: "Status",
                  type: "select",
                  options: [
                    { value: "COMPLETED", label: "Completed" },
                    { value: "FAILED", label: "Failed" },
                    { value: "MISSED", label: "Missed" },
                    { value: "RINGING", label: "Ringing" },
                    { value: "IN_PROGRESS", label: "In Progress" },
                  ],
                },
                {
                  key: "assigned",
                  label: "Assignment",
                  type: "select",
                  options: [
                    { value: "assigned", label: "Assigned" },
                    { value: "unassigned", label: "Unassigned" },
                  ],
                },
                {
                  key: "dateFrom",
                  label: "From Date",
                  type: "date",
                },
                {
                  key: "dateTo",
                  label: "To Date",
                  type: "date",
                },
              ]}
              presets={[
                {
                  id: "today",
                  name: "Today's Calls",
                  query: "",
                  filters: { dateFrom: new Date().toISOString().split('T')[0] },
                  isDefault: true,
                },
                {
                  id: "failed",
                  name: "Failed Calls",
                  query: "",
                  filters: { status: "FAILED" },
                },
                {
                  id: "missed",
                  name: "Missed Calls",
                  query: "",
                  filters: { status: "MISSED" },
                },
                {
                  id: "unassigned",
                  name: "Unassigned Calls",
                  query: "",
                  filters: { assigned: "unassigned" },
                },
              ]}
              context="calls"
              showFilters={true}
              showPresets={true}
              showSuggestions={true}
              showHistory={true}
            />
          </div>

          {/* Enhanced Calls Table */}
          <div className="bg-background border rounded-lg">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Call History ({calls.length})</h3>
            </div>
            <div className="p-4">
              <InteractiveTable
                data={calls}
                columns={[
                  {
                    key: "contact",
                    title: "Contact",
                    sortable: true,
                    render: (_, call) => 
                      call.contact ? 
                        `${call.contact.firstName} ${call.contact.lastName}` : 
                        <span className="text-muted-foreground">Unknown Contact</span>
                  },
                  {
                    key: "assignedTo",
                    title: "Assigned To",
                    sortable: true,
                    render: (_, call) => (
                      <div className="flex items-center gap-2">
                        {call.user ? (
                          <span className="text-sm">{call.user.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                        {!call.user && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            !
                          </span>
                        )}
                      </div>
                    )
                  },
                  {
                    key: "phone",
                    title: "Phone",
                    sortable: true,
                    render: (_, call) => call.contact?.phone || call.phoneNumber || "N/A"
                  },
                  {
                    key: "direction",
                    title: "Direction",
                    sortable: true,
                    render: (_, call) => (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        call.direction === "INBOUND" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {call.direction}
                      </span>
                    )
                  },
                  {
                    key: "status",
                    title: "Status",
                    sortable: true,
                    render: (_, call) => (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        call.status === "COMPLETED" 
                          ? "bg-green-100 text-green-800"
                          : call.status === "FAILED" || call.status === "MISSED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {call.status}
                      </span>
                    )
                  },
                  {
                    key: "duration",
                    title: "Duration",
                    sortable: true,
                    render: (_, call) => formatDuration(call.durationSec || 0)
                  },
                  {
                    key: "createdAt",
                    title: "Date/Time",
                    sortable: true,
                    render: (_, call) => new Date(call.createdAt).toLocaleString()
                  },
                  {
                    key: "actions",
                    title: "Actions",
                    render: (_, call) => (
                      <div className="flex items-center space-x-2">
                        {call.recordingUrl && (
                          <ActionButton
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePlayRecording(call)}
                            tooltip="Play recording"
                          >
                            <Play className="h-3 w-3" />
                          </ActionButton>
                        )}
                        <ActionButton
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(call)}
                          tooltip="View details"
                        >
                          <User className="h-3 w-3" />
                        </ActionButton>
                      </div>
                    )
                  }
                ]}
                loading={loading}
                selectable={false}
                searchable={false}
                emptyMessage="No calls found"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          <ProfessionalCard variant="default" status="active">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Call Recordings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calls.filter(call => call.recordingUrl).length === 0 ? (
                  <div className="text-center py-8">
                    <Play className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">No recordings available.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {calls
                      .filter(call => call.recordingUrl)
                      .map((call) => (
                        <ProfessionalCard key={call.id} variant="outline" status="active" className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">
                                {call.contact ? 
                                  `${call.contact.firstName} ${call.contact.lastName}` : 
                                  "Unknown Contact"
                                }
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {call.direction} • {call.status} • {new Date(call.createdAt).toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Duration: {formatDuration(call.durationSec || 0)}
                              </p>
                            </div>
                            <ActionButton
                              variant="primary"
                              size="sm"
                              onClick={() => handlePlayRecording(call)}
                              tooltip="Play recording"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Play
                            </ActionButton>
                          </div>
                        </ProfessionalCard>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          {/* Customer Selection */}
          <ProfessionalCard variant="default" status="active">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Select Customer</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md"
                      value={selectedCustomerId || ""}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                    >
                      <option value="">Choose a customer...</option>
                      {calls
                        .filter(call => call.contact?.quickbaseId)
                        .map((call) => (
                          <option key={call.contact?.quickbaseId} value={call.contact?.quickbaseId}>
                            {call.contact ? 
                              `${call.contact.firstName} ${call.contact.lastName} (${call.contact.phone})` : 
                              "Unknown Contact"
                            }
                          </option>
                        ))}
                    </select>
                  </div>
                  <ActionButton
                    variant="outline"
                    onClick={() => setSelectedCustomerId(null)}
                    disabled={!selectedCustomerId}
                    tooltip="Clear customer filter"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Clear Filter
                  </ActionButton>
                </div>
              </div>
            </CardContent>
          </ProfessionalCard>

          {/* Communication History */}
          {selectedCustomerId ? (
            <ProfessionalCard variant="default" status="active">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Communication History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CommunicationHistory
                  customerId={selectedCustomerId}
                  onExport={handleExportHistory}
                />
              </CardContent>
            </ProfessionalCard>
          ) : (
            <ProfessionalCard variant="default" status="active">
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a customer to view their communication history from Quickbase</p>
                </div>
              </CardContent>
            </ProfessionalCard>
          )}
        </TabsContent>
      </Tabs>

      {/* Recording Player Modal */}
      {recordingPlayerOpen && selectedCall && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setRecordingPlayerOpen(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <RecordingPlayer
              call={selectedCall}
              onClose={() => setRecordingPlayerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Call Controls for Active Calls */}
      {selectedCall && ['RINGING', 'IN_PROGRESS'].includes(selectedCall.status) && (
        <div className="fixed bottom-4 right-4 z-40">
          <CallControls
            call={selectedCall}
            onMute={(call) => handleCallControl(call, { action: "mute" })}
            onUnmute={(call) => handleCallControl(call, { action: "unmute" })}
            onHold={(call) => handleCallControl(call, { action: "hold" })}
            onUnhold={(call) => handleCallControl(call, { action: "unhold" })}
            onHangup={(call) => handleCallControl(call, { action: "hangup" })}
            onTransfer={(call, destination) => handleCallControl(call, { action: "transfer", to: destination })}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}


