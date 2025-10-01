"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Workflow, Clock } from "lucide-react";

interface Workflow {
  id: string;
  twilioWorkflowSid: string;
  friendlyName: string;
  configuration: any;
  taskTimeout: number;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowManagementProps {
  workflows: Workflow[];
  onRefresh: () => void;
}

export function WorkflowManagement({ workflows, onRefresh }: WorkflowManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [newWorkflow, setNewWorkflow] = useState({
    friendlyName: "",
    configuration: `{
  "task_routing": {
    "filters": [],
    "default_filter": {
      "queue": ""
    }
  }
}`,
    taskTimeout: 300,
  });
  const [editForm, setEditForm] = useState({
    friendlyName: "",
    configuration: "",
    taskTimeout: 300,
  });
  const { toast } = useToast();

  const handleCreateWorkflow = async () => {
    try {
      // Parse configuration to validate JSON
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(newWorkflow.configuration);
      } catch (e) {
        toast({
          title: "Invalid Configuration",
          description: "Please enter valid JSON configuration.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/taskrouter/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendlyName: newWorkflow.friendlyName,
          configuration: parsedConfig,
          taskTimeout: newWorkflow.taskTimeout,
        }),
      });

      if (response.ok) {
        toast({
          title: "Routing Rule created successfully",
          description: `${newWorkflow.friendlyName} has been created.`,
        });
        setIsCreateDialogOpen(false);
        setNewWorkflow({
          friendlyName: "",
          configuration: `{
  "task_routing": {
    "filters": [],
    "default_filter": {
      "queue": ""
    }
  }
}`,
          taskTimeout: 300,
        });
        onRefresh();
      } else {
        throw new Error("Failed to create routing rule");
      }
    } catch (error) {
      toast({
        title: "Error creating routing rule",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setEditForm({
      friendlyName: workflow.friendlyName,
      configuration: JSON.stringify(workflow.configuration, null, 2),
      taskTimeout: workflow.taskTimeout,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      // Parse configuration to validate JSON
      let parsedConfig;
      try {
        parsedConfig = JSON.parse(editForm.configuration);
      } catch (e) {
        toast({
          title: "Invalid Configuration",
          description: "Please enter valid JSON configuration.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/taskrouter/workflows/${selectedWorkflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendlyName: editForm.friendlyName,
          configuration: parsedConfig,
          taskTimeout: editForm.taskTimeout,
        }),
      });

      if (response.ok) {
        toast({
          title: "Routing Rule updated successfully",
          description: `${editForm.friendlyName} has been updated.`,
        });
        setIsEditDialogOpen(false);
        onRefresh();
      } else {
        throw new Error("Failed to update routing rule");
      }
    } catch (error) {
      toast({
        title: "Error updating routing rule",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkflow = async (workflow: Workflow) => {
    if (!confirm(`Are you sure you want to delete "${workflow.friendlyName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/taskrouter/workflows/${workflow.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Routing Rule deleted successfully",
          description: `${workflow.friendlyName} has been deleted.`,
        });
        onRefresh();
      } else {
        throw new Error("Failed to delete routing rule");
      }
    } catch (error) {
      toast({
        title: "Error deleting routing rule",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Call Routing Rules</h2>
          <p className="text-muted-foreground">
            Define how incoming calls are routed to teams
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Routing Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Routing Rule</DialogTitle>
              <DialogDescription>
                Configure how calls are routed to agent teams
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="friendlyName">Rule Name</Label>
                <Input
                  id="friendlyName"
                  value={newWorkflow.friendlyName}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, friendlyName: e.target.value })}
                  placeholder="e.g., Main Call Routing, Sales Routing"
                />
              </div>
              <div>
                <Label htmlFor="taskTimeout">Call Timeout (seconds)</Label>
                <Input
                  id="taskTimeout"
                  type="number"
                  min="30"
                  max="3600"
                  value={newWorkflow.taskTimeout}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, taskTimeout: parseInt(e.target.value) || 300 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How long to try routing a call before giving up
                </p>
              </div>
              <div>
                <Label htmlFor="configuration">Routing Configuration (JSON)</Label>
                <Textarea
                  id="configuration"
                  value={newWorkflow.configuration}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, configuration: e.target.value })}
                  className="font-mono text-sm h-64"
                  placeholder='{"task_routing": {...}}'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  TaskRouter workflow configuration in JSON format
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkflow}>
                  Create Routing Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routing Rules</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Timeout</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {workflows.length > 0
                ? Math.round(workflows.reduce((sum, w) => sum + w.taskTimeout, 0) / workflows.length)
                : 0}s
            </div>
            <p className="text-xs text-muted-foreground">Call routing timeout</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Recent</CardTitle>
            <Workflow className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-green-600">
              {workflows.length > 0
                ? workflows.sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                  )[0]?.friendlyName || "None"
                : "None"}
            </div>
            <p className="text-xs text-muted-foreground">Last modified rule</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Table */}
      <Card>
        <CardHeader>
          <CardTitle>Routing Rules</CardTitle>
          <CardDescription>
            Manage call routing rules and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Call Timeout</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell>
                    <div className="font-medium">{workflow.friendlyName}</div>
                    <div className="text-xs text-muted-foreground">{workflow.twilioWorkflowSid}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />
                      {workflow.taskTimeout}s
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(workflow.updatedAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Workflow Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Routing Rule</DialogTitle>
            <DialogDescription>
              Update routing rule configuration
            </DialogDescription>
          </DialogHeader>
          {selectedWorkflow && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-friendlyName">Rule Name</Label>
                <Input
                  id="edit-friendlyName"
                  value={editForm.friendlyName}
                  onChange={(e) => setEditForm({ ...editForm, friendlyName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-taskTimeout">Call Timeout (seconds)</Label>
                <Input
                  id="edit-taskTimeout"
                  type="number"
                  min="30"
                  max="3600"
                  value={editForm.taskTimeout}
                  onChange={(e) => setEditForm({ ...editForm, taskTimeout: parseInt(e.target.value) || 300 })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How long to try routing a call before giving up
                </p>
              </div>
              <div>
                <Label htmlFor="edit-configuration">Routing Configuration (JSON)</Label>
                <Textarea
                  id="edit-configuration"
                  value={editForm.configuration}
                  onChange={(e) => setEditForm({ ...editForm, configuration: e.target.value })}
                  className="font-mono text-sm h-64"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  TaskRouter workflow configuration in JSON format
                </p>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateWorkflow}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}