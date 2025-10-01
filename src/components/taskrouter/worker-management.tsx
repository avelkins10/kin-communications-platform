"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Phone,
  Mail,
  Settings,
  Plus,
  Search,
  Filter,
  Activity,
  X,
  Edit
} from "lucide-react";

interface Worker {
  id: string;
  twilioWorkerSid: string;
  friendlyName: string;
  attributes: {
    skills?: string[];
    department?: string;
    languages?: string[];
    timezone?: string;
    contact_uri?: string;
    name?: string;
    email?: string;
  };
  activitySid?: string;
  available: boolean;
  User: {
    id: string;
    name?: string;
    email: string;
  } | null;
  Task: Array<{
    id: string;
    assignmentStatus: string;
    priority: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface WorkerStats {
  tasksCompleted: number;
  tasksAccepted: number;
  tasksRejected: number;
  acceptanceRate: number;
  avgHandleTime: number;
  totalReservations: number;
}

interface WorkerManagementProps {
  workers: Worker[];
  onRefresh: () => void;
}

export function WorkerManagement({ workers, onRefresh }: WorkerManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterActivity, setFilterActivity] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [workerStats, setWorkerStats] = useState<WorkerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [editForm, setEditForm] = useState({
    friendlyName: "",
    department: "",
    skills: [] as string[],
    timezone: "",
    newSkill: "",
  });
  const [newWorker, setNewWorker] = useState({
    friendlyName: "",
    skills: [] as string[],
    department: "",
    email: "",
    timezone: "America/New_York",
  });
  const { toast } = useToast();

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = worker.friendlyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worker.User?.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || worker.attributes.department === filterDepartment;
    const matchesActivity = filterActivity === "all" || 
                           (filterActivity === "available" && worker.available) ||
                           (filterActivity === "busy" && !worker.available);
    
    return matchesSearch && matchesDepartment && matchesActivity;
  });

  const departments = Array.from(new Set(workers.map(w => w.attributes.department).filter(Boolean)));
  const totalWorkers = workers.length;
  const availableWorkers = workers.filter(w => w.available).length;
  const busyWorkers = workers.filter(w => !w.available).length;

  const handleCreateWorker = async () => {
    try {
      const response = await fetch("/api/taskrouter/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendlyName: newWorker.friendlyName,
          attributes: {
            skills: newWorker.skills,
            department: newWorker.department,
            email: newWorker.email,
            timezone: newWorker.timezone,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Team member added successfully",
          description: `${newWorker.friendlyName} has been added.`,
        });
        setIsCreateDialogOpen(false);
        setNewWorker({
          friendlyName: "",
          skills: [],
          department: "",
          email: "",
          timezone: "America/New_York",
        });
        onRefresh();
      } else {
        throw new Error("Failed to create team member");
      }
    } catch (error) {
      toast({
        title: "Error adding team member",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleEditWorker = async (worker: Worker) => {
    setSelectedWorker(worker);
    setEditForm({
      friendlyName: worker.friendlyName,
      department: worker.attributes.department || "",
      skills: worker.attributes.skills || [],
      timezone: worker.attributes.timezone || "America/New_York",
      newSkill: "",
    });
    setIsEditDialogOpen(true);

    // Fetch worker stats
    setLoadingStats(true);
    try {
      const response = await fetch(`/api/taskrouter/workers/${worker.id}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setWorkerStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch worker stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleUpdateWorker = async () => {
    if (!selectedWorker) return;

    try {
      const response = await fetch(`/api/taskrouter/workers/${selectedWorker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendlyName: editForm.friendlyName,
          attributes: {
            ...selectedWorker.attributes,
            department: editForm.department,
            skills: editForm.skills,
            timezone: editForm.timezone,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Team member updated successfully",
          description: `${editForm.friendlyName} has been updated.`,
        });
        setIsEditDialogOpen(false);
        onRefresh();
      } else {
        throw new Error("Failed to update team member");
      }
    } catch (error) {
      toast({
        title: "Error updating team member",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleAddSkill = () => {
    if (editForm.newSkill && !editForm.skills.includes(editForm.newSkill)) {
      setEditForm({
        ...editForm,
        skills: [...editForm.skills, editForm.newSkill],
        newSkill: "",
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditForm({
      ...editForm,
      skills: editForm.skills.filter(skill => skill !== skillToRemove),
    });
  };

  const handleUpdateWorkerAvailability = async (worker: Worker, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/taskrouter/workers/${worker.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          friendlyName: worker.friendlyName,
          attributes: worker.attributes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Agent status updated",
          description: `${worker.friendlyName} is now ${isAvailable ? 'available' : 'busy'}.`,
        });
        onRefresh();
      } else {
        throw new Error("Failed to update agent status");
      }
    } catch (error) {
      toast({
        title: "Error updating team member",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getActivityBadge = (worker: Worker) => {
    if (!worker.available) {
      return <Badge variant="destructive">Busy</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  const getDepartmentBadge = (department?: string) => {
    if (!department) return <Badge variant="secondary">Unassigned</Badge>;
    
    const colors: Record<string, string> = {
      permits: "bg-blue-100 text-blue-800",
      utilities: "bg-green-100 text-green-800",
      scheduling: "bg-yellow-100 text-yellow-800",
      emergency: "bg-red-100 text-red-800",
      billing: "bg-purple-100 text-purple-800",
      support: "bg-gray-100 text-gray-800",
    };
    
    return (
      <Badge className={colors[department] || "bg-gray-100 text-gray-800"}>
        {department}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Member Management</h2>
          <p className="text-muted-foreground">
            Manage team member availability
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Add a new team member
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="friendlyName">Name</Label>
                <Input
                  id="friendlyName"
                  value={newWorker.friendlyName}
                  onChange={(e) => setNewWorker({ ...newWorker, friendlyName: e.target.value })}
                  placeholder="Enter team member name"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={newWorker.department}
                  onValueChange={(value) => setNewWorker({ ...newWorker, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permits">Permits</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="scheduling">Scheduling</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newWorker.email}
                  onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                  placeholder="team-member@example.com"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={newWorker.timezone}
                  onValueChange={(value) => setNewWorker({ ...newWorker, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorker}>
                  Add Team Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableWorkers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busy</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{busyWorkers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workers.reduce((sum, worker) => sum + worker.Task.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterActivity} onValueChange={setFilterActivity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team Members</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage agent availability and view their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Calls</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{worker.friendlyName}</div>
                      <div className="text-sm text-muted-foreground">{worker.User?.email || 'No email'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getDepartmentBadge(worker.attributes.department)}
                  </TableCell>
                  <TableCell>
                    {getActivityBadge(worker)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {worker.Task.length} active
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {worker.attributes.skills?.slice(0, 2).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {worker.attributes.skills && worker.attributes.skills.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{worker.attributes.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(worker.updatedAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWorker(worker)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Select
                        value={worker.available ? "available" : "busy"}
                        onValueChange={(value) => {
                          const isAvailable = value === "available";
                          handleUpdateWorkerAvailability(worker, isAvailable);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="busy">Busy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Worker Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update team member information
            </DialogDescription>
          </DialogHeader>
          {selectedWorker && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-friendlyName">Name</Label>
                <Input
                  id="edit-friendlyName"
                  value={editForm.friendlyName}
                  onChange={(e) => setEditForm({ ...editForm, friendlyName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-department">Department</Label>
                <Select
                  value={editForm.department}
                  onValueChange={(value) => setEditForm({ ...editForm, department: value })}
                >
                  <SelectTrigger id="edit-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permits">Permits</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="scheduling">Scheduling</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-timezone">Timezone</Label>
                <Select
                  value={editForm.timezone}
                  onValueChange={(value) => setEditForm({ ...editForm, timezone: value })}
                >
                  <SelectTrigger id="edit-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email (Read-only)</Label>
                <Input value={selectedWorker.User?.email || ''} readOnly disabled />
              </div>
              <div>
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new skill"
                    value={editForm.newSkill}
                    onChange={(e) => setEditForm({ ...editForm, newSkill: e.target.value })}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSkill} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Worker Stats Section */}
              <div>
                <Label>Performance Stats (Last 30 Days)</Label>
                {loadingStats ? (
                  <div className="text-sm text-muted-foreground">Loading stats...</div>
                ) : workerStats ? (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Calls Completed</div>
                      <div className="text-2xl font-bold">{workerStats.tasksCompleted}</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Acceptance Rate</div>
                      <div className="text-2xl font-bold">{workerStats.acceptanceRate}%</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Calls Accepted</div>
                      <div className="text-2xl font-bold">{workerStats.tasksAccepted}</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Calls Rejected</div>
                      <div className="text-2xl font-bold">{workerStats.tasksRejected}</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Avg Handle Time</div>
                      <div className="text-2xl font-bold">{Math.round(workerStats.avgHandleTime)}s</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Total Reservations</div>
                      <div className="text-2xl font-bold">{workerStats.totalReservations}</div>
                    </Card>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No stats available</div>
                )}
              </div>

              <div>
                <Label>Active Calls ({selectedWorker.Task.length})</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedWorker.Task.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active calls</p>
                  ) : (
                    selectedWorker.Task.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Call #{task.id.slice(-8)}</span>
                        <Badge variant="outline">
                          Priority: {task.priority}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateWorker}>
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
