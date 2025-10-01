"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkActions, BulkAction, commonBulkActions } from "@/components/ui/bulk-actions";
import { useConversations } from "@/lib/hooks/use-messages";
import { Conversation, ContactType } from "@/types/index";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageSquare, Users, Phone, Mail, Archive, CheckCircle, XCircle } from "lucide-react";
import { MessageStatusBadge } from "./message-status-indicator";

interface ConversationsListProps {
  onSelectConversation: (contactId: string) => void;
  selectedContactId?: string;
  onBulkMarkRead?: (contactIds: string[]) => Promise<void>;
  onBulkMarkUnread?: (contactIds: string[]) => Promise<void>;
  onBulkArchive?: (contactIds: string[]) => Promise<void>;
}

export function ConversationsList({ 
  onSelectConversation, 
  selectedContactId,
  onBulkMarkRead,
  onBulkMarkUnread,
  onBulkArchive
}: ConversationsListProps) {
  const { conversations, loading, error, searchConversations } = useConversations();
  const [search, setSearch] = useState("");
  const [contactTypeFilter, setContactTypeFilter] = useState<ContactType | "ALL">("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    searchConversations({
      search: search || undefined,
      contactType: contactTypeFilter !== "ALL" ? contactTypeFilter : undefined,
      unreadOnly: unreadOnly || undefined,
    });
  };

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    setSelectedConversations(new Set(conversations.map(conv => conv.contactId)));
  }, [conversations]);

  const handleClearSelection = useCallback(() => {
    setSelectedConversations(new Set());
  }, []);

  const handleSelectionChange = useCallback((selectedItems: string[]) => {
    setSelectedConversations(new Set(selectedItems));
  }, []);

  const handleConversationSelect = useCallback((contactId: string, selected: boolean) => {
    const newSelection = new Set(selectedConversations);
    if (selected) {
      newSelection.add(contactId);
    } else {
      newSelection.delete(contactId);
    }
    setSelectedConversations(newSelection);
  }, [selectedConversations]);

  // Bulk action handlers
  const handleBulkMarkRead = useCallback(async (contactIds: string[]) => {
    if (onBulkMarkRead) {
      await onBulkMarkRead(contactIds);
    }
  }, [onBulkMarkRead]);

  const handleBulkMarkUnread = useCallback(async (contactIds: string[]) => {
    if (onBulkMarkUnread) {
      await onBulkMarkUnread(contactIds);
    }
  }, [onBulkMarkUnread]);

  const handleBulkArchive = useCallback(async (contactIds: string[]) => {
    if (onBulkArchive) {
      await onBulkArchive(contactIds);
    }
  }, [onBulkArchive]);

  // Bulk actions configuration
  const bulkActions: BulkAction[] = [
    ...(onBulkMarkRead ? [{
      id: 'mark-read',
      label: 'Mark Read',
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: handleBulkMarkRead,
    }] : []),
    ...(onBulkMarkUnread ? [{
      id: 'mark-unread',
      label: 'Mark Unread',
      icon: <XCircle className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: handleBulkMarkUnread,
    }] : []),
    ...(onBulkArchive ? [commonBulkActions.archive(handleBulkArchive)] : []),
  ];

  const getContactTypeColor = (type: ContactType) => {
    switch (type) {
      case "FIELD_CREW":
        return "warning";
      case "SALES_REP":
        return "info";
      case "VENDOR":
        return "secondary";
      default:
        return "default";
    }
  };

  const getContactTypeIcon = (type: ContactType) => {
    switch (type) {
      case "FIELD_CREW":
        return <Users className="h-3 w-3" />;
      case "SALES_REP":
        return <Phone className="h-3 w-3" />;
      case "VENDOR":
        return <Mail className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            <p>Error loading conversations: {error}</p>
            <Button onClick={handleSearch} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversations
        </CardTitle>
        
        {conversations.length > 0 && (
          <BulkActions
            selectedItems={Array.from(selectedConversations)}
            totalItems={conversations.length}
            actions={bulkActions}
            onSelectionChange={handleSelectionChange}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            isLoading={loading}
          />
        )}
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Select value={contactTypeFilter} onValueChange={(value) => setContactTypeFilter(value as ContactType | "ALL")}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Contact Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="CUSTOMER">Customers</SelectItem>
                <SelectItem value="FIELD_CREW">Field Crew</SelectItem>
                <SelectItem value="SALES_REP">Sales Reps</SelectItem>
                <SelectItem value="VENDOR">Vendors</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={unreadOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setUnreadOnly(!unreadOnly)}
            >
              Unread Only
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No conversations found</p>
            <p className="text-sm">Start a conversation by sending a message</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.contactId}
                className={`p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                  selectedContactId === conversation.contactId ? "bg-blue-50 border-blue-200" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Checkbox
                      checked={selectedConversations.has(conversation.contactId)}
                      onCheckedChange={(checked) => handleConversationSelect(conversation.contactId, !!checked)}
                      disabled={loading}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => onSelectConversation(conversation.contactId)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.contact.firstName} {conversation.contact.lastName}
                        </h4>
                        <Badge variant={getContactTypeColor(conversation.contact.type)} className="text-xs">
                          {getContactTypeIcon(conversation.contact.type)}
                          <span className="ml-1">{conversation.contact.type.replace("_", " ")}</span>
                        </Badge>
                      </div>
                      
                      {conversation.contact.organization && (
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {conversation.contact.organization}
                        </p>
                      )}
                      
                      {conversation.lastMessage && (
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.lastMessage.direction === "INBOUND" ? "" : "You: "}
                          {conversation.lastMessage.body}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 ml-2">
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                    
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(conversation.lastActivityAt), { addSuffix: true })}
                    </span>
                    
                    {conversation.lastMessage && (
                      <div className="flex items-center gap-1.5">
                        {conversation.lastMessage.direction === "INBOUND" ? (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        ) : (
                          <MessageStatusBadge
                            status={conversation.lastMessage.status}
                            direction={conversation.lastMessage.direction}
                            className="opacity-75"
                          />
                        )}
                        <span className="text-xs text-gray-400">
                          {conversation.messageCount} msg{conversation.messageCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
