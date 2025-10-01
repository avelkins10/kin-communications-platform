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
import { User, Users } from 'lucide-react';
import { Voicemail, User as UserType } from '@/types';
import { toast } from 'sonner';

interface VoicemailAssignmentProps {
  voicemail: Voicemail;
  users?: UserType[];
  onAssign: (voicemailId: string, data: any) => void;
  loading?: boolean;
}

export function VoicemailAssignment({
  voicemail,
  users = [],
  onAssign,
  loading = false,
}: VoicemailAssignmentProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>(voicemail.assignedToId || '');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  const handleAssign = () => {
    if (!selectedUser) {
      toast.error('Please select a user to assign to');
      return;
    }

    onAssign(voicemail.id, {
      assignedToId: selectedUser,
      notes: assignmentNotes,
      sendEmailNotification,
    });

    setShowDialog(false);
    setAssignmentNotes('');
    setSendEmailNotification(true);
  };

  const handleUnassign = () => {
    onAssign(voicemail.id, {
      assignedToId: null,
      notes: 'Unassigned',
      sendEmailNotification: false,
    });
  };

  const getAssignedUserName = () => {
    if (!voicemail.assignedTo) return 'Unassigned';
    return voicemail.assignedTo.name || voicemail.assignedTo.email;
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowDialog(true)}
        disabled={loading}
        className="flex items-center gap-1"
      >
        <User className="h-4 w-4" />
        {voicemail.assignedTo ? (
          <span className="text-xs max-w-20 truncate">
            {getAssignedUserName()}
          </span>
        ) : (
          <span className="text-xs">Assign</span>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assign Voicemail
            </DialogTitle>
            <DialogDescription>
              Assign this voicemail to a user for follow-up
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Voicemail Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <div className="font-medium">
                  From: {voicemail.contact 
                    ? `${voicemail.contact.firstName} ${voicemail.contact.lastName}`
                    : voicemail.fromNumber
                  }
                </div>
                <div className="text-muted-foreground">
                  {voicemail.fromNumber}
                </div>
                {voicemail.transcription && (
                  <div className="mt-2 text-xs text-muted-foreground max-h-20 overflow-y-auto">
                    "{voicemail.transcription.substring(0, 100)}
                    {voicemail.transcription.length > 100 ? '...' : ''}"
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="user-select">Assign to</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
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
          
          <DialogFooter className="flex justify-between">
            <div>
              {voicemail.assignedTo && (
                <Button 
                  variant="outline" 
                  onClick={handleUnassign}
                  disabled={loading}
                >
                  Unassign
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssign} disabled={!selectedUser || loading}>
                {voicemail.assignedTo ? 'Reassign' : 'Assign'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
