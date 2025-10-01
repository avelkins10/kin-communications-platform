'use client';

import React, { useState, useCallback } from 'react';
import { Button } from './button';
import { Checkbox } from './checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Badge } from './badge';
import { Progress } from './progress';
import { 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Archive, 
  Download, 
  Mail, 
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
  disabled?: boolean;
  onClick: (selectedItems: string[]) => Promise<void>;
}

export interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  actions: BulkAction[];
  onSelectionChange: (selectedItems: string[]) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
  className?: string;
  showProgress?: boolean;
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
}

export function BulkActions({
  selectedItems,
  totalItems,
  actions,
  onSelectionChange,
  onSelectAll,
  onClearSelection,
  isLoading = false,
  className,
  showProgress = false,
  progress,
}: BulkActionsProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: BulkAction | null;
  }>({ isOpen: false, action: null });

  const selectedCount = selectedItems.length;
  const isAllSelected = selectedCount === totalItems && totalItems > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalItems;

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  }, [isAllSelected, onClearSelection, onSelectAll]);

  const handleActionClick = useCallback(async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmationDialog({ isOpen: true, action });
      return;
    }

    await executeAction(action);
  }, []);

  const executeAction = useCallback(async (action: BulkAction) => {
    if (selectedItems.length === 0) return;

    setIsExecuting(true);
    setExecutingAction(action.id);

    try {
      await action.onClick(selectedItems);
      onClearSelection();
    } catch (error) {
      console.error(`Bulk action ${action.id} failed:`, error);
      // Error handling would be done by the parent component
    } finally {
      setIsExecuting(false);
      setExecutingAction(null);
    }
  }, [selectedItems, onClearSelection]);

  const handleConfirmation = useCallback(async () => {
    if (confirmationDialog.action) {
      await executeAction(confirmationDialog.action);
      setConfirmationDialog({ isOpen: false, action: null });
    }
  }, [confirmationDialog.action, executeAction]);

  const handleCancelConfirmation = useCallback(() => {
    setConfirmationDialog({ isOpen: false, action: null });
  }, []);

  if (totalItems === 0) {
    return null;
  }

  return (
    <>
      <div className={cn(
        'flex items-center justify-between p-4 bg-muted/50 border-b',
        className
      )}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isAllSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate = isPartiallySelected;
                }
              }}
              onCheckedChange={handleSelectAll}
              disabled={isLoading}
            />
            <span className="text-sm font-medium">
              {isAllSelected ? 'All selected' : 
               isPartiallySelected ? `${selectedCount} of ${totalItems} selected` :
               'Select all'}
            </span>
          </div>

          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedCount} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <>
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  disabled={action.disabled || isLoading || isExecuting}
                  onClick={() => handleActionClick(action)}
                  className="flex items-center space-x-1"
                >
                  {isExecuting && executingAction === action.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    action.icon
                  )}
                  <span>{action.label}</span>
                </Button>
              ))}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isLoading || isExecuting}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {actions.map((action) => (
                    <DropdownMenuItem
                      key={action.id}
                      disabled={action.disabled || isLoading || isExecuting}
                      onClick={() => handleActionClick(action)}
                      className="flex items-center space-x-2"
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {showProgress && progress && (
        <div className="p-4 bg-muted/30 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {progress.label || 'Processing...'}
            </span>
            <span className="text-sm text-muted-foreground">
              {progress.current} of {progress.total}
            </span>
          </div>
          <Progress 
            value={(progress.current / progress.total) * 100} 
            className="h-2"
          />
        </div>
      )}

      <Dialog 
        open={confirmationDialog.isOpen} 
        onOpenChange={handleCancelConfirmation}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span>{confirmationDialog.action?.confirmationTitle || 'Confirm Action'}</span>
            </DialogTitle>
            <DialogDescription>
              {confirmationDialog.action?.confirmationMessage || 
               `Are you sure you want to perform this action on ${selectedCount} item(s)?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelConfirmation}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmation}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Predefined bulk actions for common use cases
export const commonBulkActions = {
  delete: (onDelete: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmationTitle: 'Delete Items',
    confirmationMessage: 'Are you sure you want to delete the selected items? This action cannot be undone.',
    onClick: onDelete,
  }),

  archive: (onArchive: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'archive',
    label: 'Archive',
    icon: <Archive className="h-4 w-4" />,
    variant: 'outline',
    requiresConfirmation: true,
    confirmationTitle: 'Archive Items',
    confirmationMessage: 'Are you sure you want to archive the selected items?',
    onClick: onArchive,
  }),

  markComplete: (onMarkComplete: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'mark-complete',
    label: 'Mark Complete',
    icon: <CheckCircle className="h-4 w-4" />,
    variant: 'default',
    onClick: onMarkComplete,
  }),

  markIncomplete: (onMarkIncomplete: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'mark-incomplete',
    label: 'Mark Incomplete',
    icon: <XCircle className="h-4 w-4" />,
    variant: 'outline',
    onClick: onMarkIncomplete,
  }),

  export: (onExport: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'export',
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    variant: 'outline',
    onClick: onExport,
  }),

  sendEmail: (onSendEmail: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'send-email',
    label: 'Send Email',
    icon: <Mail className="h-4 w-4" />,
    variant: 'outline',
    onClick: onSendEmail,
  }),

  makeCall: (onMakeCall: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'make-call',
    label: 'Make Call',
    icon: <Phone className="h-4 w-4" />,
    variant: 'outline',
    onClick: onMakeCall,
  }),
};

export default BulkActions;
