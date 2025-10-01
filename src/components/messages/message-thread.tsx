"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConversationThread } from "@/lib/hooks/use-messages";
import { Message, MessageStatus } from "@/types/index";
import { formatDistanceToNow, format } from "date-fns";
import { MessageStatusBadge } from "./message-status-indicator";
import {
  User,
  Phone,
  Mail,
  Users,
  RefreshCw
} from "lucide-react";

interface MessageThreadProps {
  contactId: string;
  onSendMessage?: (message: string) => void;
}

export function MessageThread({ contactId, onSendMessage }: MessageThreadProps) {
  const { messages, contact, metadata, loading, error, loadConversation, markAsRead } = useConversationThread();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contactId) {
      loadConversation(contactId, true); // Mark as read when loading
    }
  }, [contactId, loadConversation]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const getContactTypeIcon = (type: string) => {
    switch (type) {
      case "FIELD_CREW":
        return <Users className="h-4 w-4" />;
      case "SALES_REP":
        return <Phone className="h-4 w-4" />;
      case "VENDOR":
        return <Mail className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const retryMessage = async (messageId: string) => {
    // TODO: Implement message retry functionality
    console.log("Retry message:", messageId);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Loading conversation...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">
            <p>Error loading conversation: {error}</p>
            <Button onClick={() => loadConversation(contactId)} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contact) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>No Conversation Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a conversation to view messages</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              {getContactTypeIcon(contact.type)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {contact.firstName} {contact.lastName}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{contact.phone}</span>
                {contact.email && (
                  <>
                    <span>•</span>
                    <span>{contact.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {contact.type.replace("_", " ")}
            </Badge>
            {metadata?.unreadCount > 0 && (
              <Badge variant="destructive">
                {metadata.unreadCount} unread
              </Badge>
            )}
          </div>
        </div>
        
        {metadata && (
          <div className="text-sm text-gray-500">
            {metadata.totalMessages} messages • Last activity {formatDistanceToNow(new Date(metadata.lastMessageAt), { addSuffix: true })}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.direction === "OUTBOUND"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="text-sm">{message.body}</div>
                  
                  {message.mediaUrls && message.mediaUrls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.mediaUrls.map((url, index) => (
                        <div key={index} className="text-xs opacity-75">
                          📎 Media attachment
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                    <span>
                      {format(new Date(message.createdAt), "h:mm a")}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <MessageStatusBadge
                        status={message.status}
                        direction={message.direction}
                      />
                      {(message.status === "FAILED" || message.status === "UNDELIVERED") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-4 w-4 p-0 text-white hover:bg-white/20"
                          onClick={() => retryMessage(message.id)}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {(message.status === "FAILED" || message.status === "UNDELIVERED") && message.errorMessage && (
                    <div className="mt-1 text-xs opacity-75">
                      Error: {message.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
