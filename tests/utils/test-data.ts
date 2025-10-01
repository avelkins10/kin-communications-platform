// KIN Communications Platform - Test Data
// Comprehensive test data for all testing scenarios

export const TEST_USERS = {
  admin: {
    name: 'QA Admin',
    email: 'qa-admin@example.com',
    password: 'password123',
    role: 'admin',
    phone: '+15551234567',
    isActive: true,
    permissions: ['read', 'write', 'delete', 'admin']
  },
  agent: {
    name: 'QA Agent',
    email: 'qa-agent@example.com',
    password: 'password123',
    role: 'agent',
    phone: '+15551234568',
    isActive: true,
    permissions: ['read', 'write']
  },
  supervisor: {
    name: 'QA Supervisor',
    email: 'qa-supervisor@example.com',
    password: 'password123',
    role: 'supervisor',
    phone: '+15551234569',
    isActive: true,
    permissions: ['read', 'write', 'supervise']
  },
  fieldCrew: {
    name: 'QA Field Crew',
    email: 'qa-field@example.com',
    password: 'password123',
    role: 'field_crew',
    phone: '+15551234570',
    isActive: true,
    permissions: ['read']
  },
  salesRep: {
    name: 'QA Sales Rep',
    email: 'qa-sales@example.com',
    password: 'password123',
    role: 'sales_rep',
    phone: '+15551234571',
    isActive: true,
    permissions: ['read', 'write']
  }
};

export const TEST_CONTACTS = {
  customer1: {
    name: 'Test Customer 1',
    phone: '+15552222222',
    email: 'customer1@example.com',
    company: 'Test Company 1',
    type: 'customer',
    address: '123 Test St, Test City, TC 12345',
    notes: 'Regular customer with standard service needs'
  },
  customer2: {
    name: 'Test Customer 2',
    phone: '+15553333333',
    email: 'customer2@example.com',
    company: 'Test Company 2',
    type: 'customer',
    address: '456 Test Ave, Test City, TC 12345',
    notes: 'Customer with multiple service locations'
  },
  vipCustomer: {
    name: 'VIP Customer',
    phone: '+15554444444',
    email: 'vip@example.com',
    company: 'VIP Company',
    type: 'vip',
    address: '789 VIP Blvd, VIP City, VC 54321',
    notes: 'High-value customer requiring priority service'
  },
  fieldCrewMember: {
    name: 'Field Crew Member',
    phone: '+15555555555',
    email: 'field@example.com',
    company: 'Field Services Inc',
    type: 'field_crew',
    address: '321 Field Rd, Field City, FC 67890',
    notes: 'Internal field crew member'
  },
  salesRep: {
    name: 'Sales Representative',
    phone: '+15556666666',
    email: 'sales@example.com',
    company: 'Sales Team LLC',
    type: 'sales_rep',
    address: '654 Sales St, Sales City, SC 09876',
    notes: 'Internal sales representative'
  }
};

export const TEST_PHONE_NUMBERS = {
  main: {
    number: '+15551234567',
    friendlyName: 'Main Business Line',
    type: 'main',
    isActive: true,
    configuration: {
      voiceUrl: '/api/voice/inbound',
      smsUrl: '/api/sms/inbound',
      statusCallback: '/api/voice/status'
    }
  },
  support: {
    number: '+15559876543',
    friendlyName: 'Support Line',
    type: 'support',
    isActive: true,
    configuration: {
      voiceUrl: '/api/voice/support',
      smsUrl: '/api/sms/support',
      statusCallback: '/api/voice/status'
    }
  },
  sales: {
    number: '+15551111111',
    friendlyName: 'Sales Line',
    type: 'sales',
    isActive: true,
    configuration: {
      voiceUrl: '/api/voice/sales',
      smsUrl: '/api/sms/sales',
      statusCallback: '/api/voice/status'
    }
  }
};

export const TEST_CALLS = {
  inbound1: {
    sid: 'CA_test_inbound_1',
    from: '+15552222222',
    to: '+15551234567',
    status: 'completed',
    direction: 'inbound',
    duration: 120,
    recordingUrl: 'https://example.com/recordings/inbound1.mp3',
    transcription: 'Customer called about service issue',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T10:02:00Z')
  },
  outbound1: {
    sid: 'CA_test_outbound_1',
    from: '+15551234567',
    to: '+15553333333',
    status: 'completed',
    direction: 'outbound',
    duration: 180,
    recordingUrl: 'https://example.com/recordings/outbound1.mp3',
    transcription: 'Follow-up call to customer',
    startTime: new Date('2024-01-01T11:00:00Z'),
    endTime: new Date('2024-01-01T11:03:00Z')
  },
  missed1: {
    sid: 'CA_test_missed_1',
    from: '+15554444444',
    to: '+15551234567',
    status: 'no-answer',
    direction: 'inbound',
    duration: 0,
    recordingUrl: null,
    transcription: null,
    startTime: new Date('2024-01-01T12:00:00Z'),
    endTime: new Date('2024-01-01T12:00:00Z')
  }
};

