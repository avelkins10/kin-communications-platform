import { db } from "@/lib/db";
import { quickbaseService } from "@/lib/quickbase/service";
import { CustomerContact } from "@/types";
import {
  KeywordDetectionResult,
  QuickbaseRoutingResult,
  TimeBasedRoutingResult,
  SkillsBasedRoutingResult,
  RoutingCondition,
  RoutingAction,
  TaskAttributes,
} from "@/types/twilio";

export class RoutingEngine {
  // Keyword Detection
  static async detectKeywords(text: string): Promise<KeywordDetectionResult> {
    const keywordMappings = {
      // Permits and approvals
      permit: { department: "permits", priority: "normal" as const },
      permits: { department: "permits", priority: "normal" as const },
      approval: { department: "permits", priority: "normal" as const },
      license: { department: "permits", priority: "normal" as const },
      inspection: { department: "permits", priority: "high" as const },
      code: { department: "permits", priority: "normal" as const },
      violation: { department: "permits", priority: "high" as const },

      // Utilities
      utility: { department: "utilities", priority: "normal" as const },
      utilities: { department: "utilities", priority: "normal" as const },
      water: { department: "utilities", priority: "high" as const },
      sewer: { department: "utilities", priority: "high" as const },
      gas: { department: "utilities", priority: "urgent" as const },
      electric: { department: "utilities", priority: "urgent" as const },
      electricity: { department: "utilities", priority: "urgent" as const },
      power: { department: "utilities", priority: "urgent" as const },
      outage: { department: "utilities", priority: "urgent" as const },

      // Scheduling and appointments
      schedule: { department: "scheduling", priority: "normal" as const },
      appointment: { department: "scheduling", priority: "normal" as const },
      meeting: { department: "scheduling", priority: "normal" as const },
      visit: { department: "scheduling", priority: "normal" as const },
      service: { department: "scheduling", priority: "normal" as const },
      maintenance: { department: "scheduling", priority: "normal" as const },

      // Emergency and urgent
      emergency: { department: "emergency", priority: "urgent" as const },
      urgent: { department: "emergency", priority: "urgent" as const },
      asap: { department: "emergency", priority: "urgent" as const },
      immediate: { department: "emergency", priority: "urgent" as const },
      help: { department: "support", priority: "high" as const },
      problem: { department: "support", priority: "high" as const },
      issue: { department: "support", priority: "high" as const },

      // Billing and payments
      bill: { department: "billing", priority: "normal" as const },
      billing: { department: "billing", priority: "normal" as const },
      payment: { department: "billing", priority: "normal" as const },
      invoice: { department: "billing", priority: "normal" as const },
      charge: { department: "billing", priority: "normal" as const },
      fee: { department: "billing", priority: "normal" as const },

      // General support
      question: { department: "support", priority: "normal" as const },
      information: { department: "support", priority: "normal" as const },
      complaint: { department: "support", priority: "high" as const },
      feedback: { department: "support", priority: "normal" as const },
    };

    const detectedKeywords: string[] = [];
    let bestMatch: { department: string; priority: "low" | "normal" | "high" | "urgent" } | null = null;
    let maxConfidence = 0;

    const lowerText = text.toLowerCase();

    for (const [keyword, mapping] of Object.entries(keywordMappings)) {
      if (lowerText.includes(keyword)) {
        detectedKeywords.push(keyword);
        
        // Calculate confidence based on keyword specificity and context
        let confidence = 0.7; // Base confidence
        
        // Higher confidence for exact matches
        if (lowerText === keyword) {
          confidence = 1.0;
        } else if (lowerText.includes(` ${keyword} `) || lowerText.startsWith(`${keyword} `) || lowerText.endsWith(` ${keyword}`)) {
          confidence = 0.9;
        }
        
        // Higher confidence for urgent keywords
        if (mapping.priority === "urgent") {
          confidence += 0.2;
        } else if (mapping.priority === "high") {
          confidence += 0.1;
        }

        if (confidence > maxConfidence) {
          maxConfidence = confidence;
          bestMatch = mapping;
        }
      }
    }

    return {
      keywords: detectedKeywords,
      department: bestMatch?.department,
      priority: bestMatch?.priority || "normal",
      confidence: maxConfidence,
    };
  }

