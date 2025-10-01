'use client';

import React, { useState } from 'react';
import { UnifiedQueueDisplay } from '@/components/queue/unified-queue-display';
import { QueueStatsBanner } from '@/components/queue/queue-stats-banner';
import { CustomerContextSidebar } from '@/components/ui/customer-context-sidebar';
import { QuickActionsToolbar } from '@/components/ui/quick-actions-toolbar';
import { RealTimeNotificationSystem } from '@/components/ui/real-time-notification-system';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useSession } from 'next-auth/react';
import { useProfessionalInteractions } from '@/lib/hooks/use-professional-interactions';
import { useLayout } from '@/lib/hooks/use-layout';
import { toast } from 'sonner';

interface QueueItem {
  id: string;
  type: 'voicemail' | 'task' | 'call' | 'message';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  customerName: string;
  customerPhone?: string;
  projectCoordinator?: string;
  projectStatus?: 'PRE-PTO' | 'POST-PTO';
  slaDeadline?: Date;
  createdAt: Date;
  assignedTo?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'escalated';
  description?: string;
  metadata?: Record<string, any>;
}

interface CustomerData {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  projectCoordinator?: {
    name: string;
    phone?: string;
    email?: string;
  };
  projectStatus?: 'PRE-PTO' | 'POST-PTO';
  slaDeadline?: Date;
  lastInteraction?: Date;
  interactionHistory?: Array<{
    id: string;
    type: 'call' | 'text' | 'email' | 'voicemail';
    timestamp: Date;
    summary: string;
    status: 'completed' | 'pending' | 'failed';
  }>;
  quickbaseUrl?: string;
}

function QueuePageContent() {
  const { data: session } = useSession();
  const user = session?.user;
  const { useButtonState, useNotification } = useProfessionalInteractions();
  const { setMode } = useLayout();
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [queueView, setQueueView] = useState<'my' | 'team'>('my'); // Default to "My Queue"

  // Hydration fix: only run on client
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Set layout mode to QUEUE_MANAGEMENT
  React.useEffect(() => {
    if (isClient) {
      setMode('QUEUE_MANAGEMENT');
    }
  }, [setMode, isClient]);

  const callButtonState = useButtonState();
  const textButtonState = useButtonState();
  const callbackButtonState = useButtonState();
  const notification = useNotification();

  // Mock customer data - in real app, this would come from API
  const mockCustomerData: CustomerData = {
    id: '1',
    name: 'John Smith',
    phone: '+1 (555) 123-4567',
    email: 'john.smith@example.com',
    company: 'Acme Corporation',
    projectCoordinator: {
      name: 'Sarah Johnson',
      phone: '+1 (555) 987-6543',
      email: 'sarah.johnson@kin.com',
    },
    projectStatus: 'PRE-PTO',
    slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    lastInteraction: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    interactionHistory: [
      {
        id: '1',
        type: 'call',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        summary: 'Initial consultation call',
        status: 'completed',
      },
      {
        id: '2',
        type: 'voicemail',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        summary: 'Follow-up voicemail left',
        status: 'pending',
      },
    ],
    quickbaseUrl: 'https://kin.quickbase.com/db/example',
  };

  const handleItemSelect = async (item: QueueItem) => {
    setSelectedItem(item);
    setIsLoadingCustomer(true);
    
    // Simulate loading customer data
    setTimeout(() => {
      setCustomerData(mockCustomerData);
      setIsLoadingCustomer(false);
    }, 500);
  };

  const handleCall = async (phone?: string) => {
    if (!phone) {
      notification.showError('No phone number available');
      return;
    }

    await callButtonState.executeWithState(async () => {
      // Simulate call initiation
      await new Promise(resolve => setTimeout(resolve, 1000));
      notification.showSuccess(`Calling ${phone}`);
    });
  };

  const handleText = async (phone?: string) => {
    if (!phone) {
      notification.showError('No phone number available');
      return;
    }

    await textButtonState.executeWithState(async () => {
      // Simulate text message
      await new Promise(resolve => setTimeout(resolve, 1000));
      notification.showSuccess(`Text sent to ${phone}`);
    });
  };

  const handleCallback = async () => {
    await callbackButtonState.executeWithState(async () => {
      // Simulate callback scheduling
      await new Promise(resolve => setTimeout(resolve, 1000));
      notification.showSuccess('Callback scheduled');
    });
  };

  const handleEmail = async (email?: string) => {
    if (!email) {
      notification.showError('No email address available');
      return;
    }

    // Simulate email opening
    window.open(`mailto:${email}`, '_blank');
    notification.showInfo(`Opening email to ${email}`);
  };

  const handleAddNote = () => {
    notification.showInfo('Add note functionality would open here');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        {/* Refined Header */}
        <div className="bg-background border-b shadow-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    Communication Queue
                    {queueView === 'my' && (
                      <span className="text-sm font-normal px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                        Personal
                      </span>
                    )}
                    {queueView === 'team' && (
                      <span className="text-sm font-normal px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                        Team-Wide
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {queueView === 'my'
                      ? 'Focus on your assigned work items and priorities'
                      : 'Monitor team performance and workload distribution'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <RealTimeNotificationSystem />
                {selectedItem && (
                  <QuickActionsToolbar
                    selectedItem={{
                      id: selectedItem.id,
                      type: selectedItem.type,
                      customerPhone: selectedItem.customerPhone
                    }}
                    onCall={handleCall}
                    onText={handleText}
                    onCallback={handleCallback}
                  />
                )}
              </div>
            </div>

            {/* Enhanced Queue View Toggle */}
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg w-fit">
              <button
                onClick={() => setQueueView('my')}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${
                  queueView === 'my'
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Queue
              </button>
              <button
                onClick={() => setQueueView('team')}
                className={`px-5 py-2 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${
                  queueView === 'team'
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Team Queue
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Queue Content - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Real-time Stats Banner */}
              <QueueStatsBanner queueView={queueView} userId={user?.id} />

              {/* Queue Display */}
              <div className="bg-background rounded-xl shadow-sm border">
                <UnifiedQueueDisplay
                  onItemSelect={(item) => handleItemSelect(item as any)}
                  selectedItemId={selectedItem?.id}
                  queueView={queueView}
                  userId={user?.id}
                />
              </div>
            </div>

            {/* Sidebar - Takes 1 column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Customer Context */}
              {isLoadingCustomer ? (
                <div className="bg-background rounded-xl shadow-sm border p-6">
                  <LoadingState variant="skeleton" size="lg" />
                </div>
              ) : selectedItem ? (
                <div className="bg-background rounded-xl shadow-sm border overflow-hidden">
                  <CustomerContextSidebar
                    customer={customerData || undefined}
                    onCall={handleCall}
                    onText={handleText}
                    onEmail={handleEmail}
                    onAddNote={handleAddNote}
                  />
                </div>
              ) : (
                <div className="bg-background rounded-xl shadow-sm border p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Select an Item</h3>
                  <p className="text-sm text-muted-foreground">
                    Click on any queue item to view customer details and take action
                  </p>
                </div>
              )}

              {/* Quick Stats Card */}
              <div className="bg-background rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group">
                    <span className="text-sm font-medium">Claim Next Item</span>
                    <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group">
                    <span className="text-sm font-medium">View My Performance</span>
                    <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group">
                    <span className="text-sm font-medium">Export Queue Data</span>
                    <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function QueuePage() {
  return <QueuePageContent />;
}


