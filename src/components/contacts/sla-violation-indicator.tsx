"use client";

import React, { useState, useEffect } from 'react';
import { ContactSLAStatus, SLAStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Info,
  ChevronDown,
  ChevronUp,
  Phone,
  MessageSquare
} from 'lucide-react';

interface SLAViolationIndicatorProps {
  slaStatus: ContactSLAStatus | undefined;
  contactId: string;
  onCall?: () => void;
  onMessage?: () => void;
}

export function SLAViolationIndicator({ 
  slaStatus, 
  contactId,
  onCall,
  onMessage
}: SLAViolationIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  // Update countdown timers
  useEffect(() => {
    if (!slaStatus) return;

    const updateTimers = () => {
      const timers: Record<string, string> = {};
      
      Object.values(slaStatus).forEach((sla) => {
        if (sla && typeof sla === 'object' && 'dueDate' in sla) {
          const dueDate = new Date(sla.dueDate);
          const now = new Date();
          const diffMs = dueDate.getTime() - now.getTime();
          
          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
              timers[sla.type] = `${hours}h ${minutes}m remaining`;
            } else {
              timers[sla.type] = `${minutes}m remaining`;
            }
          } else {
            const overdueMs = Math.abs(diffMs);
            const hours = Math.floor(overdueMs / (1000 * 60 * 60));
            const minutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
              timers[sla.type] = `OVERDUE by ${hours}h ${minutes}m`;
            } else {
              timers[sla.type] = `OVERDUE by ${minutes}m`;
            }
          }
        }
      });
      
      setTimeRemaining(timers);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [slaStatus]);

  if (!slaStatus) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
          <Info className="h-3 w-3 text-gray-400" />
        </div>
        <span className="text-xs text-gray-500">No SLA data</span>
      </div>
    );
  }

  const getSLAIcon = (sla: SLAStatus) => {
    switch (sla.status) {
      case 'violated':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'approaching':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'on_time':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      default:
        return <Info className="h-3 w-3 text-gray-400" />;
    }
  };

  const getSLAColor = (sla: SLAStatus) => {
    switch (sla.status) {
      case 'violated':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'approaching':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on_time':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSLAStatusLabel = (sla: SLAStatus) => {
    switch (sla.status) {
      case 'violated':
        return 'Violated';
      case 'approaching':
        return 'Approaching';
      case 'on_time':
        return 'On Time';
      default:
        return 'Unknown';
    }
  };

  const getSLATypeLabel = (type: string) => {
    switch (type) {
      case 'voicemail_callback':
        return 'Voicemail Callback';
      case 'text_response':
        return 'Text Response';
      case 'missed_call_followup':
        return 'Missed Call Follow-up';
      default:
        return type;
    }
  };

  const getOverallStatus = () => {
    if (slaStatus.hasViolations) return 'violated';
    if (slaStatus.hasApproaching) return 'approaching';
    return 'on_time';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-2">
      {/* Overall SLA Status */}
      <div className="flex items-center space-x-2">
        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
          overallStatus === 'violated' ? 'bg-red-100' :
          overallStatus === 'approaching' ? 'bg-yellow-100' :
          'bg-green-100'
        }`}>
          {overallStatus === 'violated' ? (
            <AlertTriangle className="h-3 w-3 text-red-500" />
          ) : overallStatus === 'approaching' ? (
            <Clock className="h-3 w-3 text-yellow-500" />
          ) : (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
        </div>
        <div className="flex flex-col">
          <Badge className={getSLAColor({ 
            type: 'overall', 
            status: overallStatus, 
            dueDate: new Date(), 
            isOverdue: overallStatus === 'violated' 
          })}>
            {overallStatus === 'violated' ? 'SLA Violated' :
             overallStatus === 'approaching' ? 'SLA Approaching' :
             'SLA On Time'}
          </Badge>
          {slaStatus.totalViolations > 0 && (
            <span className="text-xs text-red-600">
              {slaStatus.totalViolations} violation(s)
            </span>
          )}
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

      {/* Expanded SLA Details */}
      {isExpanded && (
        <Card className="ml-8">
          <CardContent className="p-3 space-y-3">
            <div className="space-y-2">
              <span className="text-sm font-medium">SLA Details</span>
              
              {/* Voicemail Callback */}
              {slaStatus.voicemailCallback && (
                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center space-x-2">
                    {getSLAIcon(slaStatus.voicemailCallback)}
                    <span className="text-sm font-medium">
                      {getSLATypeLabel(slaStatus.voicemailCallback.type)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSLAColor(slaStatus.voicemailCallback)}>
                      {getSLAStatusLabel(slaStatus.voicemailCallback)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {timeRemaining[slaStatus.voicemailCallback.type] || 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* Text Response */}
              {slaStatus.textResponse && (
                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center space-x-2">
                    {getSLAIcon(slaStatus.textResponse)}
                    <span className="text-sm font-medium">
                      {getSLATypeLabel(slaStatus.textResponse.type)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSLAColor(slaStatus.textResponse)}>
                      {getSLAStatusLabel(slaStatus.textResponse)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {timeRemaining[slaStatus.textResponse.type] || 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* Missed Call Follow-up */}
              {slaStatus.missedCallFollowup && (
                <div className="flex items-center justify-between p-2 rounded border">
                  <div className="flex items-center space-x-2">
                    {getSLAIcon(slaStatus.missedCallFollowup)}
                    <span className="text-sm font-medium">
                      {getSLATypeLabel(slaStatus.missedCallFollowup.type)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSLAColor(slaStatus.missedCallFollowup)}>
                      {getSLAStatusLabel(slaStatus.missedCallFollowup)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {timeRemaining[slaStatus.missedCallFollowup.type] || 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions for Violations */}
            {slaStatus.hasViolations && (
              <div className="pt-2 border-t">
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCall}
                    className="flex-1 h-8 text-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call Now
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onMessage}
                    className="flex-1 h-8 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Send Text
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}








