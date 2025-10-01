'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Voicemail, 
  VoicemailSearchParams, 
  VoicemailBulkAction,
  VoicemailStats 
} from '@/types/index';
import { useSocket } from '@/components/socket-provider';
import { VoicemailCreatedPayload, VoicemailUpdatedPayload } from '@/types/socket';

interface UseVoicemailsReturn {
  voicemails: Voicemail[];
  loading: boolean;
  error: string | null;
  searchVoicemails: (params: VoicemailSearchParams) => Promise<void>;
  createVoicemail: (data: any) => Promise<Voicemail>;
  updateVoicemail: (id: string, data: any) => Promise<Voicemail>;
  deleteVoicemail: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  assignVoicemail: (id: string, assignedToId: string, notes?: string) => Promise<void>;
  setPriority: (id: string, priority: string) => Promise<void>;
  callbackVoicemail: (id: string) => Promise<void>;
  bulkAction: (action: VoicemailBulkAction) => Promise<void>;
  refreshVoicemails: () => Promise<void>;
}

export function useVoicemails(): UseVoicemailsReturn {
  const [voicemails, setVoicemails] = useState<Voicemail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { subscribe } = useSocket();

  const handleError = (err: any) => {
    console.error('Voicemail operation error:', err);
    setError(err.message || 'An error occurred');
  };

  const searchVoicemails = useCallback(async (params: VoicemailSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.append('search', params.search);
      if (params.assignedToId) searchParams.append('assignedToId', params.assignedToId);
      if (params.isRead !== undefined) searchParams.append('isRead', params.isRead.toString());
      if (params.contactId) searchParams.append('contactId', params.contactId);
      if (params.priority) searchParams.append('priority', params.priority);
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/voicemails?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch voicemails');
      }

      const data = await response.json();
      setVoicemails(data.voicemails || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createVoicemail = useCallback(async (data: any): Promise<Voicemail> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/voicemails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create voicemail');
      }

      const newVoicemail = await response.json();
      setVoicemails(prev => [newVoicemail, ...prev]);
      return newVoicemail;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVoicemail = useCallback(async (id: string, data: any): Promise<Voicemail> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/voicemails/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update voicemail');
      }

      const updatedVoicemail = await response.json();
      setVoicemails(prev => prev.map(voicemail => 
        voicemail.id === id ? updatedVoicemail : voicemail
      ));
      return updatedVoicemail;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVoicemail = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/voicemails/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete voicemail');
      }

      setVoicemails(prev => prev.filter(voicemail => voicemail.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/voicemails/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark voicemail as read');
      }

      const result = await response.json();
      setVoicemails(prev => prev.map(voicemail => 
        voicemail.id === id ? result.voicemail : voicemail
      ));
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, []);

  const markAsUnread = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/voicemails/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark voicemail as unread');
      }

      const result = await response.json();
      setVoicemails(prev => prev.map(voicemail => 
        voicemail.id === id ? result.voicemail : voicemail
      ));
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, []);

  const assignVoicemail = useCallback(async (id: string, assignedToId: string, notes?: string): Promise<void> => {
    try {
      const response = await fetch(`/api/voicemails/${id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          assignedToId, 
          notes,
          sendEmailNotification: true 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign voicemail');
      }

      const result = await response.json();
      setVoicemails(prev => prev.map(voicemail => 
        voicemail.id === id ? result.voicemail : voicemail
      ));
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, []);

  const setPriority = useCallback(async (id: string, priority: string): Promise<void> => {
    try {
      await updateVoicemail(id, { priority });
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [updateVoicemail]);

  const callbackVoicemail = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/voicemails/${id}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate callback');
      }

      const result = await response.json();
      console.log('Callback initiated:', result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const bulkAction = useCallback(async (action: VoicemailBulkAction): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/voicemails/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform bulk action');
      }

      const result = await response.json();
      console.log('Bulk action completed:', result);
      
      // Refresh voicemails to get updated data
      await refreshVoicemails();
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshVoicemails = useCallback(async (): Promise<void> => {
    await searchVoicemails({});
  }, [searchVoicemails]);

  // Real-time voicemail updates
  useEffect(() => {
    const handleVoicemailCreated = (payload: VoicemailCreatedPayload) => {
      // Add new voicemail to the list
      const newVoicemail: Voicemail = {
        id: payload.id,
        fromNumber: payload.callerId,
        duration: payload.duration,
        audioUrl: payload.recordingUrl,
        status: payload.status === 'new' ? 'UNREAD' : 'READ',
        priority: payload.priority.toUpperCase() as any,
        assignedToId: payload.assignedTo,
        assignedTo: payload.assignedToName ? {
          id: payload.assignedTo || '',
          name: payload.assignedToName,
          email: ''
        } : null,
        contact: {
          id: '',
          firstName: payload.callerName?.split(' ')[0] || '',
          lastName: payload.callerName?.split(' ').slice(1).join(' ') || '',
          organization: payload.department || '',
          phone: payload.callerId,
          email: '',
          type: 'CUSTOMER' as any
        },
        createdAt: new Date(payload.createdAt),
        updatedAt: new Date(payload.updatedAt),
        readAt: payload.status === 'read' ? new Date(payload.updatedAt) : null,
        notes: null,
        callId: null,
        call: null
      };
      
      setVoicemails(prev => [newVoicemail, ...prev]);
    };

    const handleVoicemailUpdated = (payload: VoicemailUpdatedPayload) => {
      // Update existing voicemail in the list
      setVoicemails(prev => prev.map(voicemail => {
        if (voicemail.id === payload.id) {
          return {
            ...voicemail,
            status: payload.status === 'new' ? 'UNREAD' : 'READ',
            priority: payload.priority.toUpperCase() as any,
            assignedToId: payload.assignedTo,
            assignedTo: payload.assignedToName ? {
              id: payload.assignedTo || '',
              name: payload.assignedToName,
              email: ''
            } : null,
            readAt: payload.status === 'read' ? new Date(payload.updatedAt) : null,
            updatedAt: new Date(payload.updatedAt)
          };
        }
        return voicemail;
      }));
    };

    const unsubscribeCreated = subscribe('voicemail_created', handleVoicemailCreated);
    const unsubscribeUpdated = subscribe('voicemail_updated', handleVoicemailUpdated);

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [subscribe]);

  // Load initial data
  useEffect(() => {
    searchVoicemails({});
  }, [searchVoicemails]);

  return {
    voicemails,
    loading,
    error,
    searchVoicemails,
    createVoicemail,
    updateVoicemail,
    deleteVoicemail,
    markAsRead,
    markAsUnread,
    assignVoicemail,
    setPriority,
    callbackVoicemail,
    bulkAction,
    refreshVoicemails,
  };
}

// Hook for individual voicemail management
interface UseVoicemailReturn {
  voicemail: Voicemail | null;
  loading: boolean;
  error: string | null;
  fetchVoicemail: (id: string) => Promise<void>;
  updateVoicemail: (data: any) => Promise<void>;
  deleteVoicemail: () => Promise<void>;
  markAsRead: () => Promise<void>;
  markAsUnread: () => Promise<void>;
  assignVoicemail: (assignedToId: string, notes?: string) => Promise<void>;
  setPriority: (priority: string) => Promise<void>;
  callbackVoicemail: () => Promise<void>;
}

export function useVoicemail(id?: string): UseVoicemailReturn {
  const [voicemail, setVoicemail] = useState<Voicemail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    console.error('Voicemail operation error:', err);
    setError(err.message || 'An error occurred');
  };

  const fetchVoicemail = useCallback(async (voicemailId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/voicemails/${voicemailId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch voicemail');
      }

      const data = await response.json();
      setVoicemail(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVoicemail = useCallback(async (data: any) => {
    if (!voicemail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/voicemails/${voicemail.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update voicemail');
      }

      const updatedVoicemail = await response.json();
      setVoicemail(updatedVoicemail);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [voicemail]);

  const deleteVoicemail = useCallback(async () => {
    if (!voicemail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/voicemails/${voicemail.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete voicemail');
      }

      setVoicemail(null);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [voicemail]);

  const markAsRead = useCallback(async () => {
    if (!voicemail) return;
    
    try {
      const response = await fetch(`/api/voicemails/${voicemail.id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark voicemail as read');
      }

      const result = await response.json();
      setVoicemail(result.voicemail);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [voicemail]);

  const markAsUnread = useCallback(async () => {
    if (!voicemail) return;
    
    try {
      const response = await fetch(`/api/voicemails/${voicemail.id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: false }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark voicemail as unread');
      }

      const result = await response.json();
      setVoicemail(result.voicemail);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [voicemail]);

  const assignVoicemail = useCallback(async (assignedToId: string, notes?: string) => {
    if (!voicemail) return;
    
    try {
      const response = await fetch(`/api/voicemails/${voicemail.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          assignedToId, 
          notes,
          sendEmailNotification: true 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign voicemail');
      }

      const result = await response.json();
      setVoicemail(result.voicemail);
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [voicemail]);

  const setPriority = useCallback(async (priority: string) => {
    if (!voicemail) return;
    
    try {
      await updateVoicemail({ priority });
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [voicemail, updateVoicemail]);

  const callbackVoicemail = useCallback(async () => {
    if (!voicemail) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/voicemails/${voicemail.id}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate callback');
      }

      const result = await response.json();
      console.log('Callback initiated:', result);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [voicemail]);

  // Load voicemail when id changes
  useEffect(() => {
    if (id) {
      fetchVoicemail(id);
    }
  }, [id, fetchVoicemail]);

  return {
    voicemail,
    loading,
    error,
    fetchVoicemail,
    updateVoicemail,
    deleteVoicemail,
    markAsRead,
    markAsUnread,
    assignVoicemail,
    setPriority,
    callbackVoicemail,
  };
}

// Hook for voicemail statistics
interface UseVoicemailStatsReturn {
  stats: VoicemailStats | null;
  loading: boolean;
  error: string | null;
  fetchStats: (params?: { dateFrom?: string; dateTo?: string; userId?: string }) => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useVoicemailStats(): UseVoicemailStatsReturn {
  const [stats, setStats] = useState<VoicemailStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any) => {
    console.error('Voicemail stats error:', err);
    setError(err.message || 'An error occurred');
  };

  const fetchStats = useCallback(async (params?: { dateFrom?: string; dateTo?: string; userId?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params?.userId) searchParams.append('userId', params.userId);

      const response = await fetch(`/api/voicemails/stats?${searchParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch voicemail stats');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Load initial stats
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    fetchStats,
    refreshStats,
  };
}
