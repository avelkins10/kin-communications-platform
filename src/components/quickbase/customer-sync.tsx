"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, RefreshCw, Download, Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import { QBSyncResponse, QBSyncConflict } from "@/types/quickbase";

interface CustomerSyncProps {
  className?: string;
}

interface SyncStatus {
  isRunning: boolean;
  progress: number;
  currentOperation: string;
  lastSync?: Date;
  lastResult?: QBSyncResponse;
  isAvailable?: boolean;
}

export function CustomerSync({ className }: CustomerSyncProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isRunning: false,
    progress: 0,
    currentOperation: "",
    isAvailable: undefined
  });
  const [syncType, setSyncType] = useState<"full" | "incremental">("incremental");
  const [forceSync, setForceSync] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check sync availability on component mount
  React.useEffect(() => {
    checkSyncAvailability().then(isAvailable => {
      setSyncStatus(prev => ({ ...prev, isAvailable }));
    });
  }, []);

  const checkSyncAvailability = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/quickbase/sync", {
        method: "HEAD"
      });
      return response.status !== 501;
    } catch (error) {
      return false;
    }
  };

  const startSync = async () => {
    // Check if sync is available
    const isAvailable = await checkSyncAvailability();
    if (!isAvailable) {
      setSyncStatus({
        isRunning: false,
        progress: 0,
        currentOperation: "Sync not available"
      });
      return;
    }

    setSyncStatus({
      isRunning: true,
      progress: 0,
      currentOperation: "Initializing sync..."
    });

    try {
      const response = await fetch("/api/quickbase/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: syncType,
          force: forceSync,
          customerIds: selectedCustomers.length > 0 ? selectedCustomers : undefined
        })
      });

      if (response.status === 501) {
        setSyncStatus({
          isRunning: false,
          progress: 0,
          currentOperation: "Sync not implemented"
        });
        return;
      }

      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }

      const result: QBSyncResponse = await response.json();

      setSyncStatus({
        isRunning: false,
        progress: 100,
        currentOperation: "Sync completed",
        lastSync: new Date(),
        lastResult: result
      });

      setIsDialogOpen(false);
    } catch (error) {
      setSyncStatus({
        isRunning: false,
        progress: 0,
        currentOperation: "Sync failed"
      });
    }
  };

  const getSyncStatusColor = () => {
    if (syncStatus.isRunning) return "secondary";
    if (syncStatus.lastResult) {
      return syncStatus.lastResult.errors > 0 ? "destructive" : "default";
    }
    return "secondary";
  };

  const getSyncStatusText = () => {
    if (syncStatus.isRunning) return "Syncing...";
    if (syncStatus.lastResult) {
      return `${syncStatus.lastResult.synced} synced, ${syncStatus.lastResult.errors} errors`;
    }
    return "Not synced";
  };

  const getConflictResolutionIcon = (resolution: string) => {
    switch (resolution) {
      case "local":
        return <Download className="h-4 w-4 text-blue-500" />;
      case "quickbase":
        return <Upload className="h-4 w-4 text-green-500" />;
      case "manual":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Customer Sync
        </CardTitle>
        <CardDescription>
          {syncStatus.isAvailable === false 
            ? "Customer sync feature is coming soon" 
            : "Synchronize customer data between local database and Quickbase"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Not Available Notice */}
        {syncStatus.isAvailable === false && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Customer sync feature is not yet implemented. This feature is coming soon.
            </span>
          </div>
        )}

        {/* Sync Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sync Status</span>
            <Badge variant={getSyncStatusColor()}>
              {getSyncStatusText()}
            </Badge>
          </div>
          
          {syncStatus.lastSync && (
            <div className="text-sm text-muted-foreground">
              Last sync: {syncStatus.lastSync.toLocaleString()}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {syncStatus.isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{syncStatus.currentOperation}</span>
              <span>{syncStatus.progress}%</span>
            </div>
            <Progress value={syncStatus.progress} className="w-full" />
          </div>
        )}

        {/* Last Sync Results */}
        {syncStatus.lastResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{syncStatus.lastResult.synced}</div>
                <div className="text-sm text-muted-foreground">Synced</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{syncStatus.lastResult.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{syncStatus.lastResult.conflicts.length}</div>
                <div className="text-sm text-muted-foreground">Conflicts</div>
              </div>
            </div>

            {/* Conflicts */}
            {syncStatus.lastResult.conflicts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Conflicts Resolved</h4>
                <div className="space-y-1">
                  {syncStatus.lastResult.conflicts.map((conflict, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                      {getConflictResolutionIcon(conflict.resolution)}
                      <span className="font-medium">{conflict.field}</span>
                      <span className="text-muted-foreground">
                        {conflict.resolution === "local" ? "Kept local value" :
                         conflict.resolution === "quickbase" ? "Used Quickbase value" :
                         "Manual resolution required"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sync Actions */}
        <div className="space-y-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full" 
                disabled={syncStatus.isRunning || syncStatus.isAvailable === false}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {syncStatus.isAvailable === false ? "Coming Soon" : "Start Sync"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Sync Configuration</DialogTitle>
                <DialogDescription>
                  Configure the customer data synchronization settings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Sync Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sync Type</label>
                  <Select value={syncType} onValueChange={(value: "full" | "incremental") => setSyncType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incremental">Incremental Sync</SelectItem>
                      <SelectItem value="full">Full Sync</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {syncType === "incremental" 
                      ? "Only sync changes since last sync" 
                      : "Sync all customer data from Quickbase"}
                  </p>
                </div>

                {/* Force Sync */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="force-sync" 
                    checked={forceSync}
                    onCheckedChange={(checked) => setForceSync(checked as boolean)}
                  />
                  <label htmlFor="force-sync" className="text-sm font-medium">
                    Force sync (ignore timestamps)
                  </label>
                </div>

                {/* Sync Actions */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={startSync}
                    disabled={syncStatus.isRunning}
                    className="flex-1"
                  >
                    {syncStatus.isRunning ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Start Sync
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={syncStatus.isRunning}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            disabled={syncStatus.isRunning || syncStatus.isAvailable === false}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Sync Log
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
