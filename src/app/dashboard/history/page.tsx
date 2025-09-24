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
import { useCalls } from "@/lib/hooks/use-calls";
import { Phone, BarChart3, Clock, Play } from "lucide-react";

export default function HistoryPage() {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [recordingPlayerOpen, setRecordingPlayerOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<{
    search?: string;
    direction?: CallDirection;
    status?: CallStatus;
    dateFrom?: string;
    dateTo?: string;
  }>({});

  const {
    calls,
    loading,
    error,
    searchCalls,
    getCall,
    controlCall,
  } = useCalls();

  const handleSearch = (params: {
    search?: string;
    direction?: CallDirection;
    status?: CallStatus;
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

  // Calculate basic statistics
  const totalCalls = calls.length;
  const completedCalls = calls.filter(call => call.status === "COMPLETED").length;
  const failedCalls = calls.filter(call => call.status === "FAILED").length;
  const missedCalls = calls.filter(call => call.status === "MISSED").length;
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
            View and manage your call history and recordings
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed/Missed</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCalls + missedCalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(averageDuration)}</div>
          </CardContent>
        </Card>
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
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <CallSearch
                onSearch={handleSearch}
                loading={loading}
              />
            </CardContent>
          </Card>

          {/* Calls Table */}
          <Card>
            <CardHeader>
              <CardTitle>Calls ({calls.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <CallsTable
                calls={calls}
                onPlayRecording={handlePlayRecording}
                onViewDetails={handleViewDetails}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Recordings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calls.filter(call => call.recordingUrl).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No recordings available.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {calls
                      .filter(call => call.recordingUrl)
                      .map((call) => (
                        <div key={call.id} className="border rounded-lg p-4">
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
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlayRecording(call)}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Play
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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


