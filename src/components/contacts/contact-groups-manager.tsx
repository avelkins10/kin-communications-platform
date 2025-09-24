"use client";

import { useState } from "react";
import { ContactGroup } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Users } from "lucide-react";

interface ContactGroupsManagerProps {
  groups: ContactGroup[];
  onCreateGroup: (data: { name: string; description?: string }) => void;
  onUpdateGroup: (id: string, data: { name: string; description?: string }) => void;
  onDeleteGroup: (id: string) => void;
  loading?: boolean;
}

export function ContactGroupsManager({
  groups,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  loading = false,
}: ContactGroupsManagerProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ContactGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleCreateGroup = () => {
    setFormData({ name: "", description: "" });
    setCreateDialogOpen(true);
  };

  const handleEditGroup = (group: ContactGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGroup(formData);
    setCreateDialogOpen(false);
    setFormData({ name: "", description: "" });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroup) {
      onUpdateGroup(selectedGroup.id, formData);
      setEditDialogOpen(false);
      setSelectedGroup(null);
      setFormData({ name: "", description: "" });
    }
  };

  const handleDeleteGroup = (group: ContactGroup) => {
    if (confirm(`Are you sure you want to delete the group "${group.name}"?`)) {
      onDeleteGroup(group.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Contact Groups</h3>
        <Button onClick={handleCreateGroup} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-muted-foreground mb-2">
            No Contact Groups
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first contact group to organize your contacts.
          </p>
          <Button onClick={handleCreateGroup}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell>
                    <div className="font-medium">{group.name}</div>
                  </TableCell>
                  <TableCell>
                    {group.description ? (
                      <div className="text-sm text-muted-foreground">
                        {group.description}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {group.members?.length || 0} members
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGroup(group)}
                        disabled={loading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(group)}
                        disabled={loading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Contact Group</DialogTitle>
            <DialogDescription>
              Create a new group to organize your contacts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Group Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact Group</DialogTitle>
            <DialogDescription>
              Update the group information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