export const TEST_MESSAGES = {
  inbound1: {
    sid: 'SM_test_inbound_1',
    from: '+15552222222',
    to: '+15551234567',
    body: 'Hello, I need help with my service',
    status: 'delivered',
    direction: 'inbound',
    timestamp: new Date('2024-01-01T10:00:00Z')
  },
  outbound1: {
    sid: 'SM_test_outbound_1',
    from: '+15551234567',
    to: '+15553333333',
    body: 'Thank you for contacting us. We will help you shortly.',
    status: 'delivered',
    direction: 'outbound',
    timestamp: new Date('2024-01-01T10:01:00Z')
  },
  template1: {
    sid: 'SM_test_template_1',
    from: '+15551234567',
    to: '+15554444444',
    body: 'Your service appointment is scheduled for tomorrow at 2 PM.',
    status: 'delivered',
    direction: 'outbound',
    timestamp: new Date('2024-01-01T10:02:00Z'),
    templateId: 'appointment_reminder'
  }
};

export const TEST_VOICEMAILS = {
  voicemail1: {
    sid: 'VM_test_voicemail_1',
    from: '+15552222222',
    to: '+15551234567',
    transcription: 'Hello, this is a test voicemail message. I need help with my service.',
    recordingUrl: 'https://example.com/voicemails/voicemail1.mp3',
    duration: 45,
    status: 'unread',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    assignedTo: null
  },
  voicemail2: {
    sid: 'VM_test_voicemail_2',
    from: '+15553333333',
    to: '+15551234567',
    transcription: 'Another test voicemail message with longer content.',
    recordingUrl: 'https://example.com/voicemails/voicemail2.mp3',
    duration: 60,
    status: 'read',
    timestamp: new Date('2024-01-01T11:00:00Z'),
    assignedTo: 'qa-agent@example.com'
  },
  voicemail3: {
    sid: 'VM_test_voicemail_3',
    from: '+15554444444',
    to: '+15551234567',
    transcription: 'VIP customer voicemail requiring urgent attention.',
    recordingUrl: 'https://example.com/voicemails/voicemail3.mp3',
    duration: 30,
    status: 'unread',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    assignedTo: null,
    priority: 'high'
  }
};

export const TEST_QUICKBASE_DATA = {
  customers: [
    {
      id: 'QB_CUSTOMER_1',
      name: 'Test Company 1',
      phone: '+15552222222',
      email: 'customer1@example.com',
      address: '123 Test St, Test City, TC 12345',
      serviceType: 'residential',
      status: 'active',
      lastServiceDate: '2024-01-01',
      nextServiceDate: '2024-02-01'
    },
    {
      id: 'QB_CUSTOMER_2',
      name: 'Test Company 2',
      phone: '+15553333333',
      email: 'customer2@example.com',
      address: '456 Test Ave, Test City, TC 12345',
      serviceType: 'commercial',
      status: 'active',
      lastServiceDate: '2024-01-15',
      nextServiceDate: '2024-02-15'
    }
  ],
  projects: [
    {
      id: 'QB_PROJECT_1',
      customerId: 'QB_CUSTOMER_1',
      name: 'Service Call - Test Company 1',
      status: 'in_progress',
      assignedTo: 'Field Crew Member',
      startDate: '2024-01-01',
      endDate: '2024-01-02',
      description: 'Routine service call for residential customer'
    },
    {
      id: 'QB_PROJECT_2',
      customerId: 'QB_CUSTOMER_2',
      name: 'Installation - Test Company 2',
      status: 'scheduled',
      assignedTo: 'Field Crew Member',
      startDate: '2024-01-15',
      endDate: '2024-01-16',
      description: 'New installation for commercial customer'
    }
  ],
  activities: [
    {
      id: 'QB_ACTIVITY_1',
      projectId: 'QB_PROJECT_1',
      type: 'call',
      description: 'Customer called about service issue',
      timestamp: '2024-01-01T10:00:00Z',
      createdBy: 'QA Agent'
    },
    {
      id: 'QB_ACTIVITY_2',
      projectId: 'QB_PROJECT_2',
      type: 'email',
      description: 'Sent installation details to customer',
      timestamp: '2024-01-01T11:00:00Z',
      createdBy: 'QA Sales Rep'
    }
  ]
};

