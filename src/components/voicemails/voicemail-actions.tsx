'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Phone, 
  Eye, 
  EyeOff, 
  User, 
  Flag, 
  Trash2, 
  MoreHorizontal,
  MessageSquare,
  Download
} from 'lucide-react';
import { Voicemail } from '@/types';
import { cn } from '@/lib/utils';

interface VoicemailActionsProps {
  voicemail: Voicemail;
  onCallback?: (voicemail: Voicemail) => void;
  onMarkRead?: (voicemail: Voicemail) => void;
  onMarkUnread?: (voicemail: Voicemail) => void;
  onAssign?: (voicemail: Voicemail) => void;
  onSetPriority?: (voicemail: Voicemail, priority: string) => void;
  onAddNotes?: (voicemail: Voicemail) => void;
  onDelete?: (voicemail: Voicemail) => void;
  onDownload?: (voicemail: Voicemail) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export function VoicemailActions({
  voicemail,
  onCallback,
  onMarkRead,
  onMarkUnread,
  onAssign,
  onSetPriority,
  onAddNotes,
  onDelete,
  onDownload,
  className,
  variant = 'default',
}: VoicemailActionsProps) {
  const isNew = !voicemail.readAt;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(voicemail.priority);
  const [notes, setNotes] = useState(voicemail.notes || '');

  const handleDelete = () => {
    onDelete?.(voicemail);
    setShowDeleteDialog(false);
  };

  const handleSetPriority = () => {
    onSetPriority?.(voicemail, selectedPriority);
    setShowPriorityDialog(false);
  };

  const handleAddNotes = () => {
    onAddNotes?.(voicemail);
    setShowNotesDialog(false);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = voicemail.audioUrl;
    link.download = `voicemail-${voicemail.id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onCallback?.(voicemail)}>
            <Phone className="h-4 w-4 mr-2" />
            Callback
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => isNew ? onMarkRead?.(voicemail) : onMarkUnread?.(voicemail)}
          >
            {isNew ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Mark as Read
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Mark as Unread
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAssign?.(voicemail)}>
            <User className="h-4 w-4 mr-2" />
            Assign
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowPriorityDialog(true)}>
            <Flag className="h-4 w-4 mr-2" />
            Set Priority
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowNotesDialog(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Notes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Callback Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onCallback?.(voicemail)}
        title="Callback caller"
      >
        <Phone className="h-4 w-4" />
      </Button>

      {/* Read/Unread Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => isNew ? onMarkRead?.(voicemail) : onMarkUnread?.(voicemail)}
        title={isNew ? 'Mark as read' : 'Mark as unread'}
      >
        {isNew ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </Button>

      {/* Assign Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAssign?.(voicemail)}
        title="Assign to user"
      >
        <User className="h-4 w-4" />
      </Button>

      {/* Priority Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowPriorityDialog(true)}
        title="Set priority"
      >
        <Flag className="h-4 w-4" />
      </Button>

      {/* Notes Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowNotesDialog(true)}
        title="Add notes"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>

      {/* Download Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleDownload}
        title="Download audio"
      >
        <Download className="h-4 w-4" />
      </Button>

      {/* Delete Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDeleteDialog(true)}
        title="Delete voicemail"
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Voicemail</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this voicemail? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Priority Selection Dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Priority</DialogTitle>
            <DialogDescription>
              Choose the priority level for this voicemail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((priority) => (
              <Button
                key={priority}
                variant={selectedPriority === priority ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={() => setSelectedPriority(priority as any)}
              >
                <Flag className="h-4 w-4 mr-2" />
                {priority}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriorityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPriority}>
              Set Priority
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogDescription>
              Add internal notes for this voicemail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes..."
              className="w-full h-32 p-3 border rounded-md resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
