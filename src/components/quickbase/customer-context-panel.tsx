"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Phone, Mail, MapPin, User, Calendar, Clock } from "lucide-react";
import { QBCustomer, QBProjectCoordinator, QBProject } from "@/types/quickbase";

interface CustomerContextPanelProps {
  phoneNumber?: string;
  customerId?: string;
  className?: string;
}

export function CustomerContextPanel({ phoneNumber, customerId, className }: CustomerContextPanelProps) {
  const [customer, setCustomer] = useState<QBCustomer | null>(null);
  const [projectCoordinator, setProjectCoordinator] = useState<QBProjectCoordinator | null>(null);
  const [project, setProject] = useState<QBProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phoneNumber || customerId) {
      fetchCustomerData();
    }
  }, [phoneNumber, customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (phoneNumber) params.append("phone", phoneNumber);
      if (customerId) params.append("customerId", customerId);

      const response = await fetch(`/api/quickbase/customers?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch customer data");
      }

      if (data.success && data.data.found) {
        setCustomer(data.data.customer);
        setProjectCoordinator(data.data.projectCoordinator);
        setProject(data.data.project);
      } else {
        setError("Customer not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer data");
    } finally {
      setLoading(false);
    }
  };

  const getProjectStatusColor = (status?: string) => {
    if (!status) return "secondary";
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("complete") || statusLower.includes("done")) return "default";
    if (statusLower.includes("progress") || statusLower.includes("active")) return "default";
    if (statusLower.includes("pending") || statusLower.includes("wait")) return "secondary";
    if (statusLower.includes("cancel") || statusLower.includes("hold")) return "destructive";
    
    return "secondary";
  };

  const getPCAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case "available": return "default";
      case "busy": return "secondary";
      case "offline": return "destructive";
      default: return "secondary";
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Context
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
            Customer Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchCustomerData}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No customer data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="customer-context-panel">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg" data-testid="customer-info">{customer.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {customer.phone}
            </div>
            {customer.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {customer.email}
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {customer.address}
              </div>
            )}
          </div>
          
          {customer.lastContact && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              Last Contact: {new Date(customer.lastContact).toLocaleDateString()}
            </div>
          )}
          
          {customer.communicationCount && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Communications: {customer.communicationCount}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Coordinator */}
      {projectCoordinator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Project Coordinator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-semibold" data-testid="project-coordinator">{projectCoordinator.name}</h3>
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
            
            <div className="flex items-center gap-2">
              <Badge variant={getPCAvailabilityColor(projectCoordinator.availability)}>
                {projectCoordinator.availability}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Workload: {projectCoordinator.workload} customers
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Status */}
      {project && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={getProjectStatusColor(project.status)} data-testid="project-status">
                {project.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Stage: {project.stage}
              </span>
            </div>
            
            {project.startDate && (
              <div className="text-sm">
                <strong>Start Date:</strong> {new Date(project.startDate).toLocaleDateString()}
              </div>
            )}
            
            {project.endDate && (
              <div className="text-sm">
                <strong>End Date:</strong> {new Date(project.endDate).toLocaleDateString()}
              </div>
            )}
            
            {project.milestones && project.milestones.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Milestones</h4>
                <div className="space-y-1">
                  {project.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-2 text-sm">
                      <Badge 
                        variant={
                          milestone.status === "completed" ? "default" :
                          milestone.status === "in_progress" ? "secondary" : "outline"
                        }
                        className="text-xs"
                      >
                        {milestone.status}
                      </Badge>
                      <span>{milestone.name}</span>
                      {milestone.dueDate && (
                        <span className="text-muted-foreground">
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full">
            <Phone className="h-4 w-4 mr-2" />
            Call Customer
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            Send SMS
          </Button>
          {projectCoordinator && (
            <Button variant="outline" size="sm" className="w-full">
              <User className="h-4 w-4 mr-2" />
              Contact PC
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
