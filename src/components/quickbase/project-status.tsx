"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Calendar, Clock, CheckCircle, Circle, Play } from "lucide-react";
import { QBProject, QBMilestone } from "@/types/quickbase";

interface ProjectStatusProps {
  customerId: string;
  className?: string;
}

export function ProjectStatus({ customerId, className }: ProjectStatusProps) {
  const [project, setProject] = useState<QBProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerId) {
      fetchProjectStatus();
    }
  }, [customerId]);

  const fetchProjectStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quickbase/projects?customerId=${customerId}`);
      const data = await response.json();

      if (response.status === 404) {
        setError("No project found for this customer");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch project status");
      }

      if (data.success && data.data.project) {
        setProject(data.data.project);
      } else {
        setError("No project found for this customer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("complete") || statusLower.includes("done")) return "default";
    if (statusLower.includes("progress") || statusLower.includes("active")) return "default";
    if (statusLower.includes("pending") || statusLower.includes("wait")) return "secondary";
    if (statusLower.includes("cancel") || statusLower.includes("hold")) return "destructive";
    
    return "secondary";
  };

  const getStageColor = (stage: string) => {
    const stageLower = stage.toLowerCase();
    if (stageLower.includes("planning") || stageLower.includes("design")) return "secondary";
    if (stageLower.includes("development") || stageLower.includes("build")) return "default";
    if (stageLower.includes("testing") || stageLower.includes("review")) return "secondary";
    if (stageLower.includes("complete") || stageLower.includes("delivered")) return "default";
    
    return "outline";
  };

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "pending":
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const calculateProgress = (milestones: QBMilestone[]) => {
    if (!milestones || milestones.length === 0) return 0;
    
    const completed = milestones.filter(m => m.status === "completed").length;
    return Math.round((completed / milestones.length) * 100);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-36" />
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
            Project Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchProjectStatus}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No project information available</p>
        </CardContent>
      </Card>
    );
  }

  const progress = calculateProgress(project.milestones);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Project Status
        </CardTitle>
        <CardDescription>
          Current project information and timeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Overview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(project.status)}>
              {project.status}
            </Badge>
            <Badge variant={getStageColor(project.stage)}>
              {project.stage}
            </Badge>
          </div>

          {/* Progress Bar */}
          {project.milestones && project.milestones.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Project Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </div>

        {/* Project Timeline */}
        <div className="space-y-3">
          {project.startDate && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Start Date:</span>
              <span>{new Date(project.startDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {project.endDate && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">End Date:</span>
              <span>{new Date(project.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Milestones */}
        {project.milestones && project.milestones.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3">Project Milestones</h4>
            <div className="space-y-2">
              {project.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center gap-3 p-2 rounded-md border">
                  {getMilestoneIcon(milestone.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{milestone.name}</div>
                    {milestone.dueDate && (
                      <div className="text-xs text-muted-foreground">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {milestone.completedDate && (
                      <div className="text-xs text-muted-foreground">
                        Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <Badge 
                    variant={
                      milestone.status === "completed" ? "default" :
                      milestone.status === "in_progress" ? "secondary" : "outline"
                    }
                    className="text-xs"
                  >
                    {milestone.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            View Full Timeline
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Update Milestone
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
