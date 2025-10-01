"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageThread } from "@/components/messages/message-thread";
import { MessageComposer } from "@/components/messages/message-composer";
import { BulkMessenger } from "@/components/messages/bulk-messenger";
import { NewMessageDialog } from "@/components/messages/new-message-dialog";
import { CustomerContextSidebar } from "@/components/ui/customer-context-sidebar";
import { QuickActionsToolbar } from "@/components/ui/quick-actions-toolbar";
import { RealTimeNotificationSystem } from "@/components/ui/real-time-notification-system";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { LoadingState } from "@/components/ui/loading-state";
import { ProfessionalCard } from "@/components/ui/professional-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import { useMessages, useConversations } from "@/lib/hooks/use-messages";
import { useProfessionalInteractions } from "@/lib/hooks/use-professional-interactions";
import { useLayout } from "@/lib/hooks/use-layout";
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  UserCheck,
  Inbox,
  Clock,
  Archive,
  Sparkles
} from "lucide-react";

type ViewFilter = "my-conversations" | "team-conversations" | "unassigned" | "archived";
type SortOption = "recent" | "unread" | "oldest";

function MessagesPageContent() {
  const { data: session } = useSession();
  const user = session?.user;
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>();
  const [isBulkMessengerOpen, setIsBulkMessengerOpen] = useState(false);
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("my-conversations");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  const { sendMessage } = useMessages();
  const { conversations, loading, searchConversations } = useConversations();
  const { useButtonState, useNotification } = useProfessionalInteractions();
  const { setMode } = useLayout();
  const notification = useNotification();

  // Hydration fix
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Set layout mode
  React.useEffect(() => {
    if (isClient) {
      setMode('MESSAGING');
    }
  }, [setMode, isClient]);

  // Load conversations based on filter
  useEffect(() => {
    const params: any = {
      sortBy: "lastActivityAt",
      sortOrder: sortBy === "oldest" ? "asc" : "desc",
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    if (viewFilter === "my-conversations" && session?.user?.id) {
      params.assignedTo = session.user.id;
    } else if (viewFilter === "unassigned") {
      params.unassigned = true;
    } else if (viewFilter === "archived") {
      params.archived = true;
    }

    if (sortBy === "unread") {
      params.unreadOnly = true;
    }

    searchConversations(params);
  }, [viewFilter, sortBy, searchQuery, session?.user?.id, searchConversations]);

  const handleSendMessage = async (
    message: string,
    templateId?: string,
    variables?: Record<string, string>,
    mediaUrls?: string[]
  ) => {
    if (!selectedContactId) return;

    const conversation = conversations.find(c => c.contactId === selectedContactId);
    if (!conversation) return;

    try {
      await sendMessage({
        toNumber: conversation.contact.phone,
        body: message,
        contactId: selectedContactId,
        templateId,
        variables,
        mediaUrls,
      });
      notification.showSuccess("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      notification.showError("Failed to send message");
      throw error;
    }
  };

  const handleItemSelect = async (contactId: string) => {
    setSelectedContactId(contactId);
    setIsLoadingCustomer(true);

    // Load customer data for sidebar
    const conversation = conversations.find(c => c.contactId === contactId);
    if (conversation) {
      // Mock customer data - in production, fetch full customer details
      setCustomerData({
        id: contactId,
        name: `${conversation.contact.firstName} ${conversation.contact.lastName}`,
        phone: conversation.contact.phone,
        email: conversation.contact.email,
        company: conversation.contact.organization,
        lastInteraction: new Date(conversation.lastActivityAt),
        quickbaseUrl: conversation.contact.quickbaseId ? `https://kin.quickbase.com/db/${conversation.contact.quickbaseId}` : undefined
      });
    }
    setIsLoadingCustomer(false);
  };

  const handleCall = async (phone?: string) => {
    if (!phone) {
      notification.showError('No phone number available');
      return;
    }
    notification.showSuccess(`Calling ${phone}`);
  };

  const handleText = async (phone?: string) => {
    if (!phone) {
      notification.showError('No phone number available');
      return;
    }
    notification.showInfo('Opening message composer');
  };

  const handleEmail = async (email?: string) => {
    if (!email) {
      notification.showError('No email address available');
      return;
    }
    window.open(`mailto:${email}`, '_blank');
  };

  const handleAddNote = () => {
    notification.showInfo('Add note functionality would open here');
  };

  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;
  const myConversationsCount = conversations.filter(c => c.contact.userId === session?.user?.id).length;
  const unassignedCount = conversations.filter(c => !c.contact.userId).length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <div className="bg-background border-b shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <MessageSquare className="h-6 w-6" />
                    Messages
                    {viewFilter === "my-conversations" && (
                      <span className="text-sm font-normal px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                        Personal
                      </span>
                    )}
                    {viewFilter === "team-conversations" && (
                      <span className="text-sm font-normal px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                        Team-Wide
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {viewFilter === "my-conversations"
                      ? "Your assigned conversations and messages"
                      : viewFilter === "team-conversations"
                      ? "Monitor all team conversations"
                      : viewFilter === "unassigned"
                      ? "Conversations waiting to be assigned"
                      : "Archived conversations"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <RealTimeNotificationSystem />
                <Button onClick={() => setIsNewMessageDialogOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Message
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsBulkMessengerOpen(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Message
                </Button>
                {selectedContactId && customerData && (
                  <QuickActionsToolbar
                    selectedItem={{
                      id: selectedContactId,
                      type: 'message',
                      customerPhone: customerData.phone
                    }}
                    onCall={handleCall}
                    onText={handleText}
                  />
                )}
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-fit">
              <button
                onClick={() => setViewFilter("my-conversations")}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${
                  viewFilter === "my-conversations"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                My Messages
                {myConversationsCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {myConversationsCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setViewFilter("team-conversations")}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${
                  viewFilter === "team-conversations"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-4 h-4" />
                Team Messages
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {unreadCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setViewFilter("unassigned")}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${
                  viewFilter === "unassigned"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Inbox className="w-4 h-4" />
                Unassigned
                {unassignedCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {unassignedCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setViewFilter("archived")}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${
                  viewFilter === "archived"
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Archive className="w-4 h-4" />
                Archived
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages Content - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filter */}
              <ProfessionalCard variant="default" status="active">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 border rounded-md text-sm bg-white"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="unread">Unread First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </CardContent>
              </ProfessionalCard>

              {/* Conversations and Messages */}
              <div className="bg-background rounded-xl shadow-sm border overflow-hidden">
                <div className="flex h-[calc(100vh-20rem)]">
                  {/* Conversations Sidebar */}
                  <div className="w-96 border-r bg-gray-50 overflow-y-auto">
                    {loading ? (
                      <div className="p-8 text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-pulse" />
                        <p className="text-sm text-gray-500">Loading conversations...</p>
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-8 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium text-gray-600 mb-1">No conversations found</p>
                        <p className="text-xs text-gray-500">
                          {viewFilter === "my-conversations"
                            ? "You don't have any assigned conversations yet"
                            : viewFilter === "unassigned"
                            ? "All conversations are assigned"
                            : "Start a conversation by sending a message"}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {conversations.map((conversation) => (
                          <div
                            key={conversation.contactId}
                            onClick={() => handleItemSelect(conversation.contactId)}
                            className={`p-4 cursor-pointer transition-colors hover:bg-white ${
                              selectedContactId === conversation.contactId
                                ? "bg-white border-l-4 border-blue-500"
                                : ""
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-sm truncate">
                                    {conversation.contact.firstName} {conversation.contact.lastName}
                                  </h4>
                                  {conversation.unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>

                                {conversation.contact.organization && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {conversation.contact.organization}
                                  </p>
                                )}
                              </div>

                              <div className="text-xs text-gray-400 ml-2">
                                {new Date(conversation.lastActivityAt).toLocaleDateString() === new Date().toLocaleDateString()
                                  ? new Date(conversation.lastActivityAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : new Date(conversation.lastActivityAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            </div>

                            {conversation.lastMessage && (
                              <p className="text-sm text-gray-600 truncate">
                                {conversation.lastMessage.direction === "INBOUND" ? "" : "You: "}
                                {conversation.lastMessage.body}
                              </p>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {conversation.contact.type.replace("_", " ")}
                              </Badge>
                              {conversation.messageCount > 0 && (
                                <span className="text-xs text-gray-400">
                                  {conversation.messageCount} msg{conversation.messageCount !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Thread Area */}
                  <div className="flex-1 flex flex-col bg-white">
                    {selectedContactId ? (
                      <>
                        <div className="flex-1 overflow-y-auto">
                          <MessageThread
                            contactId={selectedContactId}
                            onSendMessage={handleSendMessage}
                          />
                        </div>
                        <div className="border-t">
                          <MessageComposer
                            contactId={selectedContactId}
                            onSendMessage={handleSendMessage}
                            placeholder="Type your message..."
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-md">
                          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="h-10 w-10 text-blue-500" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                          <p className="text-gray-600 mb-6">
                            Choose a conversation from the sidebar to view messages and reply
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="lg:col-span-1 space-y-6">
              {isLoadingCustomer ? (
                <div className="bg-background rounded-xl shadow-sm border p-6">
                  <LoadingState variant="skeleton" size="lg" />
                </div>
              ) : selectedContactId && customerData ? (
                <div className="bg-background rounded-xl shadow-sm border overflow-hidden">
                  <CustomerContextSidebar
                    customer={customerData}
                    onCall={handleCall}
                    onText={handleText}
                    onEmail={handleEmail}
                    onAddNote={handleAddNote}
                  />
                </div>
              ) : (
                <div className="bg-background rounded-xl shadow-sm border p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Select a Conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any conversation to view customer details and message history
                  </p>
                </div>
              )}

              {/* Quick Stats */}
              <ProfessionalCard variant="default" status="active">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Conversation Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Conversations</span>
                      <span className="text-sm font-semibold">{conversations.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Unread</span>
                      <Badge variant="destructive">{unreadCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">My Conversations</span>
                      <Badge variant="secondary">{myConversationsCount}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                      <Badge variant="outline">{unassignedCount}</Badge>
                    </div>
                  </div>
                </CardContent>
              </ProfessionalCard>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NewMessageDialog
        isOpen={isNewMessageDialogOpen}
        onClose={() => setIsNewMessageDialogOpen(false)}
        onSelectContact={(contactId) => {
          setSelectedContactId(contactId);
          setIsNewMessageDialogOpen(false);
        }}
      />

      <BulkMessenger
        isOpen={isBulkMessengerOpen}
        onClose={() => setIsBulkMessengerOpen(false)}
      />
    </ErrorBoundary>
  );
}

export default function MessagesPage() {
  return <MessagesPageContent />;
}