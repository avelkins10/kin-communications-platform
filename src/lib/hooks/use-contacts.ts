"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Contact, ContactGroup, ContactCreateInput, ContactUpdateInput, ContactSearchParams, ContactImportResult } from "@/types/index";
import { logger } from "@/lib/logging/browser-logger";

interface UseContactsReturn {
  contacts: Contact[];
  groups: ContactGroup[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  searchContacts: (params: ContactSearchParams) => Promise<void>;
  createContact: (data: ContactCreateInput) => Promise<Contact>;
  updateContact: (id: string, data: ContactUpdateInput) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  callContact: (id: string) => Promise<void>;
  sendSms: (id: string, message: string) => Promise<void>;
  importContacts: (file: File) => Promise<ContactImportResult>;
  refreshContacts: () => Promise<void>;
  invalidateCache: () => Promise<void>;
}

export function useContacts(): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());

  const handleError = (err: any) => {
    logger.error("Contact operation error:", err);
    setError(err.message || "An error occurred");
  };

  const invalidateCache = useCallback(async () => {
    try {
      // Clear local cache
      cacheRef.current.clear();

      // Ask server to invalidate cache (best-effort)
      try {
        await fetch('/api/cache/invalidate', { method: 'POST' });
      } catch {
        // ignore network errors; fallback to refetch
      }

      logger.info('Contact cache invalidated');
    } catch (error) {
      logger.error('Failed to invalidate contact cache:', error);
    }
  }, []);

  const searchContacts = useCallback(async (params: ContactSearchParams) => {
    setLoading(true);
    setError(null);
    setFromCache(false);
    
    try {
      // Generate cache key
      const cacheKey = `contacts:${JSON.stringify(params)}`;
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes
      
      // Check local cache first
      const cached = cacheRef.current.get(cacheKey);
      if (cached && (now - cached.timestamp) < cacheExpiry) {
        setContacts(cached.data.contacts || []);
        setFromCache(true);
        setLoading(false);
        logger.debug('Contacts loaded from local cache');
        return;
      }

      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.append("search", params.search);
      if (params.type) searchParams.append("type", params.type);
      if (params.department) searchParams.append("department", params.department);
      if (params.isFavorite !== undefined) searchParams.append("isFavorite", params.isFavorite.toString());
      if (params.groupId) searchParams.append("groupId", params.groupId);
      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const startTime = Date.now();
      const response = await fetch(`/api/contacts?${searchParams}`);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error("Failed to fetch contacts");
      }

      const data = await response.json();
      
      // Cache the result locally
      cacheRef.current.set(cacheKey, {
        data,
        timestamp: now,
      });
      
      setContacts(data.contacts || []);
      
      // Log performance metrics
      logger.info('Contacts fetched', {
        count: data.contacts?.length || 0,
        responseTime: `${responseTime}ms`,
        fromCache: false,
      });
      
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createContact = useCallback(async (data: ContactCreateInput): Promise<Contact> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create contact");
      }

      const newContact = await response.json();
      
      // Optimistic update
      setContacts(prev => [newContact, ...prev]);
      
      // Invalidate cache
      await invalidateCache();
      
      logger.info('Contact created', { contactId: newContact.id });
      
      return newContact;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [invalidateCache]);

  const updateContact = useCallback(async (id: string, data: ContactUpdateInput): Promise<Contact> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update contact");
      }

      const updatedContact = await response.json();
      setContacts(prev => prev.map(contact => 
        contact.id === id ? updatedContact : contact
      ));
      return updatedContact;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteContact = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete contact");
      }

      setContacts(prev => prev.filter(contact => contact.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;

    try {
      await updateContact(id, { isFavorite: !contact.isFavorite });
    } catch (err) {
      handleError(err);
    }
  }, [contacts, updateContact]);

  const callContact = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/contacts/${id}/call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate call");
      }

      // TODO: Handle call initiation response
      console.log("Call initiated successfully");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendSms = useCallback(async (id: string, message: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/contacts/${id}/sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send SMS");
      }

      // TODO: Handle SMS sending response
      console.log("SMS sent successfully");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const importContacts = useCallback(async (file: File): Promise<ContactImportResult> => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import contacts");
      }

      const result = await response.json();
      
      // Refresh contacts after successful import
      if (result.success && result.imported > 0) {
        await refreshContacts();
      }
      
      return result;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshContacts = useCallback(async (): Promise<void> => {
    await searchContacts({});
  }, [searchContacts]);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch("/api/contact-groups");
      
      if (!response.ok) {
        throw new Error("Failed to fetch contact groups");
      }

      const data = await response.json();
      setGroups(data || []);
    } catch (err) {
      console.error("Error fetching contact groups:", err);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    searchContacts({});
    fetchGroups();
  }, [searchContacts, fetchGroups]);

  return {
    contacts,
    groups,
    loading,
    error,
    fromCache,
    searchContacts,
    createContact,
    updateContact,
    deleteContact,
    toggleFavorite,
    callContact,
    sendSms,
    importContacts,
    refreshContacts,
    invalidateCache,
  };
}

// Hook for contact groups management
interface UseContactGroupsReturn {
  groups: ContactGroup[];
  loading: boolean;
  error: string | null;
  createGroup: (data: { name: string; description?: string }) => Promise<ContactGroup>;
  updateGroup: (id: string, data: { name: string; description?: string }) => Promise<ContactGroup>;
  deleteGroup: (id: string) => Promise<void>;
  refreshGroups: () => Promise<void>;
}

export function useContactGroups(): UseContactGroupsReturn {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    console.error("Contact group operation error:", err);
    setError(err.message || "An error occurred");
  };

  const createGroup = useCallback(async (data: { name: string; description?: string }): Promise<ContactGroup> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/contact-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create contact group");
      }

      const newGroup = await response.json();
      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateGroup = useCallback(async (id: string, data: { name: string; description?: string }): Promise<ContactGroup> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/contact-groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update contact group");
      }

      const updatedGroup = await response.json();
      setGroups(prev => prev.map(group => 
        group.id === id ? updatedGroup : group
      ));
      return updatedGroup;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteGroup = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/contact-groups/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete contact group");
      }

      setGroups(prev => prev.filter(group => group.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshGroups = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/contact-groups");
      
      if (!response.ok) {
        throw new Error("Failed to fetch contact groups");
      }

      const data = await response.json();
      setGroups(data || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    refreshGroups,
  };
}