export const TEST_TASKROUTER_DATA = {
  workers: [
    {
      sid: 'WK_test_worker_1',
      friendlyName: 'QA Agent',
      attributes: {
        skills: ['voice', 'sms', 'support'],
        level: 'agent',
        available: true
      }
    },
    {
      sid: 'WK_test_worker_2',
      friendlyName: 'QA Supervisor',
      attributes: {
        skills: ['voice', 'sms', 'support', 'supervision'],
        level: 'supervisor',
        available: true
      }
    }
  ],
  taskQueues: [
    {
      sid: 'WQ_test_queue_1',
      friendlyName: 'Support Queue',
      targetWorkers: 'skills HAS "support"',
      maxReservedWorkers: 5
    },
    {
      sid: 'WQ_test_queue_2',
      friendlyName: 'Sales Queue',
      targetWorkers: 'skills HAS "sales"',
      maxReservedWorkers: 3
    }
  ],
  workflows: [
    {
      sid: 'WW_test_workflow_1',
      friendlyName: 'Customer Support Workflow',
      configuration: {
        taskRouting: {
          filters: [
            {
              expression: 'type == "support"',
              targets: [
                {
                  queue: 'WQ_test_queue_1',
                  priority: 10
                }
              ]
            }
          ]
        }
      }
    }
  ],
  tasks: [
    {
      sid: 'WT_test_task_1',
      attributes: {
        type: 'support',
        customer: 'Test Customer 1',
        priority: 'normal'
      },
      status: 'pending',
      assignmentStatus: 'pending'
    },
    {
      sid: 'WT_test_task_2',
      attributes: {
        type: 'sales',
        customer: 'Test Customer 2',
        priority: 'high'
      },
      status: 'assigned',
      assignmentStatus: 'assigned',
      assignedTo: 'WK_test_worker_1'
    }
  ]
};

export const TEST_ADMIN_CONFIGURATION = {
  businessHours: {
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '17:00', enabled: true },
    saturday: { start: '10:00', end: '14:00', enabled: true },
    sunday: { start: '10:00', end: '14:00', enabled: false }
  },
  ivrConfiguration: {
    welcomeMessage: 'Thank you for calling KIN Communications. Please listen to the following options.',
    options: [
      { key: '1', description: 'Press 1 for Sales', destination: 'sales' },
      { key: '2', description: 'Press 2 for Support', destination: 'support' },
      { key: '3', description: 'Press 3 for Billing', destination: 'billing' },
      { key: '0', description: 'Press 0 for Operator', destination: 'operator' }
    ]
  },
  routingRules: [
    {
      id: 'rule_1',
      name: 'VIP Customer Routing',
      condition: 'customer.type == "vip"',
      action: 'route_to_supervisor',
      priority: 1
    },
    {
      id: 'rule_2',
      name: 'Business Hours Routing',
      condition: 'time.business_hours == true',
      action: 'route_to_agent',
      priority: 2
    },
    {
      id: 'rule_3',
      name: 'After Hours Routing',
      condition: 'time.business_hours == false',
      action: 'route_to_voicemail',
      priority: 3
    }
  ]
};

export const TEST_REALTIME_EVENTS = {
  callEvents: [
    {
      type: 'call.initiated',
      data: {
        callSid: 'CA_test_call_1',
        from: '+15552222222',
        to: '+15551234567',
        timestamp: new Date('2024-01-01T10:00:00Z')
      }
    },
    {
      type: 'call.answered',
      data: {
        callSid: 'CA_test_call_1',
        timestamp: new Date('2024-01-01T10:00:05Z')
      }
    },
    {
      type: 'call.ended',
      data: {
        callSid: 'CA_test_call_1',
        duration: 120,
        timestamp: new Date('2024-01-01T10:02:00Z')
      }
    }
  ],
  messageEvents: [
    {
      type: 'message.received',
      data: {
        messageSid: 'SM_test_message_1',
        from: '+15552222222',
        to: '+15551234567',
        body: 'Hello, I need help',
        timestamp: new Date('2024-01-01T10:00:00Z')
      }
    },
    {
      type: 'message.sent',
      data: {
        messageSid: 'SM_test_message_2',
        from: '+15551234567',
        to: '+15553333333',
        body: 'Thank you for contacting us',
        timestamp: new Date('2024-01-01T10:01:00Z')
      }
    }
  ],
  presenceEvents: [
    {
      type: 'presence.available',
      data: {
        userId: 'qa-agent@example.com',
        status: 'available',
        timestamp: new Date('2024-01-01T10:00:00Z')
      }
    },
    {
      type: 'presence.busy',
      data: {
        userId: 'qa-agent@example.com',
        status: 'busy',
        timestamp: new Date('2024-01-01T10:01:00Z')
      }
    }
  ],
  queueEvents: [
    {
      type: 'queue.updated',
      data: {
        queueId: 'support_queue',
        waitingCount: 3,
        availableAgents: 2,
        timestamp: new Date('2024-01-01T10:00:00Z')
      }
    },
    {
      type: 'queue.agent_joined',
      data: {
        queueId: 'support_queue',
        agentId: 'qa-agent@example.com',
        timestamp: new Date('2024-01-01T10:01:00Z')
      }
    }
  ]
};

