/**
 * TaskRouter Terminology Translation Map
 *
 * This file maps Twilio's technical TaskRouter terms to user-friendly
 * business terminology that makes sense for solar company employees.
 *
 * Backend uses real TaskRouter terms, frontend shows friendly names.
 */

// System-level terminology
export const SYSTEM_TERMS = {
  taskrouter: 'Call Director',
  workspace: 'Call Center',
  workflow: 'Routing Rules',
  workflows: 'Routing Rules',
} as const;

// Agent/Worker terminology
export const AGENT_TERMS = {
  worker: 'agent',
  workers: 'Team Members',
  Worker: 'Agent',
  Workers: 'Team Members',
} as const;

// Activity/Status terminology
export const STATUS_TERMS = {
  activity: 'status',
  activities: 'Statuses',
  Activity: 'Status',
  Activities: 'Statuses',
} as const;

// Task/Call terminology
export const CALL_TERMS = {
  task: 'call',
  tasks: 'calls',
  Task: 'Call',
  Tasks: 'Calls',
  reservation: 'assigned call',
  reservations: 'assigned calls',
  Reservation: 'Assigned Call',
  Reservations: 'Assigned Calls',
} as const;

// Queue/Team terminology
export const TEAM_TERMS = {
  queue: 'team',
  queues: 'Teams',
  Queue: 'Team',
  Queues: 'Teams',
  taskQueue: 'team',
  taskQueues: 'Teams',
  TaskQueue: 'Team',
  TaskQueues: 'Teams',
} as const;

// Combined terminology map
export const TERMINOLOGY_MAP = {
  ...SYSTEM_TERMS,
  ...AGENT_TERMS,
  ...STATUS_TERMS,
  ...CALL_TERMS,
  ...TEAM_TERMS,
} as const;

/**
 * Activity/Status Configurations
 * Maps internal activity names to user-friendly display properties
 */
export interface ActivityConfig {
  display: string;
  description: string;
  icon: string;
  color: 'green' | 'red' | 'orange' | 'yellow' | 'gray' | 'blue' | 'purple';
  available: boolean;
}

export const ACTIVITY_CONFIGS: Record<string, ActivityConfig> = {
  // Standard available statuses
  available: {
    display: 'Available',
    description: 'Ready for calls',
    icon: '✅',
    color: 'green',
    available: true,
  },

  // Busy/unavailable statuses
  busy: {
    display: 'On a Call',
    description: 'Currently helping someone',
    icon: '📞',
    color: 'red',
    available: false,
  },

  // Break statuses
  break: {
    display: 'Break',
    description: 'Taking a short break',
    icon: '☕',
    color: 'orange',
    available: false,
  },

  lunch: {
    display: 'Lunch',
    description: 'Lunch break',
    icon: '🍽️',
    color: 'orange',
    available: false,
  },

  // Work statuses
  admin_work: {
    display: 'Admin Work',
    description: 'Paperwork and emails',
    icon: '📝',
    color: 'yellow',
    available: false,
  },

  meeting: {
    display: 'In Meeting',
    description: 'Team or client meeting',
    icon: '👥',
    color: 'blue',
    available: false,
  },

  training: {
    display: 'Training',
    description: 'Learning session',
    icon: '📚',
    color: 'purple',
    available: false,
  },

  // Offline statuses
  offline: {
    display: 'Offline',
    description: 'Not working',
    icon: '🔴',
    color: 'gray',
    available: false,
  },

  // Twilio default activities (lowercase versions)
  'available': {
    display: 'Available',
    description: 'Ready for calls',
    icon: '✅',
    color: 'green',
    available: true,
  },

  'offline': {
    display: 'Offline',
    description: 'Not working',
    icon: '🔴',
    color: 'gray',
    available: false,
  },

  'unavailable': {
    display: 'Unavailable',
    description: 'Not available for calls',
    icon: '⛔',
    color: 'red',
    available: false,
  },
};

/**
 * Queue/Team Configurations
 * Maps queue identifiers to user-friendly team information
 */
export interface QueueConfig {
  display: string;
  description: string;
  priority: number;
  skills: string[];
  icon?: string;
  color?: string;
}

