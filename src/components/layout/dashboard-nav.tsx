"use client";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/components/socket-provider";
import { useSession } from "next-auth/react";
import { PresenceIndicator } from "@/components/ui/presence-indicator";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { RealTimeNotificationSystem } from "@/components/ui/real-time-notification-system";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Settings, LogOut, User, Home, Shield } from "lucide-react";

const tabs = [
  { value: "home", label: "Home", href: "/dashboard", roles: ["manager", "employee", "admin"], icon: Home },
  { value: "queue", label: "Queue", href: "/dashboard/queue", roles: ["manager", "employee", "admin"] },
  { value: "messages", label: "Messages", href: "/dashboard/messages", roles: ["manager", "employee", "admin"] },
  { value: "contacts", label: "Contacts", href: "/dashboard/contacts", roles: ["manager", "employee", "admin"] },
  { value: "analytics", label: "Analytics", href: "/dashboard/analytics", roles: ["manager", "admin"] },
  { value: "history", label: "History", href: "/dashboard/history", roles: ["manager", "employee", "admin"] },
  { value: "admin", label: "Admin", href: "/dashboard/admin", roles: ["admin"], icon: Shield },
  { value: "settings", label: "Settings", href: "/dashboard/settings", roles: ["manager", "employee", "admin"] }
];

export function DashboardNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [queueDepth, setQueueDepth] = React.useState(0);
  const [slaViolations, setSlaViolations] = React.useState(0);
  const { isConnected } = useSocket();
  const { data: session } = useSession();

  const current = React.useMemo(() => {
    // Exact match for home
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return "home";
    }
    const found = tabs.find(t => pathname?.startsWith(`/dashboard/${t.value}`));
    return found?.value ?? "home";
  }, [pathname]);

  // Get user role for role-based tab visibility
  const userRole = React.useMemo(() => {
    return (session?.user as any)?.role || 'employee';
  }, [session]);

  // Filter tabs based on user role
  const visibleTabs = React.useMemo(() => {
    return tabs.filter(tab => tab.roles.includes(userRole));
  }, [userRole]);

  // Fetch unread message count
  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/conversations?unreadOnly=true&limit=1');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Real-time socket events for queue statistics
  React.useEffect(() => {
    if (!isConnected) return;

    const handleQueueUpdate = (data: any) => {
      setQueueDepth(data.queueDepth || 0);
    };

    const handleSlaViolation = (data: any) => {
      setSlaViolations(data.count || 0);
    };

    const handleNewVoicemail = () => {
      setQueueDepth(prev => prev + 1);
    };

    const handleNewMessage = () => {
      setUnreadCount(prev => prev + 1);
    };

    // Note: Socket event handling would be implemented here
    // when the socket provider is properly connected

    return () => {
      // Cleanup would be implemented here
    };
  }, [isConnected]);

  return (
    <div className="space-y-4" data-testid="dashboard-nav">
      {/* Enhanced Connection Status and User Presence */}
      <ProfessionalCard variant="elevated" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
              <StatusIndicator
                variant="badge"
                status={isConnected ? "success" : "error"}
                label={isConnected ? "Connected" : "Disconnected"}
                description={isConnected ? "Real-time updates active" : "Connection lost - reconnecting..."}
              />
            </div>
            
            {session?.user && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{session.user.name}</span>
                <PresenceIndicator 
                  userId={(session.user as any).id || 'current-user'}
                  userName={session.user.name || session.user.email || 'User'}
                  size="sm"
                  showTooltip={true}
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <RealTimeNotificationSystem />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Settings</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </ProfessionalCard>

      <Tabs value={current} onValueChange={val => {
        if (val === "home") {
          router.push("/dashboard");
        } else {
          router.push(`/dashboard/${val}`);
        }
      }}>
        <TabsList className="w-full justify-start gap-1" data-testid="navigation">
          {visibleTabs.map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="px-4 relative"
              data-testid={`nav-${t.value}`}
            >
              {t.icon && <t.icon className="h-4 w-4 mr-2" />}
              {t.label}
              {t.value === "messages" && unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="unread-count"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
              {t.value === "queue" && queueDepth > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="queue-depth"
                >
                  {queueDepth > 99 ? "99+" : queueDepth}
                </Badge>
              )}
              {t.value === "analytics" && slaViolations > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="sla-violations"
                >
                  {slaViolations > 99 ? "99+" : slaViolations}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}


