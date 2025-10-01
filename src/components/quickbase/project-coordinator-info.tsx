"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Phone, Mail, Users, Clock, User } from "lucide-react";
import { QBProjectCoordinator } from "@/types/quickbase";

interface ProjectCoordinatorInfoProps {
  customerId?: string;
  pcEmail?: string;
  pcId?: string;
  className?: string;
}

export function ProjectCoordinatorInfo({ customerId, pcEmail, pcId, className }: ProjectCoordinatorInfoProps) {
  const [projectCoordinator, setProjectCoordinator] = useState<QBProjectCoordinator | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId || pcEmail || pcId) {
      fetchProjectCoordinator();
    }
  }, [customerId, pcEmail, pcId]);

  const fetchProjectCoordinator = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (customerId) params.append("customerId", customerId);
      if (pcEmail) params.append("email", pcEmail);
      if (pcId) params.append("pcId", pcId);

      const response = await fetch(`/api/quickbase/project-coordinators?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project coordinator data");
      }

      if (data.success && data.data) {
        setProjectCoordinator(data.data);
      } else {
        setError("Project Coordinator not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project coordinator data");
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available": return "default";
      case "busy": return "secondary";
      case "offline": return "destructive";
      default: return "secondary";
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload <= 5) return "default";
    if (workload <= 10) return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Project Coordinator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Project Coordinator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchProjectCoordinator}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!projectCoordinator) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Project Coordinator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No project coordinator assigned</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Project Coordinator
        </CardTitle>
        <CardDescription>
          Assigned project coordinator for this customer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PC Basic Info */}
        <div>
          <h3 className="font-semibold text-lg">{projectCoordinator.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            {projectCoordinator.email}
          </div>
          {projectCoordinator.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {projectCoordinator.phone}
            </div>
          )}
        </div>

        {/* Status and Workload */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={getAvailabilityColor(projectCoordinator.availability)}>
              {projectCoordinator.availability}
            </Badge>
            <span className="text-sm text-muted-foreground">Status</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getWorkloadColor(projectCoordinator.workload)}>
              {projectCoordinator.workload}
            </Badge>
            <span className="text-sm text-muted-foreground">Customers</span>
          </div>
        </div>

        {/* Assigned Customers */}
        {projectCoordinator.assignedCustomers && projectCoordinator.assignedCustomers.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Customers ({projectCoordinator.assignedCustomers.length})
            </h4>
            <div className="space-y-1">
              {projectCoordinator.assignedCustomers.slice(0, 5).map((customerId) => (
                <div key={customerId} className="text-sm text-muted-foreground">
                  Customer ID: {customerId}
                </div>
              ))}
              {projectCoordinator.assignedCustomers.length > 5 && (
                <div className="text-sm text-muted-foreground">
                  +{projectCoordinator.assignedCustomers.length - 5} more customers
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full">
            <Phone className="h-4 w-4 mr-2" />
            Call PC
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            Email PC
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Users className="h-4 w-4 mr-2" />
            View All Customers
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
