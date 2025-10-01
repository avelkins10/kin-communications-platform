"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Message, 
  MessageTemplate, 
  Conversation,
  MessageCreateInput,
  MessageBulkInput,
  MessageSearchParams,
  ConversationSearchParams,
  MessageTemplateCreateInput,
  MessageTemplateUpdateInput,
  MessageTemplateSearchParams
} from "@/types/index";
import { useSocket } from '@/components/socket-provider';
import { MessageReceivedPayload, MessageStatusChangedPayload, ConversationUpdatedPayload } from '@/types/socket';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  searchMessages: (params: MessageSearchParams) => Promise<void>;
  sendMessage: (data: MessageCreateInput) => Promise<Message>;
  sendBulkMessage: (data: MessageBulkInput) => Promise<{ success: boolean; sent: number; failed: number; results: Message[]; errors: any[] }>;
  updateMessage: (id: string, data: Partial<Message>) => Promise<Message>;
  deleteMessage: (id: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useMessages(): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subscribe } = useSocket();

  const handleError = (err: any) => {
    console.error("Message operation error:", err);
    setError(err.message || "An error occurred");
  };

  const searchMessages = useCallback(async (params: MessageSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params.contactId) searchParams.append("contactId", params.contactId);
      if (params.direction) searchParams.append("direction", params.direction);
      if (params.status) searchParams.append("status", params.status);
      if (params.search) searchParams.append("search", params.search);
      if (params.dateFrom) searchParams.append("dateFrom", params.dateFrom);
      if (params.dateTo) searchParams.append("dateTo", params.dateTo);
      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const response = await fetch(`/api/messages?${searchParams}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (data: MessageCreateInput): Promise<Message> => {
    setLoading(true);
    setError(null);

    try {
      // Transform data to match API expectations
      const payload = {
        toNumber: data.toNumber,
        fromNumber: data.fromNumber,
        messageBody: data.body, // API expects messageBody, not body
        contactId: data.contactId,
        templateId: data.templateId
      };

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const newMessage = await response.json();
      setMessages(prev => [newMessage, ...prev]);
      return newMessage;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendBulkMessage = useCallback(async (data: MessageBulkInput) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send bulk message");
      }

      const result = await response.json();
      
      // Add successful messages to the list
      if (result.results && result.results.length > 0) {
        setMessages(prev => [...result.results, ...prev]);
      }
      
      return result;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMessage = useCallback(async (id: string, data: Partial<Message>): Promise<Message> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update message");
      }

      const updatedMessage = await response.json();
      setMessages(prev => prev.map(message => 
        message.id === id ? updatedMessage : message
      ));
      return updatedMessage;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMessage = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete message");
      }

      setMessages(prev => prev.filter(message => message.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMessages = useCallback(async (): Promise<void> => {
    await searchMessages({});
  }, [searchMessages]);

  // Real-time message updates
  useEffect(() => {
    const handleMessageReceived = (payload: MessageReceivedPayload) => {
      // Add new message to the list
      const newMessage: Message = {
        id: payload.id,
        twilioMessageSid: payload.messageSid,
        direction: payload.direction.toUpperCase() as any,
        status: payload.status.toUpperCase() as any,
        fromNumber: payload.from,
        toNumber: payload.to,
        body: payload.body,
        mediaUrls: [],
        conversationSid: payload.conversationId,
        numSegments: 1,
        price: null,
        priceUnit: null,
        errorCode: null,
        errorMessage: null,
        userId: payload.assignedTo || '',
        contactId: payload.customerId || '',
        contact: payload.customerName ? {
          id: payload.customerId || '',
          firstName: payload.customerName.split(' ')[0] || '',
          lastName: payload.customerName.split(' ').slice(1).join(' ') || '',
          organization: payload.department || '',
          phone: payload.from,
          email: '',
          type: 'CUSTOMER' as any
        } : null,
        templateId: null,
        template: null,
        createdAt: new Date(payload.createdAt),
        updatedAt: new Date(payload.updatedAt)
      };
      
      setMessages(prev => [newMessage, ...prev]);
    };

    const handleMessageStatusChanged = (payload: MessageStatusChangedPayload) => {
      // Update existing message status in the list
      setMessages(prev => prev.map(message => {
        if (message.id === payload.id) {
          return {
            ...message,
            status: payload.status.toUpperCase() as any,
            updatedAt: new Date(payload.updatedAt)
          };
        }
        return message;
      }));
    };

    const unsubscribeReceived = subscribe('message_received', handleMessageReceived);
    const unsubscribeStatusChanged = subscribe('message_status_changed', handleMessageStatusChanged);

    return () => {
      unsubscribeReceived();
      unsubscribeStatusChanged();
    };
  }, [subscribe]);

  // Load initial data
  useEffect(() => {
    searchMessages({});
  }, [searchMessages]);

  return {
    messages,
    loading,
    error,
    searchMessages,
    sendMessage,
    sendBulkMessage,
    updateMessage,
    deleteMessage,
    refreshMessages,
  };
}

// Hook for conversations management
interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  searchConversations: (params: ConversationSearchParams) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    console.error("Conversation operation error:", err);
    setError(err.message || "An error occurred");
  };

  const searchConversations = useCallback(async (params: ConversationSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params.contactType) searchParams.append("contactType", params.contactType);
      if (params.unreadOnly !== undefined) searchParams.append("unreadOnly", params.unreadOnly.toString());
      if (params.dateFrom) searchParams.append("dateFrom", params.dateFrom);
      if (params.dateTo) searchParams.append("dateTo", params.dateTo);
      if (params.search) searchParams.append("search", params.search);
      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const response = await fetch(`/api/conversations?${searchParams}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshConversations = useCallback(async (): Promise<void> => {
    await searchConversations({});
  }, [searchConversations]);

  // Load initial data
  useEffect(() => {
    searchConversations({});
  }, [searchConversations]);

  return {
    conversations,
    loading,
    error,
    searchConversations,
    refreshConversations,
  };
}

// Hook for individual conversation thread
interface UseConversationThreadReturn {
  messages: Message[];
  contact: any;
  metadata: any;
  loading: boolean;
  error: string | null;
  loadConversation: (contactId: string, markAsRead?: boolean) => Promise<void>;
  markAsRead: (contactId: string) => Promise<void>;
}

export function useConversationThread(): UseConversationThreadReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    console.error("Conversation thread error:", err);
    setError(err.message || "An error occurred");
  };

  const loadConversation = useCallback(async (contactId: string, markAsRead = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      if (markAsRead) searchParams.append("markAsRead", "true");

      const response = await fetch(`/api/conversations/${contactId}?${searchParams}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch conversation");
      }

      const data = await response.json();
      setMessages(data.messages || []);
      setContact(data.contact);
      setMetadata(data.metadata);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (contactId: string) => {
    try {
      await loadConversation(contactId, true);
    } catch (err) {
      handleError(err);
    }
  }, [loadConversation]);

  return {
    messages,
    contact,
    metadata,
    loading,
    error,
    loadConversation,
    markAsRead,
  };
}

// Hook for message templates management
interface UseMessageTemplatesReturn {
  templates: MessageTemplate[];
  loading: boolean;
  error: string | null;
  searchTemplates: (params: MessageTemplateSearchParams) => Promise<void>;
  createTemplate: (data: MessageTemplateCreateInput) => Promise<MessageTemplate>;
  updateTemplate: (id: string, data: MessageTemplateUpdateInput) => Promise<MessageTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  refreshTemplates: () => Promise<void>;
}

export function useMessageTemplates(): UseMessageTemplatesReturn {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    console.error("Message template operation error:", err);
    setError(err.message || "An error occurred");
  };

  const searchTemplates = useCallback(async (params: MessageTemplateSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params.category) searchParams.append("category", params.category);
      if (params.search) searchParams.append("search", params.search);
      if (params.isShared !== undefined) searchParams.append("isShared", params.isShared.toString());
      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const response = await fetch(`/api/message-templates?${searchParams}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch message templates");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (data: MessageTemplateCreateInput): Promise<MessageTemplate> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/message-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create template");
      }

      const newTemplate = await response.json();
      setTemplates(prev => [newTemplate, ...prev]);
      return newTemplate;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, data: MessageTemplateUpdateInput): Promise<MessageTemplate> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/message-templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update template");
      }

      const updatedTemplate = await response.json();
      setTemplates(prev => prev.map(template => 
        template.id === id ? updatedTemplate : template
      ));
      return updatedTemplate;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/message-templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete template");
      }

      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTemplates = useCallback(async (): Promise<void> => {
    await searchTemplates({});
  }, [searchTemplates]);

  // Load initial data
  useEffect(() => {
    searchTemplates({});
  }, [searchTemplates]);

  return {
    templates,
    loading,
    error,
    searchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates,
  };
}
