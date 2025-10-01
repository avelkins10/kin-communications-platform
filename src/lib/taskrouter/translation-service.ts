/**
 * TaskRouter Translation Service
 *
 * Translates between Twilio TaskRouter's technical terminology
 * and user-friendly business terms for the frontend.
 *
 * Usage:
 * - Backend/API: Use real TaskRouter terms when calling Twilio
 * - Frontend/UI: Use translated terms via this service
 * - Webhooks: Translate incoming events before showing to users
 */

import {
  TERMINOLOGY_MAP,
  ACTIVITY_CONFIGS,
  QUEUE_CONFIGS,
  EVENT_MESSAGES,
  getActivityConfig,
  getQueueConfig,
  type ActivityConfig,
  type QueueConfig,
} from './terminology-map';

/**
 * Translated TaskRouter Event
 */
export interface TranslatedTaskEvent {
  type: string;
  callId: string;
  agent?: string;
  team?: string;
  customerPhone?: string;
  timestamp: Date;
  message: string;
  rawEvent?: any;
}

/**
 * TaskRouter Translation Service
 */
export class TaskRouterTranslator {
  /**
   * Translate a Twilio TaskRouter webhook event to user-friendly format
   */
  static translateTaskEvent(twilioEvent: any): TranslatedTaskEvent {
    const eventType = twilioEvent.EventType;
    const attributes = this.parseAttributes(twilioEvent.TaskAttributes);

    return {
      type: this.translateTerm(eventType),
      callId: twilioEvent.TaskSid || twilioEvent.ReservationSid || 'unknown',
      agent: twilioEvent.WorkerName || twilioEvent.WorkerFriendlyName,
      team: this.getTeamDisplayName(twilioEvent.TaskQueueName || twilioEvent.TaskQueueFriendlyName),
      customerPhone: attributes?.from || attributes?.caller || 'Unknown',
      timestamp: new Date(twilioEvent.Timestamp || twilioEvent.EventDate),
      message: this.getEventMessage(eventType, twilioEvent),
      rawEvent: twilioEvent,
    };
  }

  /**
   * Get user-friendly event message
   */
  static getEventMessage(eventType: string, data: any): string {
    const messageGenerator = EVENT_MESSAGES[eventType];
    if (messageGenerator) {
      try {
        return messageGenerator(data);
      } catch (error) {
        console.error('Error generating event message:', error);
      }
    }

    // Fallback to translating the event type itself
    return this.translateTerm(eventType);
  }

  /**
   * Translate a single term from technical to friendly
   */
  static translateTerm(term: string): string {
    if (!term) return term;

    // Normalize the term
    const normalized = term.toLowerCase().replace(/[._-]/g, '');

    // Check direct mapping
    if (TERMINOLOGY_MAP[normalized as keyof typeof TERMINOLOGY_MAP]) {
      return TERMINOLOGY_MAP[normalized as keyof typeof TERMINOLOGY_MAP];
    }

    // Check if it's an activity
    const activity = getActivityConfig(term);
    if (activity) {
      return activity.display;
    }

    // Check if it's a queue
    const queue = getQueueConfig(term);
    if (queue) {
      return queue.display;
    }

    // Return original if no translation found
    return term;
  }

  /**
   * Get activity display name and config
   */
  static getActivityDisplay(activityName: string): ActivityConfig | null {
    if (!activityName) return null;
    return getActivityConfig(activityName) || null;
  }

  /**
   * Get team/queue display name
   */
  static getTeamDisplayName(queueName: string): string {
    if (!queueName) return 'Unknown Team';
    const queue = getQueueConfig(queueName);
    return queue?.display || queueName;
  }

  /**
   * Get team/queue configuration
   */
  static getTeamConfig(queueIdentifier: string): QueueConfig | null {
    if (!queueIdentifier) return null;
    return getQueueConfig(queueIdentifier) || null;
  }

  /**
   * Parse TaskAttributes JSON string to object
   */
  private static parseAttributes(attributes: any): any {
    if (!attributes) return {};

    if (typeof attributes === 'string') {
      try {
        return JSON.parse(attributes);
      } catch {
        return {};
      }
    }

    return attributes;
  }

  /**
   * Translate worker/agent data
   */
  static translateWorker(worker: any) {
    const attributes = this.parseAttributes(worker.attributes);

    return {
      id: worker.id || worker.sid,
      sid: worker.twilioWorkerSid || worker.sid,
      name: worker.friendlyName || worker.friendly_name || attributes.name || 'Unknown Agent',
      status: this.getActivityDisplay(worker.activityName || worker.activity_name),
      statusName: worker.activityName || worker.activity_name,
      available: worker.available,
      attributes: attributes,
      teams: this.extractTeams(attributes),
      skills: attributes.skills || [],
      email: worker.user?.email || attributes.email,
      phone: attributes.contact_uri || attributes.phone,
    };
  }

