"use client";
import * as React from "react";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { LayoutProvider } from "@/components/ui/adaptive-layout";
import { useSession } from "next-auth/react";
import { LoadingState } from "@/components/ui/loading-state";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { RealTimeNotificationSystem } from "@/components/ui/real-time-notification-system";
import { Button } from "@/components/ui/button";
import { Bell, Activity, Wifi, WifiOff } from "lucide-react";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const [systemStatus, setSystemStatus] = React.useState<'healthy' | 'degraded' | 'down'>('healthy');
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  // Simulate system health monitoring
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // In a real app, this would check actual system health
      const health = Math.random() > 0.1 ? 'healthy' : Math.random() > 0.5 ? 'degraded' : 'down';
      setSystemStatus(health);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="main-layout">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <div>
                <span className="text-lg font-bold tracking-wide">KIN Communications Hub</span>
                <div className="text-xs text-muted-foreground">Professional Communication Platform</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* System Status */}
            <div className="flex items-center gap-2">
              <StatusIndicator
                variant="badge"
                status={systemStatus === 'healthy' ? 'success' : systemStatus === 'degraded' ? 'warning' : 'error'}
                label={systemStatus === 'healthy' ? 'Healthy' : systemStatus === 'degraded' ? 'Degraded' : 'Down'}
                description={`Last update: ${lastUpdate.toLocaleTimeString()}`}
              />
            </div>
            
            {/* Global Notifications */}
            <RealTimeNotificationSystem />
            
            {/* Version */}
            <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              v0.1.0
            </div>
          </div>
        </div>
      </header>
      
      <main className="w-full px-8 py-6" data-testid="main-content">
        <DashboardNav />
        <div className="py-6" data-testid="page-content">{children}</div>
      </main>
    </div>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'employee';

  return (
    <LayoutProvider userRole={userRole}>
      <MainLayoutContent>{children}</MainLayoutContent>
    </LayoutProvider>
  );
}


