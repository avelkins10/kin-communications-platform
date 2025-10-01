"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface RoutingCondition {
  type: "keyword" | "time" | "customer" | "phone" | "department" | "priority";
  operator: "equals" | "contains" | "starts_with" | "ends_with" | "regex" | "in" | "not_in" | "greater_than" | "less_than" | "between";
  value: any;
  field?: string;
}

interface RoutingAction {
  type: "route_to_queue" | "route_to_worker" | "route_to_workflow" | "voicemail" | "hangup" | "transfer";
  target?: string;
  priority?: number;
  timeout?: number;
  attributes?: Record<string, any>;
}

interface RoutingRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditions: RoutingCondition[];
  actions: RoutingAction[];
  workflowSid?: string;
  queueSid?: string;
  createdAt: string;
  updatedAt: string;
}

interface TestScenario {
  phoneNumber?: string;
  text?: string;
  callSid?: string;
  messageSid?: string;
  customerData?: Record<string, any>;
  currentTime?: string;
}

interface TestResult {
  success: boolean;
  message: string;
  decision?: {
    taskQueueSid: string;
    workflowSid?: string;
    priority: number;
    attributes: Record<string, any>;
    action: RoutingAction;
  };
}

export function useRoutingRules() {
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  // Fetch all routing rules
  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/taskrouter/routing-rules");
      
      if (response.ok) {
        const rulesData = await response.json();
        setRules(rulesData);
        return rulesData;
      } else {
        throw new Error("Failed to fetch routing rules");
      }
    } catch (error) {
      console.error("Error fetching routing rules:", error);
      toast({
        title: "Error",
        description: "Failed to load routing rules",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create a new routing rule
  const createRule = useCallback(async (rule: Omit<RoutingRule, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsSaving(true);
      const response = await fetch("/api/taskrouter/routing-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });

      if (response.ok) {
        const newRule = await response.json();
        setRules(prev => [...prev, newRule]);
        toast({
          title: "Rule Created",
          description: "Routing rule has been created successfully",
        });
        return newRule;
      } else {
        throw new Error("Failed to create routing rule");
      }
    } catch (error) {
      console.error("Error creating routing rule:", error);
      toast({
        title: "Error",
        description: "Failed to create routing rule",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Update an existing routing rule
  const updateRule = useCallback(async (ruleId: string, updates: Partial<RoutingRule>) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/taskrouter/routing-rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedRule = await response.json();
        setRules(prev => prev.map(rule => rule.id === ruleId ? updatedRule : rule));
        toast({
          title: "Rule Updated",
          description: "Routing rule has been updated successfully",
        });
        return updatedRule;
      } else {
        throw new Error("Failed to update routing rule");
      }
    } catch (error) {
      console.error("Error updating routing rule:", error);
      toast({
        title: "Error",
        description: "Failed to update routing rule",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  // Delete a routing rule
  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      const response = await fetch(`/api/taskrouter/routing-rules/${ruleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRules(prev => prev.filter(rule => rule.id !== ruleId));
        toast({
          title: "Rule Deleted",
          description: "Routing rule has been deleted successfully",
        });
        return true;
      } else {
        throw new Error("Failed to delete routing rule");
      }
    } catch (error) {
      console.error("Error deleting routing rule:", error);
      toast({
        title: "Error",
        description: "Failed to delete routing rule",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  // Test a routing rule
  const testRule = useCallback(async (scenario: TestScenario) => {
    try {
      setIsTesting(true);
      const response = await fetch("/api/taskrouter/routing-rules/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario),
      });

      if (response.ok) {
        const result: TestResult = await response.json();
        return result;
      } else {
        throw new Error("Failed to test routing rule");
      }
    } catch (error) {
      console.error("Error testing routing rule:", error);
      toast({
        title: "Test Error",
        description: "Failed to test routing rule",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsTesting(false);
    }
  }, [toast]);

  // Toggle rule enabled status
  const toggleRule = useCallback(async (ruleId: string, enabled: boolean) => {
    return updateRule(ruleId, { enabled });
  }, [updateRule]);

  // Get rule by ID
  const getRule = useCallback((ruleId: string) => {
    return rules.find(rule => rule.id === ruleId);
  }, [rules]);

  // Get enabled rules sorted by priority
  const getEnabledRules = useCallback(() => {
    return rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority);
  }, [rules]);

  // Get rules by department
  const getRulesByDepartment = useCallback((department: string) => {
    return rules.filter(rule => 
      rule.conditions.some(condition => 
        condition.type === "department" && condition.value === department
      )
    );
  }, [rules]);

  // Get rules by priority level
  const getRulesByPriority = useCallback((priority: number) => {
    return rules.filter(rule => rule.priority === priority);
  }, [rules]);

  // Validate rule conditions
  const validateRule = useCallback((rule: Partial<RoutingRule>) => {
    const errors: string[] = [];

    if (!rule.name?.trim()) {
      errors.push("Rule name is required");
    }

    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push("At least one condition is required");
    }

    if (!rule.actions || rule.actions.length === 0) {
      errors.push("At least one action is required");
    }

    // Validate conditions
    rule.conditions?.forEach((condition, index) => {
      if (!condition.type) {
        errors.push(`Condition ${index + 1}: Type is required`);
      }
      if (!condition.operator) {
        errors.push(`Condition ${index + 1}: Operator is required`);
      }
      if (condition.value === undefined || condition.value === null || condition.value === "") {
        errors.push(`Condition ${index + 1}: Value is required`);
      }
    });

    // Validate actions
    rule.actions?.forEach((action, index) => {
      if (!action.type) {
        errors.push(`Action ${index + 1}: Type is required`);
      }
      if (action.type === "route_to_queue" && !action.target) {
        errors.push(`Action ${index + 1}: Target queue is required for route_to_queue action`);
      }
      if (action.type === "route_to_worker" && !action.target) {
        errors.push(`Action ${index + 1}: Target worker is required for route_to_worker action`);
      }
      if (action.type === "route_to_workflow" && !action.target) {
        errors.push(`Action ${index + 1}: Target workflow is required for route_to_workflow action`);
      }
    });

    return errors;
  }, []);

  // Load rules on mount
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    // Data
    rules,
    isLoading,
    isSaving,
    isTesting,
    
    // Actions
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    testRule,
    toggleRule,
    
    // Utilities
    getRule,
    getEnabledRules,
    getRulesByDepartment,
    getRulesByPriority,
    validateRule,
  };
}