  /**
   * Translate task/call data
   */
  static translateTask(task: any) {
    const attributes = this.parseAttributes(task.attributes || task.taskAttributes);

    return {
      id: task.id || task.sid,
      sid: task.twilioTaskSid || task.sid,
      status: this.translateTerm(task.assignmentStatus || task.assignment_status || 'pending'),
      priority: task.priority || 0,
      team: this.getTeamDisplayName(task.taskQueueName || task.task_queue_friendly_name),
      customerPhone: attributes.from || attributes.caller,
      customerName: attributes.name || attributes.customer_name,
      reason: attributes.reason || attributes.selected_product || 'General inquiry',
      createdAt: task.dateCreated || task.date_created || task.createdAt,
      assignedAgent: task.workerName || task.worker_name,
      attributes: attributes,
    };
  }

  /**
   * Translate queue/team data
   */
  static translateQueue(queue: any) {
    const config = getQueueConfig(queue.friendlyName || queue.friendly_name);

    return {
      id: queue.id || queue.sid,
      sid: queue.twilioTaskQueueSid || queue.sid,
      name: config?.display || queue.friendlyName || queue.friendly_name,
      description: config?.description || 'Team queue',
      targetWorkers: queue.targetWorkers || queue.target_workers,
      maxReservedWorkers: queue.maxReservedWorkers || queue.max_reserved_workers || 1,
      taskOrder: queue.taskOrder || queue.task_order || 'FIFO',
      icon: config?.icon,
      color: config?.color,
      priority: config?.priority,
      skills: config?.skills || [],
    };
  }

  /**
   * Translate activity data
   */
  static translateActivity(activity: any) {
    const config = getActivityConfig(activity.friendlyName || activity.friendly_name);

    return {
      id: activity.id || activity.sid,
      sid: activity.twilioActivitySid || activity.sid,
      name: config?.display || activity.friendlyName || activity.friendly_name,
      description: config?.description || '',
      available: activity.available,
      icon: config?.icon,
      color: config?.color,
    };
  }

  /**
   * Extract team names from worker attributes
   */
  private static extractTeams(attributes: any): string[] {
    const teams: string[] = [];

    // Check routing.skills
    if (attributes.routing?.skills) {
      const skills = Array.isArray(attributes.routing.skills)
        ? attributes.routing.skills
        : [attributes.routing.skills];

      skills.forEach((skill: string) => {
        const queue = getQueueConfig(skill);
        if (queue) {
          teams.push(queue.display);
        }
      });
    }

    // Check skills array
    if (attributes.skills) {
      const skills = Array.isArray(attributes.skills) ? attributes.skills : [attributes.skills];

      skills.forEach((skill: string) => {
        const queue = getQueueConfig(skill);
        if (queue) {
          teams.push(queue.display);
        }
      });
    }

    // Check department
    if (attributes.department) {
      const queue = getQueueConfig(attributes.department);
      if (queue) {
        teams.push(queue.display);
      }
    }

    return [...new Set(teams)]; // Remove duplicates
  }

  /**
   * Batch translate multiple items
   */
  static translateWorkers(workers: any[]) {
    return workers.map((w) => this.translateWorker(w));
  }

  static translateTasks(tasks: any[]) {
    return tasks.map((t) => this.translateTask(t));
  }

  static translateQueues(queues: any[]) {
    return queues.map((q) => this.translateQueue(q));
  }

  static translateActivities(activities: any[]) {
    return activities.map((a) => this.translateActivity(a));
  }

  /**
   * Get all available activity configs for display
   */
  static getAllActivityConfigs(): ActivityConfig[] {
    return Object.values(ACTIVITY_CONFIGS);
  }

  /**
   * Get all available queue configs for display
   */
  static getAllQueueConfigs(): QueueConfig[] {
    return Object.values(QUEUE_CONFIGS);
  }

  /**
   * Check if a term is a TaskRouter technical term that should be translated
   */
  static isTechnicalTerm(term: string): boolean {
    const normalized = term.toLowerCase().replace(/[._-]/g, '');
    return normalized in TERMINOLOGY_MAP;
  }

  /**
   * Translate any string that might contain technical terms
   * Useful for error messages, descriptions, etc.
   */
  static translateString(str: string): string {
    if (!str) return str;

    let translated = str;

    // Replace each technical term with friendly version
    Object.entries(TERMINOLOGY_MAP).forEach(([technical, friendly]) => {
      const regex = new RegExp(`\\b${technical}\\b`, 'gi');
      translated = translated.replace(regex, friendly);
    });

    return translated;
  }
}

/**
 * Convenience export for common use case
 */
export const translator = TaskRouterTranslator;