"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { QBIframeConfig } from "@/types/quickbase";

interface QuickbaseIframeProps {
  customerId?: string;
  recordId?: string;
  tableId?: string;
  viewId?: string;
  embed?: boolean;
  width?: string;
  height?: string;
  className?: string;
}

export function QuickbaseIframe({ 
  customerId, 
  recordId, 
  tableId, 
  viewId, 
  embed = true,
  width = "100%",
  height = "600px",
  className 
}: QuickbaseIframeProps) {
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    generateIframeUrl();
  }, [customerId, recordId, tableId, viewId, embed]);

  const generateIframeUrl = () => {
    try {
      const realmHost = process.env.NEXT_PUBLIC_QUICKBASE_REALM_HOST;
      if (!realmHost) {
        throw new Error("Quickbase realm host not configured");
      }

      let baseUrl = `https://${realmHost}`;
      
      if (recordId && tableId) {
        // Direct record view
        baseUrl += `/db/${tableId}?a=dr&rid=${recordId}`;
      } else if (customerId && tableId) {
        // Customer record view
        baseUrl += `/db/${tableId}?a=dr&rid=${customerId}`;
      } else if (tableId) {
        // Table view
        baseUrl += `/db/${tableId}`;
        if (viewId) {
          baseUrl += `&a=q&qid=${viewId}`;
        }
      } else {
        throw new Error("Table ID is required for Quickbase iframe");
      }

      // Add embed parameters if needed
      if (embed) {
        baseUrl += "&embed=1";
      }

      setIframeUrl(baseUrl);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate iframe URL");
    }
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setLoading(false);
  };

  const handleIframeError = () => {
    setError("Failed to load Quickbase iframe");
    setLoading(false);
  };

  const openInNewTab = () => {
    if (iframeUrl) {
      window.open(iframeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const refreshIframe = () => {
    setLoading(true);
    setIframeLoaded(false);
    generateIframeUrl();
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Quickbase Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshIframe}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            {iframeUrl && (
              <Button variant="outline" size="sm" onClick={openInNewTab}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Quickbase Record
        </CardTitle>
        <CardDescription>
          Direct access to customer record in Quickbase
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}

        {/* Iframe Container */}
        <div className="relative">
          {iframeUrl && (
            <iframe
              src={iframeUrl}
              width={width}
              height={height}
              frameBorder="0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              className={`border rounded-md ${!iframeLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
              title="Quickbase Customer Record"
              data-testid="quickbase-iframe"
            />
          )}

          {/* Overlay while loading */}
          {!iframeLoaded && iframeUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading Quickbase record...</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {customerId ? `Customer ID: ${customerId}` : recordId ? `Record ID: ${recordId}` : 'Table View'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshIframe}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
