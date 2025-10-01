'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Eye, 
  Clock, 
  TrendingUp,
  User,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { VoicemailStats as VoicemailStatsType, VoicemailPriority } from '@/types/index';
import { cn } from '@/lib/utils';

interface VoicemailStatsProps {
  stats: VoicemailStatsType;
  loading?: boolean;
  className?: string;
}

const priorityColors: Record<VoicemailPriority, string> = {
  LOW: 'bg-green-100 text-green-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const priorityIcons: Record<VoicemailPriority, React.ReactNode> = {
  LOW: <CheckCircle className="h-4 w-4" />,
  NORMAL: <MessageSquare className="h-4 w-4" />,
  HIGH: <TrendingUp className="h-4 w-4" />,
  URGENT: <AlertTriangle className="h-4 w-4" />,
};

export function VoicemailStats({ stats, loading = false, className }: VoicemailStatsProps) {
  if (loading) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Voicemails</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayCount || 0} received today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.unread || 0}</div>
            <p className="text-xs text-muted-foreground">
              {(stats.total || 0) > 0 ? Math.round(((stats.unread || 0) / (stats.total || 0)) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats.averageResponseTime || 0) > 0 ? `${stats.averageResponseTime}m` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Time to first read
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Voicemails received
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Priority Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byPriority || {}).map(([priority, count]) => (
              <div key={priority} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Badge className={cn(priorityColors[priority as VoicemailPriority], 'gap-1')}>
                    {priorityIcons[priority as VoicemailPriority]}
                    {priority}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">
                  {(stats.total || 0) > 0 ? Math.round(((count || 0) / (stats.total || 0)) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Assignment Stats */}
      {(stats.byUser || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats.byUser || []).map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{user.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.unreadCount} unread of {user.count} total
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{user.count}</div>
                    <div className="text-xs text-muted-foreground">assigned</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">High Priority</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {(stats.byPriority?.HIGH || 0) + (stats.byPriority?.URGENT || 0)}
              </div>
              <div className="text-sm text-blue-700">
                Need immediate attention
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Response Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {(stats.total || 0) > 0 ? Math.round((((stats.total || 0) - (stats.unread || 0)) / (stats.total || 0)) * 100) : 0}%
              </div>
              <div className="text-sm text-green-700">
                Voicemails processed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
