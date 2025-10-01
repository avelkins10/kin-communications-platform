"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { translator, getActivityConfig } from "@/lib/taskrouter/translation-service";

interface Activity {
  id: string;
  twilioActivitySid: string;
  friendlyName: string;
  available: boolean;
}

interface ActivityManagementProps {
  activities: Activity[];
  onRefresh: () => void;
}

export function ActivityManagement({ activities, onRefresh }: ActivityManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState({
    friendlyName: "",
    available: false,
  });
  const [editForm, setEditForm] = useState({
    friendlyName: "",
  });
  const { toast } = useToast();

  const availableActivities = activities.filter(a => a.available).length;
  const unavailableActivities = activities.filter(a => !a.available).length;

  const handleCreateActivity = async () => {
    try {
      const response = await fetch("/api/taskrouter/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newActivity),
      });

      if (response.ok) {
        toast({
          title: "Activity created successfully",
          description: `${newActivity.friendlyName} has been created.`,
        });
        setIsCreateDialogOpen(false);
        setNewActivity({ friendlyName: "", available: false });
        onRefresh();
      } else {
        throw new Error("Failed to create activity");
      }
    } catch (error) {
      toast({
        title: "Error creating activity",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleEditActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    setEditForm({ friendlyName: activity.friendlyName });
    setIsEditDialogOpen(true);
  };

  const handleUpdateActivity = async () => {
    if (!selectedActivity) return;

    try {
      const response = await fetch(`/api/taskrouter/activities/${selectedActivity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast({
          title: "Activity updated successfully",
          description: `${editForm.friendlyName} has been updated.`,
        });
        setIsEditDialogOpen(false);
        onRefresh();
      } else {
        throw new Error("Failed to update activity");
      }
    } catch (error) {
      toast({
        title: "Error updating activity",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteActivity = async (activity: Activity) => {
    if (!confirm(`Are you sure you want to delete "${activity.friendlyName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/taskrouter/activities/${activity.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Activity deleted successfully",
          description: `${activity.friendlyName} has been deleted.`,
        });
        onRefresh();
      } else {
        throw new Error("Failed to delete activity");
      }
    } catch (error) {
      toast({
        title: "Error deleting activity",
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
          <h2 className="text-2xl font-bold tracking-tight">Agent Status Management</h2>
          <p className="text-muted-foreground">
            Manage agent availability statuses
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Agent Status</DialogTitle>
              <DialogDescription>
                Add a new availability status for agents
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="friendlyName">Status Name</Label>
                <Input
                  id="friendlyName"
                  value={newActivity.friendlyName}
                  onChange={(e) => setNewActivity({ ...newActivity, friendlyName: e.target.value })}
                  placeholder="e.g., Available, On Break, In Meeting"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={newActivity.available}
                  onCheckedChange={(checked) => setNewActivity({ ...newActivity, available: checked })}
                />
                <Label htmlFor="available">
                  Available for Calls (Agents in this status can receive calls)
                </Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateActivity}>
                  Create Status
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
            <CardTitle className="text-sm font-medium">Total Statuses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Statuses</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableActivities}</div>
            <p className="text-xs text-muted-foreground">Can receive calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unavailable Statuses</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unavailableActivities}</div>
            <p className="text-xs text-muted-foreground">Cannot receive calls</p>
          </CardContent>
        </Card>
      </div>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Statuses</CardTitle>
          <CardDescription>
            Manage availability statuses for your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status Name</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>System ID</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="font-medium">{activity.friendlyName}</div>
                  </TableCell>
                  <TableCell>
                    {activity.available ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Unavailable
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{activity.twilioActivitySid}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditActivity(activity)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteActivity(activity)}
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

      {/* Edit Activity Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent Status</DialogTitle>
            <DialogDescription>
              Update status information
            </DialogDescription>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-friendlyName">Status Name</Label>
                <Input
                  id="edit-friendlyName"
                  value={editForm.friendlyName}
                  onChange={(e) => setEditForm({ friendlyName: e.target.value })}
                />
              </div>
              <div>
                <Label>Can Receive Calls? (Read-only)</Label>
                <div className="flex items-center space-x-2 mt-2">
                  {selectedActivity.available ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Yes - Available for Calls
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      No - Unavailable
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Cannot be changed after creation
                  </span>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateActivity}>
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