"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Trash2, 
  Save, 
  TestTube, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Phone,
  MessageSquare,
  Building,
  Star,
  GripVertical,
  ArrowRight,
  Play,
  Eye,
  FileText,
  Copy
} from "lucide-react";

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
  id?: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditions: RoutingCondition[];
  actions: RoutingAction[];
  workflowSid?: string;
  queueSid?: string;
}

interface RoutingRulesBuilderProps {
  rules: RoutingRule[];
  onSave: (rule: RoutingRule) => void;
  onDelete: (ruleId: string) => void;
  onTest: (rule: RoutingRule) => void;
}

// Rule templates for common scenarios
const RULE_TEMPLATES: RoutingRule[] = [
  {
    name: "Business Hours Routing",
    description: "Route calls during business hours to support queue, after hours to voicemail",
    priority: 100,
    enabled: true,
    conditions: [
      { type: "time", operator: "between", value: "09:00-17:00" },
    ],
    actions: [
      { type: "route_to_queue", target: "support", priority: 1 },
    ],
  },
  {
    name: "VIP Customer Routing",
    description: "Route VIP customers to priority queue",
    priority: 200,
    enabled: true,
    conditions: [
      { type: "customer", operator: "equals", value: "vip" },
    ],
    actions: [
      { type: "route_to_queue", target: "vip_support", priority: 1 },
    ],
  },
  {
    name: "Keyword-based Routing",
    description: "Route calls based on keywords in transcription",
    priority: 50,
    enabled: true,
    conditions: [
      { type: "keyword", operator: "contains", value: "billing" },
    ],
    actions: [
      { type: "route_to_queue", target: "billing", priority: 1 },
    ],
  },
  {
    name: "Department Routing",
    description: "Route calls to specific departments",
    priority: 75,
    enabled: true,
    conditions: [
      { type: "department", operator: "equals", value: "sales" },
    ],
    actions: [
      { type: "route_to_queue", target: "sales", priority: 1 },
    ],
  },
  {
    name: "Emergency Routing",
    description: "Route emergency calls immediately to on-call support",
    priority: 1000,
    enabled: true,
    conditions: [
      { type: "keyword", operator: "contains", value: "emergency" },
    ],
    actions: [
      { type: "route_to_worker", target: "on_call_support", priority: 1 },
    ],
  },
];

