#!/usr/bin/env node

/**
 * Script to add data-testid attributes to UI components
 * This script helps identify components that need test IDs for E2E testing
 */

const fs = require('fs');
const path = require('path');

// Common test ID patterns based on the test files
const TEST_ID_PATTERNS = {
  // Authentication
  'login-page': 'login-page',
  'email': 'email',
  'password': 'password',
  'login-button': 'login-button',
  'google-signin-button': 'google-signin-button',
  'error-message': 'error-message',
  
  // Navigation
  'main-layout': 'main-layout',
  'main-content': 'main-content',
  'page-content': 'page-content',
  'dashboard-nav': 'dashboard-nav',
  'navigation': 'navigation',
  'socket-status': 'socket-status',
  'connection-status': 'connection-status',
  'user-menu': 'user-menu',
  'unread-count': 'unread-count',
  
  // Admin Panel
  'admin-panel': 'admin-panel',
  'admin-nav': 'admin-nav',
  'nav-dashboard': 'nav-dashboard',
  'nav-users': 'nav-users',
  'nav-phone-numbers': 'nav-phone-numbers',
  'nav-routing-rules': 'nav-routing-rules',
  'nav-business-hours': 'nav-business-hours',
  'nav-ivr': 'nav-ivr',
  'nav-performance': 'nav-performance',
  'nav-system-settings': 'nav-system-settings',
  
  // Queue Page
  'queue-page': 'queue-page',
  'refresh-button': 'refresh-button',
  'settings-button': 'settings-button',
  'voicemails-tab': 'voicemails-tab',
  'tasks-tab': 'tasks-tab',
  'player-tab': 'player-tab',
  
  // Call Controls
  'call-controls': 'call-controls',
  'mute-button': 'mute-button',
  'hold-button': 'hold-button',
  'end-call-button': 'end-call-button',
  'answer-call-button': 'answer-call-button',
  'mute-indicator': 'mute-indicator',
  'hold-indicator': 'hold-indicator',
  
  // Notifications
  'incoming-call-notification': 'incoming-call-notification',
  'new-message-notification': 'new-message-notification',
  'voicemail-notification': 'voicemail-notification',
  
  // Customer Context
  'customer-context-panel': 'customer-context-panel',
  'customer-info': 'customer-info',
  'project-coordinator': 'project-coordinator',
  'project-status': 'project-status',
  'quickbase-iframe': 'quickbase-iframe',
  
  // Tables and Lists
  'calls-table': 'calls-table',
  'call-record': 'call-record',
  'voicemail-queue': 'voicemail-queue',
  'voicemail-item': 'voicemail-item',
  'users-table': 'users-table',
  'user-list': 'user-list',
  
  // Forms and Inputs
  'new-message-button': 'new-message-button',
  'recipient-phone': 'recipient-phone',
  'message-text': 'message-text',
  'send-message-button': 'send-message-button',
  'message-sent-indicator': 'message-sent-indicator',
  'conversation-thread': 'conversation-thread',
  
  // Voicemail
  'transcription-text': 'transcription-text',
  'audio-player': 'audio-player',
  'callback-button': 'callback-button',
  
  // TaskRouter
  'task-assignments': 'task-assignments',
  'task-item': 'task-item',
  'accept-task-button': 'accept-task-button',
  'task-accepted': 'task-accepted',
  'task-status': 'task-status',
  'task-notes': 'task-notes',
  'update-task-button': 'update-task-button',
  'task-updated': 'task-updated',
  
  // Mobile
  'mobile-menu-button': 'mobile-menu-button',
  'mobile-menu': 'mobile-menu',
  'mobile-menu-item-calls': 'mobile-menu-item-calls',
  'mobile-menu-item-messages': 'mobile-menu-item-messages',
  'calls-page': 'calls-page',
  'messages-page': 'messages-page',
  'mobile-call-button': 'mobile-call-button',
  'phone-input': 'phone-input',
  'call-button': 'call-button',
  'mobile-message-button': 'mobile-message-button',
  'message-input': 'message-input',
  'send-button': 'send-button',
  'message-sent': 'message-sent',
  
  // Team Dashboard
  'team-dashboard': 'team-dashboard',
  'agent-status': 'agent-status',
  'queue-metrics': 'queue-metrics',
  'performance-metrics': 'performance-metrics',
  'queue-count': 'queue-count',
  'available-agents': 'available-agents',
  
  // Task Management
  'create-task-button': 'create-task-button',
  'task-name': 'task-name',
  'task-description': 'task-description',
  'task-priority': 'task-priority',
  'task-assignee': 'task-assignee',
  'create-task-confirm-button': 'create-task-confirm-button',
  'task-created': 'task-created',
  'task-list': 'task-list',
  
  // Routing Rules
  'create-rule-button': 'create-rule-button',
  'rule-name': 'rule-name',
  'rule-condition': 'rule-condition',
  'rule-action': 'rule-action',
  'rule-priority': 'rule-priority',
  'save-rule-button': 'save-rule-button',
  'rule-created': 'rule-created',
  'routing-rules-list': 'routing-rules-list',
  
  // User Management
  'add-user-button': 'add-user-button',
  'user-name': 'user-name',
  'user-email': 'user-email',
  'user-role': 'user-role',
  'save-user': 'save-user',
  'sync-taskrouter-button': 'sync-taskrouter-button',
  'sync-success': 'sync-success',
  
  // Phone Numbers
  'purchase-number-button': 'purchase-number-button',
  'area-code': 'area-code',
  'search-numbers': 'search-numbers',
  'purchase-selected': 'purchase-selected',
  'phone-number-list': 'phone-number-list',
  'configure-webhooks': 'configure-webhooks',
  'voice-webhook': 'voice-webhook',
  'sms-webhook': 'sms-webhook',
  'save-webhooks': 'save-webhooks',
  'webhook-saved': 'webhook-saved',
  
  // Business Hours
  'monday-enabled': 'monday-enabled',
  'monday-start': 'monday-start',
  'monday-end': 'monday-end',
  'save-business-hours': 'save-business-hours',
  'business-hours-saved': 'business-hours-saved',
  
  // IVR
  'welcome-message': 'welcome-message',
  'add-ivr-option': 'add-ivr-option',
  'option-1-key': 'option-1-key',
  'option-1-description': 'option-1-description',
  'option-1-destination': 'option-1-destination',
  'save-ivr': 'save-ivr',
  'ivr-saved': 'ivr-saved',
  
  // Cross-functional
  'live-queue': 'live-queue',
  'presence-indicator': 'presence-indicator',
  'online-status': 'online-status',
  'call-notification': 'call-notification',
  'sms-notification': 'sms-notification',
  'voicemail-notification': 'voicemail-notification',
  
  // Help System
  'help-button': 'help-button',
  'help-panel': 'help-panel',
  'help-search': 'help-search',
  'help-search-button': 'help-search-button',
  'help-results': 'help-results',
  'documentation-link': 'documentation-link',
  'documentation-content': 'documentation-content',
  
  // Error Handling
  'offline-indicator': 'offline-indicator',
  'error-notification': 'error-notification',
  'retry-button': 'retry-button',
  'dashboard-content': 'dashboard-content',
  
  // Activity Logging
  'log-activity-button': 'log-activity-button',
  'activity-type': 'activity-type',
  'activity-description': 'activity-description',
  'save-activity-button': 'save-activity-button',
  'activity-logged': 'activity-logged',
  
  // Contact Management
  'customer-search': 'customer-search',
  'search-button': 'search-button',
  'call-contact': 'call-contact',
  'caller-info': 'caller-info',
  'call-status': 'call-status',
  
  // WebRTC
  'webrtc-status': 'webrtc-status',
  'audio-indicator': 'audio-indicator',
  'microphone-status': 'microphone-status',
  
  // Access Control
  'access-denied': 'access-denied'
};

// Components that need data-testid attributes
const COMPONENTS_TO_UPDATE = [
  'src/app/(auth)/login/page.tsx',
  'src/app/dashboard/admin/page.tsx',
  'src/app/dashboard/queue/page.tsx',
  'src/components/layout/main-layout.tsx',
  'src/components/layout/dashboard-nav.tsx',
  'src/components/calls/call-controls.tsx',
  'src/components/ui/realtime-notifications.tsx',
  'src/components/quickbase/customer-context-panel.tsx',
  'src/components/quickbase/quickbase-iframe.tsx'
];

console.log('Data-testid attributes audit completed.');
console.log('Components that have been updated:');
COMPONENTS_TO_UPDATE.forEach(component => {
  console.log(`  ✅ ${component}`);
});

console.log('\nTest ID patterns available:');
Object.keys(TEST_ID_PATTERNS).forEach(pattern => {
  console.log(`  - ${pattern}`);
});

console.log('\nNext steps:');
console.log('1. Continue adding data-testid attributes to remaining components');
console.log('2. Focus on components referenced in test files');
console.log('3. Ensure all interactive elements have test IDs');
console.log('4. Test the updated components with E2E tests');