export const TEST_PERFORMANCE_SCENARIOS = {
  concurrentUsers: {
    userCount: 30,
    duration: 300, // 5 minutes
    scenarios: [
      {
        name: 'Voice Calls',
        weight: 0.3,
        actions: ['initiate_call', 'hold_call', 'end_call']
      },
      {
        name: 'SMS Messaging',
        weight: 0.4,
        actions: ['send_message', 'reply_message', 'use_template']
      },
      {
        name: 'Voicemail Processing',
        weight: 0.2,
        actions: ['play_voicemail', 'mark_read', 'assign_voicemail']
      },
      {
        name: 'Real-time Updates',
        weight: 0.1,
        actions: ['socket_connection', 'presence_update', 'queue_update']
      }
    ]
  },
  loadTest: {
    rampUpTime: 60, // 1 minute
    peakUsers: 50,
    duration: 300, // 5 minutes
    rampDownTime: 60 // 1 minute
  },
  stressTest: {
    initialUsers: 10,
    increment: 10,
    maxUsers: 100,
    incrementInterval: 30 // 30 seconds
  }
};

export const TEST_SECURITY_SCENARIOS = {
  webhookSecurity: {
    validSignature: 'test-valid-signature',
    invalidSignature: 'test-invalid-signature',
    replayAttack: {
      timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      signature: 'test-replay-signature'
    }
  },
  rateLimiting: {
    endpoint: '/api/voice/inbound',
    limit: 100,
    window: 60, // 1 minute
    testRequests: 150
  },
  unauthorizedAccess: {
    protectedEndpoints: [
      '/api/admin/users',
      '/api/admin/configuration',
      '/api/admin/phone-numbers'
    ],
    testCredentials: {
      invalidToken: 'invalid-token',
      expiredToken: 'expired-token',
      noToken: null
    }
  }
};

export const TEST_CROSS_BROWSER_SCENARIOS = {
  browsers: [
    { name: 'chrome', version: 'latest' },
    { name: 'firefox', version: 'latest' },
    { name: 'safari', version: 'latest' },
    { name: 'edge', version: 'latest' }
  ],
  features: [
    'webrtc',
    'websockets',
    'localStorage',
    'sessionStorage',
    'geolocation',
    'notifications'
  ],
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 }
  ]
};

export const TEST_MOBILE_SCENARIOS = {
  devices: [
    { name: 'iPhone 14', viewport: { width: 390, height: 844 } },
    { name: 'iPad', viewport: { width: 768, height: 1024 } },
    { name: 'Samsung Galaxy S21', viewport: { width: 360, height: 800 } }
  ],
  touchInteractions: [
    'tap',
    'double-tap',
    'long-press',
    'swipe',
    'pinch',
    'rotate'
  ],
  responsiveBreakpoints: [
    { name: 'mobile', maxWidth: 768 },
    { name: 'tablet', minWidth: 769, maxWidth: 1024 },
    { name: 'desktop', minWidth: 1025 }
  ]
};

export const TEST_ERROR_SCENARIOS = {
  networkErrors: [
    { type: 'timeout', duration: 30000 },
    { type: 'connection_lost', duration: 10000 },
    { type: 'server_error', status: 500 },
    { type: 'not_found', status: 404 }
  ],
  validationErrors: [
    { field: 'phone', value: 'invalid-phone', expected: 'valid phone number' },
    { field: 'email', value: 'invalid-email', expected: 'valid email address' },
    { field: 'message', value: '', expected: 'non-empty message' }
  ],
  businessLogicErrors: [
    { scenario: 'call_to_invalid_number', phone: '+15559999999' },
    { scenario: 'message_to_invalid_number', phone: '+15559999999' },
    { scenario: 'voicemail_to_invalid_number', phone: '+15559999999' }
  ]
};

export default {
  TEST_USERS,
  TEST_CONTACTS,
  TEST_PHONE_NUMBERS,
  TEST_CALLS,
  TEST_MESSAGES,
  TEST_VOICEMAILS,
  TEST_QUICKBASE_DATA,
  TEST_TASKROUTER_DATA,
  TEST_ADMIN_CONFIGURATION,
  TEST_REALTIME_EVENTS,
  TEST_PERFORMANCE_SCENARIOS,
  TEST_SECURITY_SCENARIOS,
  TEST_CROSS_BROWSER_SCENARIOS,
  TEST_MOBILE_SCENARIOS,
  TEST_ERROR_SCENARIOS
};

