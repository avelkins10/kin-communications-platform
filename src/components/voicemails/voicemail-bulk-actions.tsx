'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Flag, 
  Eye, 
  EyeOff, 
  Trash2,
  X
} from 'lucide-react';
import { VoicemailPriority, User } from '@/types/index';
import { toast } from 'sonner';

interface VoicemailBulkActionsProps {
  selectedCount: number;
  onBulkAction: (action: string, data?: any) => void;
  onClearSelection: () => void;
  users?: User[];
  loading?: boolean;
}

const priorityOptions = [
  { value: 'LOW', label: 'Low Priority', color: 'text-green-600' },
  { value: 'NORMAL', label: 'Normal Priority', color: 'text-blue-600' },
  { value: 'HIGH', label: 'High Priority', color: 'text-orange-600' },
  { value: 'URGENT', label: 'Urgent Priority', color: 'text-red-600' },
];

export function VoicemailBulkActions({
  selectedCount,
  onBulkAction,
  onClearSelection,
  users = [],
  loading = false,
}: VoicemailBulkActionsProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState<VoicemailPriority>('NORMAL');

  const handleAssign = () => {
    if (!selectedUser) {
      toast.error('Please select a user to assign to');
      return;
    }

    onBulkAction('assign', {
      assignedToId: selectedUser,
      notes: assignmentNotes,
      sendEmailNotification,
    });

    setShowAssignDialog(false);
    setSelectedUser('');
    setAssignmentNotes('');
    setSendEmailNotification(true);
  };

  const handleSetPriority = () => {
    onBulkAction('set_priority', {
      priority: selectedPriority,
    });

    setShowPriorityDialog(false);
    setSelectedPriority('NORMAL');
  };

  const handleMarkRead = () => {
    onBulkAction('mark_read');
  };

  const handleMarkUnread = () => {
    onBulkAction('mark_unread');
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedCount} voicemail(s)?`)) {
      onBulkAction('delete');
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <span className="text-sm font-medium">
          {selectedCount} voicemail{selectedCount > 1 ? 's' : ''} selected
        </span>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkRead}
            disabled={loading}
          >
            <Eye className="h-4 w-4 mr-1" />
            Mark Read
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkUnread}
            disabled={loading}
          >
            <EyeOff className="h-4 w-4 mr-1" />
            Mark Unread
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAssignDialog(true)}
            disabled={loading}
          >
            <Users className="h-4 w-4 mr-1" />
            Assign
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPriorityDialog(true)}
            disabled={loading}
          >
            <Flag className="h-4 w-4 mr-1" />
            Set Priority
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Voicemails</DialogTitle>
            <DialogDescription>
              Assign {selectedCount} voicemail{selectedCount > 1 ? 's' : ''} to a user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select">Assign to</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="assignment-notes">Assignment Notes (Optional)</Label>
              <Textarea
                id="assignment-notes"
                placeholder="Add any notes about this assignment..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="send-email"
                checked={sendEmailNotification}
                onCheckedChange={setSendEmailNotification}
              />
              <Label htmlFor="send-email" className="text-sm">
                Send email notification to assigned user
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedUser || loading}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Priority</DialogTitle>
            <DialogDescription>
              Set priority for {selectedCount} voicemail{selectedCount > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="priority-select">Priority Level</Label>
              <Select 
                value={selectedPriority} 
                onValueChange={(value: VoicemailPriority) => setSelectedPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className={option.color}>{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriorityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPriority} disabled={loading}>
              Set Priority
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
