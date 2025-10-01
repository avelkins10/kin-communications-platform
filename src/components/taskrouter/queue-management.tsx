"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskQueue {
  id: string;
  twilioTaskQueueSid: string;
  friendlyName: string;
  targetWorkers: string | null;
  maxReservedWorkers: number;
  taskOrder: "FIFO" | "LIFO";
}

interface QueueManagementProps {
  queues: TaskQueue[];
  onRefresh: () => void;
}

export function QueueManagement({ queues, onRefresh }: QueueManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<TaskQueue | null>(null);
  const [newQueue, setNewQueue] = useState({
    friendlyName: "",
    targetWorkers: "",
    maxReservedWorkers: 1,
    taskOrder: "FIFO" as "FIFO" | "LIFO",
  });
  const [editForm, setEditForm] = useState({
    friendlyName: "",
    targetWorkers: "",
    maxReservedWorkers: 1,
    taskOrder: "FIFO" as "FIFO" | "LIFO",
  });
  const { toast } = useToast();

  const fifoQueues = queues.filter(q => q.taskOrder === "FIFO").length;
  const lifoQueues = queues.filter(q => q.taskOrder === "LIFO").length;

  const handleCreateQueue = async () => {
    try {
      const response = await fetch("/api/taskrouter/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newQueue,
          targetWorkers: newQueue.targetWorkers || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Task Queue created successfully",
          description: `${newQueue.friendlyName} has been created.`,
        });
        setIsCreateDialogOpen(false);
        setNewQueue({ friendlyName: "", targetWorkers: "", maxReservedWorkers: 1, taskOrder: "FIFO" });
        onRefresh();
      } else {
        throw new Error("Failed to create task queue");
      }
    } catch (error) {
      toast({
        title: "Error creating task queue",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleEditQueue = (queue: TaskQueue) => {
    setSelectedQueue(queue);
    setEditForm({
      friendlyName: queue.friendlyName,
      targetWorkers: queue.targetWorkers || "",
      maxReservedWorkers: queue.maxReservedWorkers,
      taskOrder: queue.taskOrder,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateQueue = async () => {
    if (!selectedQueue) return;

    try {
      const response = await fetch(`/api/taskrouter/queues/${selectedQueue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          targetWorkers: editForm.targetWorkers || undefined,
        }),
      });

      if (response.ok) {
        toast({
          title: "Task Queue updated successfully",
          description: `${editForm.friendlyName} has been updated.`,
        });
        setIsEditDialogOpen(false);
        onRefresh();
      } else {
        throw new Error("Failed to update task queue");
      }
    } catch (error) {
      toast({
        title: "Error updating task queue",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQueue = async (queue: TaskQueue) => {
    if (!confirm(`Are you sure you want to delete "${queue.friendlyName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/taskrouter/queues/${queue.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Task Queue deleted successfully",
          description: `${queue.friendlyName} has been deleted.`,
        });
        onRefresh();
      } else {
        throw new Error("Failed to delete task queue");
      }
    } catch (error) {
      toast({
        title: "Error deleting task queue",
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
          <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">
            Manage agent teams and call routing
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Add a new team for call routing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="friendlyName">Team Name</Label>
                <Input
                  id="friendlyName"
                  value={newQueue.friendlyName}
                  onChange={(e) => setNewQueue({ ...newQueue, friendlyName: e.target.value })}
                  placeholder="e.g., Sales Team, Customer Support"
                />
              </div>
              <div>
                <Label htmlFor="targetWorkers">Target Agents (Filter)</Label>
                <Input
                  id="targetWorkers"
                  value={newQueue.targetWorkers}
                  onChange={(e) => setNewQueue({ ...newQueue, targetWorkers: e.target.value })}
                  placeholder="e.g., skills HAS 'support'"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Agent skill filter expression (optional)
                </p>
              </div>
              <div>
                <Label htmlFor="maxReservedWorkers">Max Simultaneous Calls</Label>
                <Input
                  id="maxReservedWorkers"
                  type="number"
                  min="1"
                  value={newQueue.maxReservedWorkers}
                  onChange={(e) => setNewQueue({ ...newQueue, maxReservedWorkers: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="taskOrder">Call Priority Order</Label>
                <Select
                  value={newQueue.taskOrder}
                  onValueChange={(value: "FIFO" | "LIFO") => setNewQueue({ ...newQueue, taskOrder: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">Oldest Call First (FIFO)</SelectItem>
                    <SelectItem value="LIFO">Newest Call First (LIFO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQueue}>
                  Create Team
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
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oldest First Teams</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{fifoQueues}</div>
            <p className="text-xs text-muted-foreground">FIFO ordering</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Newest First Teams</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{lifoQueues}</div>
            <p className="text-xs text-muted-foreground">LIFO ordering</p>
          </CardContent>
        </Card>
      </div>

      {/* Queues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <CardDescription>
            Manage your agent teams and call routing rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Call Priority</TableHead>
                <TableHead>Max Calls</TableHead>
                <TableHead>Agent Filter</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queues.map((queue) => (
                <TableRow key={queue.id}>
                  <TableCell>
                    <div className="font-medium">{queue.friendlyName}</div>
                    <div className="text-xs text-muted-foreground">{queue.twilioTaskQueueSid}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={queue.taskOrder === "FIFO" ? "default" : "secondary"}>
                      {queue.taskOrder}
                    </Badge>
                  </TableCell>
                  <TableCell>{queue.maxReservedWorkers}</TableCell>
                  <TableCell>
                    {queue.targetWorkers ? (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {queue.targetWorkers}
                      </code>
                    ) : (
                      <span className="text-muted-foreground">All agents</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQueue(queue)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQueue(queue)}
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

      {/* Edit Queue Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team configuration
            </DialogDescription>
          </DialogHeader>
          {selectedQueue && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-friendlyName">Team Name</Label>
                <Input
                  id="edit-friendlyName"
                  value={editForm.friendlyName}
                  onChange={(e) => setEditForm({ ...editForm, friendlyName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-targetWorkers">Target Agents (Filter)</Label>
                <Input
                  id="edit-targetWorkers"
                  value={editForm.targetWorkers}
                  onChange={(e) => setEditForm({ ...editForm, targetWorkers: e.target.value })}
                  placeholder="e.g., skills HAS 'support'"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Agent skill filter expression (optional)
                </p>
              </div>
              <div>
                <Label htmlFor="edit-maxReservedWorkers">Max Simultaneous Calls</Label>
                <Input
                  id="edit-maxReservedWorkers"
                  type="number"
                  min="1"
                  value={editForm.maxReservedWorkers}
                  onChange={(e) => setEditForm({ ...editForm, maxReservedWorkers: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label htmlFor="edit-taskOrder">Call Priority Order</Label>
                <Select
                  value={editForm.taskOrder}
                  onValueChange={(value: "FIFO" | "LIFO") => setEditForm({ ...editForm, taskOrder: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">Oldest Call First (FIFO)</SelectItem>
                    <SelectItem value="LIFO">Newest Call First (LIFO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateQueue}>
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