export const QUEUE_CONFIGS: Record<string, QueueConfig> = {
  // Sales teams
  sales_queue: {
    display: 'Sales Team',
    description: 'New customers and leads',
    priority: 1,
    skills: ['sales', 'quotes', 'residential'],
    icon: '💼',
    color: 'blue',
  },

  inbound_sales: {
    display: 'Inbound Sales',
    description: 'Incoming sales inquiries',
    priority: 1,
    skills: ['sales', 'inbound'],
    icon: '📞',
    color: 'blue',
  },

  // Support teams
  support_queue: {
    display: 'Customer Support',
    description: 'Existing customer help',
    priority: 2,
    skills: ['support', 'troubleshooting', 'billing'],
    icon: '🛟',
    color: 'green',
  },

  technical_support: {
    display: 'Technical Support',
    description: 'Technical issues and system problems',
    priority: 2,
    skills: ['technical', 'troubleshooting', 'systems'],
    icon: '🔧',
    color: 'purple',
  },

  // Installation teams
  installation_queue: {
    display: 'Installation Team',
    description: 'Scheduling and field support',
    priority: 3,
    skills: ['installation', 'scheduling', 'field'],
    icon: '⚡',
    color: 'orange',
  },

  scheduling: {
    display: 'Scheduling',
    description: 'Installation appointments',
    priority: 3,
    skills: ['scheduling', 'calendar'],
    icon: '📅',
    color: 'yellow',
  },

  // Escalation
  escalation_queue: {
    display: 'Escalations',
    description: 'Urgent issues and complaints',
    priority: 0,
    skills: ['management', 'escalation', 'supervisor'],
    icon: '🚨',
    color: 'red',
  },

  management: {
    display: 'Management',
    description: 'Manager and supervisor queue',
    priority: 0,
    skills: ['management', 'supervisor'],
    icon: '👔',
    color: 'red',
  },

  // General/Everyone queue
  everyone: {
    display: 'All Available Agents',
    description: 'Any available team member',
    priority: 4,
    skills: [],
    icon: '👥',
    color: 'gray',
  },
};

/**
 * TaskRouter Event Types with User-Friendly Messages
 */
export const EVENT_MESSAGES: Record<string, (data: any) => string> = {
  'task.created': (data) => `New call from ${data.from || 'unknown number'}`,
  'task.assigned': (data) => `Call assigned to ${data.workerName}`,
  'task.completed': () => 'Call ended',
  'task.canceled': () => 'Call canceled',
  'task.wrapup': () => 'Completing call notes',

  'reservation.created': (data) => `Ringing ${data.workerName}...`,
  'reservation.accepted': (data) => `${data.workerName} answered`,
  'reservation.rejected': (data) => `${data.workerName} declined - finding another agent`,
  'reservation.timeout': (data) => `${data.workerName} didn't answer - reassigning`,
  'reservation.canceled': () => 'Call reassigned',
  'reservation.rescinded': () => 'Call assignment withdrawn',

  'worker.activity.update': (data) => {
    const activity = ACTIVITY_CONFIGS[data.activityName?.toLowerCase()];
    return `${data.workerName} is now ${activity?.display || data.activityName}`;
  },
  'worker.attributes.update': (data) => `${data.workerName} updated profile`,
  'worker.capacity.update': (data) => `${data.workerName} capacity changed`,
};

/**
 * Helper to get activity configuration by name (case-insensitive)
 */
export function getActivityConfig(activityName: string): ActivityConfig | undefined {
  const normalized = activityName?.toLowerCase().replace(/\s+/g, '_');
  return ACTIVITY_CONFIGS[normalized];
}

/**
 * Helper to get queue configuration by identifier (case-insensitive)
 */
export function getQueueConfig(queueIdentifier: string): QueueConfig | undefined {
  const normalized = queueIdentifier?.toLowerCase().replace(/\s+/g, '_');
  return QUEUE_CONFIGS[normalized];
}

/**
 * Helper to translate any term from technical to friendly
 */
export function translateTerm(term: string): string {
  return TERMINOLOGY_MAP[term as keyof typeof TERMINOLOGY_MAP] || term;
}