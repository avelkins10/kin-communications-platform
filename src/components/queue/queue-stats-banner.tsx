"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useQueue } from "@/lib/hooks/use-queue";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  MessageSquare,
  Voicemail,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  TrendingUp,
  TrendingDown
} from "lucide-react";

interface QueueStatsBannerProps {
  queueView: 'my' | 'team';
  userId?: string;
  className?: string;
}

export function QueueStatsBanner({ queueView, userId, className }: QueueStatsBannerProps) {
  const { items: queueData } = useQueue();

  const stats = React.useMemo(() => {
    if (!queueData) return null;

    const now = new Date();
    const currentUserId = userId;

    // Filter based on queue view
    let relevantItems = queueData;
    if (queueView === 'my' && currentUserId) {
      relevantItems = queueData.filter(item =>
        item.assignedTo?.id === currentUserId ||
        (item.customer.projectCoordinator?.id === currentUserId && !item.assignedTo)
      );
    }

    // Calculate stats
    const totalItems = relevantItems.length;
    const voicemails = relevantItems.filter(item => item.type === 'voicemail').length;
    const calls = relevantItems.filter(item => item.type === 'call').length;
    const messages = relevantItems.filter(item => item.type === 'message').length;
    const urgent = relevantItems.filter(item => item.priority === 'urgent').length;
    const overdue = relevantItems.filter(item =>
      item.sla?.deadline && new Date(item.sla.deadline) < now
    ).length;
    const dueWithinHour = relevantItems.filter(item => {
      if (!item.sla?.deadline) return false;
      const deadline = new Date(item.sla.deadline);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      return deadline > now && deadline <= oneHourFromNow;
    }).length;
    const unassigned = queueData.filter(item => !item.assignedTo).length;

    return {
      totalItems,
      voicemails,
      calls,
      messages,
      urgent,
      overdue,
      dueWithinHour,
      unassigned,
    };
  }, [queueData, queueView, userId]);

  if (!stats) return null;

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {/* Priority Items Card */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl p-5 border border-red-200/50 dark:border-red-900/50 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          {stats.overdue > 0 && (
            <Badge variant="destructive" className="text-xs">
              {stats.overdue} Overdue
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Needs Attention</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {stats.urgent + stats.overdue}
            </span>
            <span className="text-sm text-muted-foreground">items</span>
          </div>
          {stats.dueWithinHour > 0 && (
            <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {stats.dueWithinHour} due within 1 hour
            </p>
          )}
        </div>
      </div>

      {/* Communication Breakdown Card */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl p-5 border border-blue-200/50 dark:border-blue-900/50 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Communication Types</p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Voicemail className="w-4 h-4" />
                Voicemails
              </span>
              <span className="font-semibold">{stats.voicemails}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                Calls
              </span>
              <span className="font-semibold">{stats.calls}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                Messages
              </span>
              <span className="font-semibold">{stats.messages}</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Workload Card (My Queue) / Team Overview (Team Queue) */}
      {queueView === 'my' ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-5 border border-green-200/50 dark:border-green-900/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">My Workload</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{stats.totalItems}</span>
              <span className="text-sm text-muted-foreground">assigned</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Focus on urgent first
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl p-5 border border-purple-200/50 dark:border-purple-900/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Team Overview</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{stats.unassigned}</span>
              <span className="text-sm text-muted-foreground">available</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalItems} total items in queue
            </p>
          </div>
        </div>
      )}

      {/* Performance Indicator Card */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-xl p-5 border border-amber-200/50 dark:border-amber-900/50 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
            <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Queue Health</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {stats.overdue === 0 && stats.urgent === 0 ? '100' : Math.max(0, 100 - (stats.overdue * 20) - (stats.urgent * 5))}
            </span>
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.overdue === 0
              ? 'All items within SLA'
              : `${stats.overdue} items need immediate attention`}
          </p>
        </div>
      </div>
    </div>
  );
}