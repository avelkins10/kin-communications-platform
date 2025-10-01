"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Phone, 
  MessageSquare, 
  Mail, 
  User, 
  Building,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

interface ProjectCoordinator {
  id: string;
  name?: string | null;
  email: string;
  department?: string | null;
}

interface ProjectCoordinatorDisplayProps {
  projectCoordinator: ProjectCoordinator | null;
  customerId: string;
  onCall?: (pc: ProjectCoordinator) => void;
  onMessage?: (pc: ProjectCoordinator) => void;
  onEmail?: (pc: ProjectCoordinator) => void;
  onViewDetails?: (pc: ProjectCoordinator) => void;
}

export function ProjectCoordinatorDisplay({ 
  projectCoordinator, 
  customerId,
  onCall,
  onMessage,
  onEmail,
  onViewDetails
}: ProjectCoordinatorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customerCount, setCustomerCount] = useState<number | null>(null);

  // Fetch customer count for this PC
  React.useEffect(() => {
    if (projectCoordinator) {
      fetchCustomerCount(projectCoordinator.id);
    }
  }, [projectCoordinator]);

  const fetchCustomerCount = async (pcId: string) => {
    try {
      const response = await fetch(`/api/contacts?projectCoordinatorId=${pcId}&limit=1`);
      if (response.ok) {
        const data = await response.json();
        setCustomerCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching customer count:', error);
    }
  };

  if (!projectCoordinator) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">No PC assigned</span>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs"
            onClick={() => {/* Open PC assignment modal */}}
          >
            Assign PC
          </Button>
        </div>
      </div>
    );
  }

  const getWorkloadStatus = (count: number | null) => {
    if (count === null) return 'unknown';
    if (count <= 5) return 'light';
    if (count <= 15) return 'moderate';
    return 'heavy';
  };

  const getWorkloadColor = (status: string) => {
    switch (status) {
      case 'light':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'heavy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkloadLabel = (status: string) => {
    switch (status) {
      case 'light':
        return 'Light';
      case 'moderate':
        return 'Moderate';
      case 'heavy':
        return 'Heavy';
      default:
        return 'Unknown';
    }
  };

  const workloadStatus = getWorkloadStatus(customerCount);

  return (
    <div className="space-y-2">
      {/* Main PC Display */}
      <div className="flex items-center space-x-3">
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm truncate">
              {projectCoordinator.name || 'Unknown PC'}
            </span>
            <Badge className={getWorkloadColor(workloadStatus)}>
              {getWorkloadLabel(workloadStatus)}
            </Badge>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Building className="h-3 w-3" />
            <span>{projectCoordinator.department || 'No Department'}</span>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <Card className="ml-11">
          <CardContent className="p-3 space-y-3">
            {/* PC Information */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Project Coordinator Details</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails?.(projectCoordinator)}
                  className="h-6 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <div className="font-medium">{projectCoordinator.email}</div>
                </div>
                <div>
                  <span className="text-gray-500">Department:</span>
                  <div className="font-medium">{projectCoordinator.department || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Customer Count:</span>
                  <div className="font-medium">
                    {customerCount !== null ? `${customerCount} customers` : 'Loading...'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Workload:</span>
                  <div>
                    <Badge className={getWorkloadColor(workloadStatus)}>
                      {getWorkloadLabel(workloadStatus)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCall?.(projectCoordinator)}
                className="flex-1 h-8 text-xs"
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMessage?.(projectCoordinator)}
                className="flex-1 h-8 text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Text
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEmail?.(projectCoordinator)}
                className="flex-1 h-8 text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email
              </Button>
            </div>

            {/* PC Reassignment */}
            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {/* Open PC reassignment modal */}}
                className="w-full h-8 text-xs"
              >
                Reassign Project Coordinator
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}