// Sortable condition component
function SortableCondition({ 
  condition, 
  index, 
  onUpdate, 
  onRemove 
}: { 
  condition: RoutingCondition; 
  index: number; 
  onUpdate: (index: number, field: keyof RoutingCondition, value: any) => void;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `condition-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const conditionTypes = [
    { value: "keyword", label: "Keyword", icon: MessageSquare },
    { value: "time", label: "Time", icon: Clock },
    { value: "customer", label: "Customer", icon: User },
    { value: "phone", label: "Phone", icon: Phone },
    { value: "department", label: "Department", icon: Building },
    { value: "priority", label: "Priority", icon: Star },
  ];

  const operators = [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "starts_with", label: "Starts With" },
    { value: "ends_with", label: "Ends With" },
    { value: "regex", label: "Regex Match" },
    { value: "in", label: "In List" },
    { value: "not_in", label: "Not In List" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "between", label: "Between" },
  ];

  const getConditionIcon = (type: string) => {
    const conditionType = conditionTypes.find(ct => ct.value === type);
    return conditionType ? conditionType.icon : AlertCircle;
  };

  const Icon = getConditionIcon(condition.type);

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className="cursor-move hover:shadow-md transition-shadow"
    >
      <CardContent className="pt-4">
        <div className="flex items-center space-x-2 mb-4" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-gray-400" />
          <Icon className="h-4 w-4" />
          <span className="text-sm text-gray-500">Drag to reorder</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label>Type</Label>
            <Select
              value={condition.type}
              onValueChange={(value) => onUpdate(index, "type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <type.icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Operator</Label>
            <Select
              value={condition.operator}
              onValueChange={(value) => onUpdate(index, "operator", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Value</Label>
            <Input
              value={condition.value}
              onChange={(e) => onUpdate(index, "value", e.target.value)}
              placeholder="Enter value"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sortable action component
function SortableAction({ 
  action, 
  index, 
  onUpdate, 
  onRemove 
}: { 
  action: RoutingAction; 
  index: number; 
  onUpdate: (index: number, field: keyof RoutingAction, value: any) => void;
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `action-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const actionTypes = [
    { value: "route_to_queue", label: "Route to Queue" },
    { value: "route_to_worker", label: "Route to Worker" },
    { value: "route_to_workflow", label: "Route to Workflow" },
    { value: "voicemail", label: "Send to Voicemail" },
    { value: "hangup", label: "Hang Up" },
    { value: "transfer", label: "Transfer" },
  ];

  const getActionIcon = (type: string) => {
    switch (type) {
      case "route_to_queue":
        return Building;
      case "route_to_worker":
        return User;
      case "route_to_workflow":
        return Settings;
      case "voicemail":
        return MessageSquare;
      case "hangup":
        return Phone;
      case "transfer":
        return Phone;
      default:
        return AlertCircle;
    }
  };

  const Icon = getActionIcon(action.type);

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className="cursor-move hover:shadow-md transition-shadow"
    >
      <CardContent className="pt-4">
        <div className="flex items-center space-x-2 mb-4" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-gray-400" />
          <Icon className="h-4 w-4" />
          <span className="text-sm text-gray-500">Drag to reorder</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Action Type</Label>
            <Select
              value={action.type}
              onValueChange={(value) => onUpdate(index, "type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target</Label>
            <Input
              value={action.target || ""}
              onChange={(e) => onUpdate(index, "target", e.target.value)}
              placeholder="Enter target"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Priority</Label>
            <Input
              type="number"
              value={action.priority || 0}
              onChange={(e) => onUpdate(index, "priority", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Timeout (seconds)</Label>
            <Input
              type="number"
              value={action.timeout || 0}
              onChange={(e) => onUpdate(index, "timeout", parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RoutingRulesBuilder({ rules, onSave, onDelete, onTest }: RoutingRulesBuilderProps) {
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visual");
  const [testScenario, setTestScenario] = useState({
    phoneNumber: "",
    text: "",
    callSid: "",
    messageSid: "",
    customerData: {},
    currentTime: new Date().toISOString(),
  });
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const conditionTypes = [
    { value: "keyword", label: "Keyword", icon: MessageSquare },
    { value: "time", label: "Time", icon: Clock },
    { value: "customer", label: "Customer", icon: User },
    { value: "phone", label: "Phone", icon: Phone },
    { value: "department", label: "Department", icon: Building },
    { value: "priority", label: "Priority", icon: Star },
  ];

  const operators = [
    { value: "equals", label: "Equals" },
    { value: "contains", label: "Contains" },
    { value: "starts_with", label: "Starts With" },
    { value: "ends_with", label: "Ends With" },
    { value: "regex", label: "Regex Match" },
    { value: "in", label: "In List" },
    { value: "not_in", label: "Not In List" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "between", label: "Between" },
  ];

  const actionTypes = [
    { value: "route_to_queue", label: "Route to Queue" },
    { value: "route_to_worker", label: "Route to Worker" },
    { value: "route_to_workflow", label: "Route to Workflow" },
    { value: "voicemail", label: "Send to Voicemail" },
    { value: "hangup", label: "Hang Up" },
    { value: "transfer", label: "Transfer" },
  ];

  const handleAddCondition = () => {
    if (!editingRule) return;
    
    const newCondition: RoutingCondition = {
      type: "keyword",
      operator: "contains",
      value: "",
    };
    
    setEditingRule({
      ...editingRule,
      conditions: [...editingRule.conditions, newCondition],
    });
  };

  const handleRemoveCondition = (index: number) => {
    if (!editingRule) return;
    
    setEditingRule({
      ...editingRule,
      conditions: editingRule.conditions.filter((_, i) => i !== index),
    });
  };

  const handleUpdateCondition = (index: number, field: keyof RoutingCondition, value: any) => {
    if (!editingRule) return;
    
    const updatedConditions = [...editingRule.conditions];
    updatedConditions[index] = { ...updatedConditions[index], [field]: value };
    
    setEditingRule({
      ...editingRule,
      conditions: updatedConditions,
    });
  };

  const handleAddAction = () => {
    if (!editingRule) return;
    
    const newAction: RoutingAction = {
      type: "route_to_queue",
      target: "",
      priority: 0,
    };
    
    setEditingRule({
      ...editingRule,
      actions: [...editingRule.actions, newAction],
    });
  };

  const handleRemoveAction = (index: number) => {
    if (!editingRule) return;
    
    setEditingRule({
      ...editingRule,
      actions: editingRule.actions.filter((_, i) => i !== index),
    });
  };

  const handleUpdateAction = (index: number, field: keyof RoutingAction, value: any) => {
    if (!editingRule) return;
    
    const updatedActions = [...editingRule.actions];
    updatedActions[index] = { ...updatedActions[index], [field]: value };
    
    setEditingRule({
      ...editingRule,
      actions: updatedActions,
    });
  };

  const handleSave = () => {
    if (!editingRule) return;
    
    if (editingRule.conditions.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one condition is required",
        variant: "destructive",
      });
      return;
    }
    
    if (editingRule.actions.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one action is required",
        variant: "destructive",
      });
      return;
    }
    
    onSave(editingRule);
    setEditingRule(null);
    setIsDialogOpen(false);
  };

  const handleTest = async () => {
    if (!editingRule) return;
    
    try {
      const response = await fetch("/api/taskrouter/routing-rules/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testScenario,
          rule: editingRule,
        }),
      });
      
      const result = await response.json();
      setTestResult(result);
      
      toast({
        title: "Test Complete",
        description: result.success ? "Rule matched successfully" : "No rule matched",
      });
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test routing rule",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (rule?: RoutingRule) => {
    if (rule) {
      setEditingRule({ ...rule });
    } else {
      setEditingRule({
        name: "",
        description: "",
        priority: 0,
        enabled: true,
        conditions: [],
        actions: [],
      });
    }
    setIsDialogOpen(true);
  };

  const getConditionIcon = (type: string) => {
    const conditionType = conditionTypes.find(ct => ct.value === type);
    return conditionType ? conditionType.icon : AlertCircle;
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "route_to_queue":
        return Building;
      case "route_to_worker":
        return User;
      case "route_to_workflow":
        return Settings;
      case "voicemail":
        return MessageSquare;
      case "hangup":
        return Phone;
      case "transfer":
        return Phone;
      default:
        return AlertCircle;
    }
  };

  // DnD Kit handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!editingRule || !over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId.startsWith('condition-') && overId.startsWith('condition-')) {
      const activeIndex = parseInt(activeId.split('-')[1]);
      const overIndex = parseInt(overId.split('-')[1]);
      
      if (activeIndex !== overIndex) {
        setEditingRule({
          ...editingRule,
          conditions: arrayMove(editingRule.conditions, activeIndex, overIndex),
        });
      }
    } else if (activeId.startsWith('action-') && overId.startsWith('action-')) {
      const activeIndex = parseInt(activeId.split('-')[1]);
      const overIndex = parseInt(overId.split('-')[1]);
      
      if (activeIndex !== overIndex) {
        setEditingRule({
          ...editingRule,
          actions: arrayMove(editingRule.actions, activeIndex, overIndex),
        });
      }
    }
  };

  // Template handlers
  const handleUseTemplate = (template: RoutingRule) => {
    const newRule = {
      ...template,
      id: undefined, // Remove ID so it creates a new rule
      name: `${template.name} (Copy)`,
    };
    setEditingRule(newRule);
    setIsDialogOpen(true);
  };

  // Visual flow component
  const VisualFlow = ({ rule }: { rule: RoutingRule }) => {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="font-medium mb-2">Rule Flow</h4>
        </div>
        
        {/* Start */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 p-3 bg-green-100 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Start</span>
          </div>
        </div>

        {/* Conditions */}
        <div className="space-y-2">
          {rule.conditions.map((condition, index) => {
            const Icon = getConditionIcon(condition.type);
            return (
              <div key={index} className="flex justify-center">
                <div className="flex items-center space-x-2 p-3 bg-blue-100 rounded-lg max-w-md">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-800">{condition.type}</div>
                    <div className="text-blue-600">{condition.operator} {condition.value}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-gray-400" />
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {rule.actions.map((action, index) => {
            const Icon = getActionIcon(action.type);
            return (
              <div key={index} className="flex justify-center">
                <div className="flex items-center space-x-2 p-3 bg-purple-100 rounded-lg max-w-md">
                  <Icon className="h-5 w-5 text-purple-600" />
                  <div className="text-sm">
                    <div className="font-medium text-purple-800">{action.type.replace(/_/g, ' ')}</div>
                    {action.target && <div className="text-purple-600">→ {action.target}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* End */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-2 p-3 bg-gray-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-800">End</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Routing Rules</h2>
          <p className="text-muted-foreground">
            Configure intelligent routing rules for calls and messages
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Rule Templates</DialogTitle>
                <DialogDescription>
                  Choose from pre-built routing rule templates to get started quickly
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                {RULE_TEMPLATES.map((template, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                        <Button onClick={() => handleUseTemplate(template)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Use Template
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium text-sm">Conditions:</h4>
                          {template.conditions.map((condition, i) => (
                            <div key={i} className="text-sm text-muted-foreground">
                              {condition.type} {condition.operator} {condition.value}
                            </div>
                          ))}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">Actions:</h4>
                          {template.actions.map((action, i) => (
                            <div key={i} className="text-sm text-muted-foreground">
                              {action.type} {action.target && `→ ${action.target}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => openEditDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Rules List */}
      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{rule.name}</CardTitle>
                  <Badge variant={rule.enabled ? "default" : "secondary"}>
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Badge variant="outline">Priority: {rule.priority}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRule(rule);
                      setActiveTab("visual");
                      setIsDialogOpen(true);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTest(rule)}
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(rule)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(rule.id!)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
              {rule.description && (
                <CardDescription>{rule.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Conditions */}
                <div>
                  <h4 className="font-medium mb-2">Conditions</h4>
                  <div className="space-y-2">
                    {rule.conditions.map((condition, index) => {
                      const Icon = getConditionIcon(condition.type);
                      return (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">
                            {condition.type} {condition.operator} {condition.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h4 className="font-medium mb-2">Actions</h4>
                  <div className="space-y-2">
                    {rule.actions.map((action, index) => {
                      const Icon = getActionIcon(action.type);
                      return (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">
                            {action.type} {action.target && `→ ${action.target}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule?.id ? "Edit Routing Rule" : "Create Routing Rule"}
            </DialogTitle>
            <DialogDescription>
              Configure conditions and actions for intelligent routing
            </DialogDescription>
          </DialogHeader>

          {editingRule && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={editingRule.priority}
                    onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingRule.description || ""}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  placeholder="Enter rule description"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={editingRule.enabled}
                  onCheckedChange={(checked) => setEditingRule({ ...editingRule, enabled: checked })}
                />
                <Label htmlFor="enabled">Enabled</Label>
              </div>

              {/* Visual Flow and Configuration Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="visual">Visual Flow</TabsTrigger>
                  <TabsTrigger value="conditions">Conditions</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="visual" className="space-y-4">
                  <VisualFlow rule={editingRule} />
                </TabsContent>

                <TabsContent value="conditions" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Conditions</h3>
                    <Button onClick={handleAddCondition} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Condition
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={editingRule.conditions.map((_, index) => `condition-${index}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {editingRule.conditions.map((condition, index) => (
                          <SortableCondition
                            key={`condition-${index}`}
                            condition={condition}
                            index={index}
                            onUpdate={handleUpdateCondition}
                            onRemove={handleRemoveCondition}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Actions</h3>
                    <Button onClick={handleAddAction} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Action
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={editingRule.actions.map((_, index) => `action-${index}`)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {editingRule.actions.map((action, index) => (
                          <SortableAction
                            key={`action-${index}`}
                            action={action}
                            index={index}
                            onUpdate={handleUpdateAction}
                            onRemove={handleRemoveAction}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </TabsContent>
              </Tabs>

              {/* Test Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Test Rule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={testScenario.phoneNumber}
                      onChange={(e) => setTestScenario({ ...testScenario, phoneNumber: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <Label>Text Content</Label>
                    <Input
                      value={testScenario.text}
                      onChange={(e) => setTestScenario({ ...testScenario, text: e.target.value })}
                      placeholder="Enter text to test"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={handleTest} variant="outline">
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Rule
                  </Button>
                </div>
                {testResult && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <h4 className="font-medium mb-2">Test Result</h4>
                    <pre className="text-sm">{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Rule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