  // Quickbase-based routing
  static async getQuickbaseRouting(phoneNumber: string): Promise<QuickbaseRoutingResult> {
    try {
      // Look up customer in Quickbase with timeout to prevent slow responses from blocking calls
      const customer = await Promise.race([
        quickbaseService.findCustomerByPhone(phoneNumber),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('Quickbase lookup timeout')), 5000)
        )
      ]) as CustomerContact | null;
      
      if (!customer) {
        return {
          customerId: undefined,
          projectCoordinator: undefined,
          department: undefined,
          priority: "normal",
          customAttributes: {},
        };
      }

      // Extract routing information from customer data
      const result: QuickbaseRoutingResult = {
        customerId: customer.id,
        projectCoordinator: customer.projectCoordinator,
        department: customer.department,
        priority: "normal",
        customAttributes: {
          customerName: customer.name,
          customerType: customer.type,
          lastContact: customer.lastContact,
          notes: customer.notes,
        },
      };

      // Determine priority based on customer type and history
      if (customer.type === "VIP" || customer.type === "Premium") {
        result.priority = "high";
      } else if (customer.type === "Emergency") {
        result.priority = "urgent";
      }

      // Check for recent issues or complaints
      if (customer.notes && (
        customer.notes.toLowerCase().includes("complaint") ||
        customer.notes.toLowerCase().includes("issue") ||
        customer.notes.toLowerCase().includes("problem")
      )) {
        result.priority = "high";
      }

      return result;
    } catch (error) {
      // Add Sentry breadcrumb for Quickbase routing failures
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.addBreadcrumb({
          category: 'quickbase',
          message: 'Quickbase routing failed',
          level: 'warning',
          data: { phone: phoneNumber.slice(-4), error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
      
      console.error("Error in Quickbase routing:", error);
      return {
        customerId: undefined,
        projectCoordinator: undefined,
        department: undefined,
        priority: "normal",
        customAttributes: {},
      };
    }
  }

  // Time-based routing
  static getTimeBasedRouting(timezone: string = "America/New_York"): TimeBasedRoutingResult {
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    
    const hour = localTime.getHours();
    const day = localTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Business hours: Monday-Friday, 8 AM - 6 PM
    const isBusinessHours = day >= 1 && day <= 5 && hour >= 8 && hour < 18;
    
    // Check for holidays (simplified - would need a proper holiday calendar)
    const isHoliday = this.isHoliday(localTime);
    
    let routingAction: "route_to_queue" | "voicemail" | "hangup" | "transfer" = "route_to_queue";
    let target: string | undefined;
    
    if (!isBusinessHours || isHoliday) {
      // After hours routing
      const afterHoursConfig = process.env.AFTER_HOURS_ROUTING || "voicemail";
      
      switch (afterHoursConfig) {
        case "voicemail":
          routingAction = "voicemail";
          break;
        case "hangup":
          routingAction = "hangup";
          break;
        case "transfer":
          routingAction = "transfer";
          target = process.env.AFTER_HOURS_TRANSFER_NUMBER;
          break;
        default:
          routingAction = "voicemail";
      }
    }
    
    // Calculate next business day
    const nextBusinessDay = this.getNextBusinessDay(localTime);
    
    return {
      isBusinessHours,
      isHoliday,
      nextBusinessDay,
      routingAction,
      target,
    };
  }

  // Skills-based routing
  static async getSkillsBasedRouting(requiredSkills: string[]): Promise<SkillsBasedRoutingResult> {
    try {
      // Find workers with the required skills
      const workers = await db.worker.findMany({
        where: {
          available: true,
          attributes: {
            path: ["skills"],
            array_contains: requiredSkills,
          },
        },
        include: {
          user: true,
        },
      });

      const availableWorkers = workers.map(worker => worker.twilioWorkerSid);
      
      // Find the best match based on skill overlap
      let bestMatch: string | undefined;
      let maxSkillMatch = 0;
      
      for (const worker of workers) {
        const workerSkills = (worker.attributes as any)?.skills || [];
        const skillOverlap = requiredSkills.filter(skill => workerSkills.includes(skill)).length;
        
        if (skillOverlap > maxSkillMatch) {
          maxSkillMatch = skillOverlap;
          bestMatch = worker.twilioWorkerSid;
        }
      }
      
      const confidence = requiredSkills.length > 0 ? maxSkillMatch / requiredSkills.length : 0;
      
      return {
        requiredSkills,
        availableWorkers,
        bestMatch,
        confidence,
      };
    } catch (error) {
      console.error("Error in skills-based routing:", error);
      return {
        requiredSkills,
        availableWorkers: [],
        bestMatch: undefined,
        confidence: 0,
      };
    }
  }

  // Routing rule evaluation
  static async evaluateRoutingRules(
    taskAttributes: TaskAttributes,
    context: {
      phoneNumber?: string;
      keywords?: string[];
      time?: Date;
      customerData?: any;
    }
  ): Promise<{ matched: boolean; actions: RoutingAction[] }> {
    try {
      // Get all enabled routing rules ordered by priority
      const rules = await db.routingRule.findMany({
        where: {
          enabled: true,
        },
        orderBy: {
          priority: "desc",
        },
      });

      for (const rule of rules) {
        const conditions = rule.conditions as RoutingCondition[];
        const actions = rule.actions as RoutingAction[];
        
        // Check if all conditions match
        const conditionsMatch = await this.evaluateConditions(conditions, taskAttributes, context);
        
        if (conditionsMatch) {
          return {
            matched: true,
            actions,
          };
        }
      }

      return {
        matched: false,
        actions: [],
      };
    } catch (error) {
      console.error("Error evaluating routing rules:", error);
      return {
        matched: false,
        actions: [],
      };
    }
  }

  // Condition evaluation
  private static async evaluateConditions(
    conditions: RoutingCondition[],
    taskAttributes: TaskAttributes,
    context: {
      phoneNumber?: string;
      keywords?: string[];
      time?: Date;
      customerData?: any;
    }
  ): Promise<boolean> {
    for (const condition of conditions) {
      const matches = await this.evaluateCondition(condition, taskAttributes, context);
      if (!matches) {
        return false;
      }
    }
    return true;
  }

  private static async evaluateCondition(
    condition: RoutingCondition,
    taskAttributes: TaskAttributes,
    context: {
      phoneNumber?: string;
      keywords?: string[];
      time?: Date;
      customerData?: any;
    }
  ): Promise<boolean> {
    let value: any;
    
    // Get the value to evaluate based on condition type
    switch (condition.type) {
      case "keyword":
        value = context.keywords || [];
        break;
      case "time":
        value = context.time || new Date();
        break;
      case "customer":
        value = context.customerData;
        break;
      case "phone":
        value = context.phoneNumber;
        break;
      case "department":
        value = taskAttributes.department;
        break;
      case "priority":
        value = taskAttributes.priority;
        break;
      default:
        value = condition.field ? taskAttributes[condition.field as keyof TaskAttributes] : null;
    }

    // Apply the operator
    switch (condition.operator) {
      case "equals":
        return value === condition.value;
      case "contains":
        return Array.isArray(value) ? value.includes(condition.value) : String(value).includes(String(condition.value));
      case "starts_with":
        return String(value).startsWith(String(condition.value));
      case "ends_with":
        return String(value).endsWith(String(condition.value));
      case "regex":
        return new RegExp(condition.value).test(String(value));
      case "in":
        return Array.isArray(condition.value) ? condition.value.includes(value) : false;
      case "not_in":
        return Array.isArray(condition.value) ? !condition.value.includes(value) : true;
      case "greater_than":
        return Number(value) > Number(condition.value);
      case "less_than":
        return Number(value) < Number(condition.value);
      case "between":
        if (Array.isArray(condition.value) && condition.value.length === 2) {
          const [min, max] = condition.value;
          return Number(value) >= Number(min) && Number(value) <= Number(max);
        }
        return false;
      default:
        return false;
    }
  }

  // Utility methods
  private static isHoliday(date: Date): boolean {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Common US holidays (simplified)
    const holidays = [
      [0, 1],   // New Year's Day
      [1, 15],  // Martin Luther King Jr. Day (approximate)
      [1, 19],  // Presidents' Day (approximate)
      [4, 25],  // Memorial Day (approximate)
      [6, 4],   // Independence Day
      [8, 1],   // Labor Day (approximate)
      [9, 8],   // Columbus Day (approximate)
      [10, 11], // Veterans Day
      [10, 25], // Thanksgiving (approximate)
      [11, 25], // Christmas Day
    ];
    
    return holidays.some(([holidayMonth, holidayDay]) => 
      month === holidayMonth && day === holidayDay
    );
  }

  private static getNextBusinessDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Skip weekends
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    // Skip holidays
    while (this.isHoliday(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }

    return nextDay;
  }

  // Project coordinator worker lookup
  private static async findWorkerByProjectCoordinator(coordinatorId: string): Promise<{ twilioWorkerSid: string; available: boolean } | null> {
    try {
      // Find the user with this QuickBase coordinator ID
      const user = await db.user.findFirst({
        where: { quickbaseUserId: coordinatorId },
        include: {
          Worker: true,
        },
      });

      if (!user?.Worker) {
        return null;
      }

      // Check if the worker is available (has an available activity)
      if (user.Worker.activitySid) {
        const activity = await db.activity.findUnique({
          where: { twilioActivitySid: user.Worker.activitySid },
        });

        return {
          twilioWorkerSid: user.Worker.twilioWorkerSid,
          available: activity?.available || false,
        };
      }

      return {
        twilioWorkerSid: user.Worker.twilioWorkerSid,
        available: false,
      };
    } catch (error) {
      console.error("Error finding worker by project coordinator:", error);
      return null;
    }
  }

  // Intelligent task routing
  static async routeTask(
    taskAttributes: TaskAttributes,
    context: {
      phoneNumber?: string;
      text?: string;
      callSid?: string;
      messageSid?: string;
      callId?: string;
      messageId?: string;
    }
  ): Promise<{
    taskQueueSid: string;
    workflowSid?: string;
    priority: number;
    attributes: TaskAttributes;
    taskSid?: string;
    taskId?: string;
  }> {
    try {
      // Detect keywords if text is provided
      let keywordResult: KeywordDetectionResult | undefined;
      if (context.text) {
        keywordResult = await this.detectKeywords(context.text);
      }

      // Get Quickbase routing information
      let quickbaseResult: QuickbaseRoutingResult | undefined;
      if (context.phoneNumber) {
        quickbaseResult = await this.getQuickbaseRouting(context.phoneNumber);
      }

      // Get time-based routing
      const timeResult = this.getTimeBasedRouting();

      // Enhanced task attributes
      const enhancedAttributes: TaskAttributes = {
        ...taskAttributes,
        customer_phone: context.phoneNumber,
        call_sid: context.callSid,
        message_sid: context.messageSid,
      };

      // Apply keyword detection results
      if (keywordResult) {
        enhancedAttributes.keywords = keywordResult.keywords;
        if (keywordResult.department) {
          enhancedAttributes.department = keywordResult.department;
        }
        if (keywordResult.priority) {
          enhancedAttributes.priority = keywordResult.priority;
        }
      }

      // Determine priority first
      let priority = 50; // Default priority
      switch (enhancedAttributes.priority) {
        case "urgent":
          priority = 100;
          break;
        case "high":
          priority = 75;
          break;
        case "normal":
          priority = 50;
          break;
        case "low":
          priority = 25;
          break;
        default:
          priority = 50;
      }

      // Apply Quickbase routing results
      if (quickbaseResult) {
        if (quickbaseResult.customerId) {
          enhancedAttributes.customer_id = quickbaseResult.customerId;
        }
        if (quickbaseResult.projectCoordinator) {
          enhancedAttributes.project_coordinator = quickbaseResult.projectCoordinator;

          // Route directly to project coordinator if available
          const coordinatorWorker = await this.findWorkerByProjectCoordinator(quickbaseResult.projectCoordinator);
          if (coordinatorWorker) {
            enhancedAttributes.preferred_worker_sid = coordinatorWorker.twilioWorkerSid;
            enhancedAttributes.routing_type = "project_coordinator";
            // Boost priority for project coordinator routing
            priority = Math.max(priority, 85);
          }
        }
        if (quickbaseResult.department && !enhancedAttributes.department) {
          enhancedAttributes.department = quickbaseResult.department;
        }
        if (quickbaseResult.priority && quickbaseResult.priority !== "normal") {
          enhancedAttributes.priority = quickbaseResult.priority;
        }
      }

      // Determine task queue based on department or default
      let taskQueueSid = process.env.TWILIO_DEFAULT_TASK_QUEUE_SID!;
      
      if (enhancedAttributes.department) {
        const departmentQueueMap: Record<string, string> = {
          permits: process.env.TWILIO_PERMITS_TASK_QUEUE_SID!,
          utilities: process.env.TWILIO_UTILITIES_TASK_QUEUE_SID!,
          scheduling: process.env.TWILIO_SCHEDULING_TASK_QUEUE_SID!,
          emergency: process.env.TWILIO_EMERGENCY_TASK_QUEUE_SID!,
          billing: process.env.TWILIO_BILLING_TASK_QUEUE_SID!,
          support: process.env.TWILIO_SUPPORT_TASK_QUEUE_SID!,
        };
        
        taskQueueSid = departmentQueueMap[enhancedAttributes.department] || taskQueueSid;
      }

      // Apply time-based routing adjustments
      if (!timeResult.isBusinessHours) {
        priority = Math.max(priority, 75); // Boost priority for after-hours calls
      }

      // Evaluate custom routing rules
      const ruleResult = await this.evaluateRoutingRules(enhancedAttributes, {
        phoneNumber: context.phoneNumber,
        keywords: keywordResult?.keywords,
        time: new Date(),
        customerData: quickbaseResult,
      });

      // Apply routing rule actions
      if (ruleResult.matched && ruleResult.actions.length > 0) {
        const action = ruleResult.actions[0]; // Use first action
        
        if (action.type === "route_to_queue" && action.target) {
          taskQueueSid = action.target;
        }
        
        if (action.priority !== undefined) {
          priority = action.priority;
        }
        
        if (action.attributes) {
          Object.assign(enhancedAttributes, action.attributes);
        }
      }

      // Create task in TaskRouter
      let taskSid: string | undefined;
      let taskId: string | undefined;
      
      try {
        const { taskRouterService } = await import('@/lib/twilio/taskrouter');
        
        const task = await taskRouterService.createTask(
          {
            taskQueueSid,
            workflowSid: process.env.TWILIO_WORKFLOW_SID,
            attributes: enhancedAttributes,
            priority,
            timeout: 3600, // 1 hour default
            taskChannel: context.callSid ? 'voice' : 'default',
          },
          {
            callId: context.callId, // Use local database ID instead of Twilio SID
            messageId: context.messageId, // Use local database ID instead of Twilio SID
          }
        );
        
        taskSid = task.twilioTaskSid;
        taskId = task.id;
      } catch (error) {
        console.error("Failed to create TaskRouter task:", error);
        // Continue with routing decision even if task creation fails
      }

      return {
        taskQueueSid,
        workflowSid: process.env.TWILIO_WORKFLOW_SID,
        priority,
        attributes: enhancedAttributes,
        taskSid,
        taskId,
      };
    } catch (error) {
      console.error("Error in intelligent task routing:", error);
      
      // Fallback to default routing
      return {
        taskQueueSid: process.env.TWILIO_DEFAULT_TASK_QUEUE_SID!,
        workflowSid: process.env.TWILIO_WORKFLOW_SID,
        priority: 50,
        attributes: taskAttributes,
        taskSid: undefined,
        taskId: undefined,
      };
    }
  }
}

export const routingEngine = new RoutingEngine();
