"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, GripVertical, Trash2, Edit, Save, X, Copy } from "lucide-react"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import {
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface RoutingRule {
  id: string
  name: string
  priority: number
  conditions: {
    type: "time" | "department" | "skill" | "language" | "queue"
    operator: "equals" | "contains" | "starts_with" | "ends_with" | "in" | "not_in"
    value: string | string[]
  }[]
  actions: {
    type: "route_to_queue" | "route_to_agent" | "route_to_voicemail" | "play_message" | "transfer"
    target: string
    message?: string
  }[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface RuleTemplate {
  id: string
  name: string
  description: string
  category: "business_hours" | "department" | "skill_based" | "language" | "priority"
  rules: Omit<RoutingRule, "id" | "createdAt" | "updatedAt">[]
}

const ruleTemplates: RuleTemplate[] = [
  {
    id: "business_hours",
    name: "Business Hours Routing",
    description: "Route calls based on business hours",
    category: "business_hours",
    rules: [
      {
        name: "Business Hours - Sales",
        priority: 1,
        conditions: [
          { type: "time", operator: "in", value: ["09:00-17:00"] },
          { type: "department", operator: "equals", value: "sales" }
        ],
        actions: [
          { type: "route_to_queue", target: "sales_queue" }
        ],
        isActive: true
      },
      {
        name: "After Hours - Voicemail",
        priority: 2,
        conditions: [
          { type: "time", operator: "not_in", value: ["09:00-17:00"] }
        ],
        actions: [
          { type: "play_message", target: "after_hours", message: "Thank you for calling. Our office is currently closed. Please leave a message." },
          { type: "route_to_voicemail", target: "general_voicemail" }
        ],
        isActive: true
      }
    ]
  },
  {
    id: "skill_based",
    name: "Skill-Based Routing",
    description: "Route calls based on agent skills",
    category: "skill_based",
    rules: [
      {
        name: "Technical Support",
        priority: 1,
        conditions: [
          { type: "skill", operator: "equals", value: "technical" }
        ],
        actions: [
          { type: "route_to_queue", target: "technical_support" }
        ],
        isActive: true
      },
      {
        name: "Billing Support",
        priority: 2,
        conditions: [
          { type: "skill", operator: "equals", value: "billing" }
        ],
        actions: [
          { type: "route_to_queue", target: "billing_support" }
        ],
        isActive: true
      }
    ]
  },
  {
    id: "language",
    name: "Language-Based Routing",
    description: "Route calls based on language preference",
    category: "language",
    rules: [
      {
        name: "Spanish Speakers",
        priority: 1,
        conditions: [
          { type: "language", operator: "equals", value: "spanish" }
        ],
        actions: [
          { type: "route_to_queue", target: "spanish_support" }
        ],
        isActive: true
      },
      {
        name: "English Speakers",
        priority: 2,
        conditions: [
          { type: "language", operator: "equals", value: "english" }
        ],
        actions: [
          { type: "route_to_queue", target: "general_support" }
        ],
        isActive: true
      }
    ]
  }
]

function SortableRuleItem({ rule, onEdit, onDelete, onToggle }: {
  rule: RoutingRule
  onEdit: (rule: RoutingRule) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:cursor-grabbing p-1"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-medium">{rule.name}</h3>
              <Badge variant={rule.isActive ? "default" : "secondary"}>
                Priority {rule.priority}
              </Badge>
              {!rule.isActive && (
                <Badge variant="outline">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''} • {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(rule.id)}
          >
            {rule.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(rule)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(rule.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function RoutingRulesBuilder() {
  const [rules, setRules] = useState<RoutingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      // In a real implementation, this would fetch from an API
      // For now, we'll use mock data
      const mockRules: RoutingRule[] = [
        {
          id: "1",
          name: "Business Hours - Sales",
          priority: 1,
          conditions: [
            { type: "time", operator: "in", value: ["09:00-17:00"] },
            { type: "department", operator: "equals", value: "sales" }
          ],
          actions: [
            { type: "route_to_queue", target: "sales_queue" }
          ],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "2",
          name: "After Hours - Voicemail",
          priority: 2,
          conditions: [
            { type: "time", operator: "not_in", value: ["09:00-17:00"] }
          ],
          actions: [
            { type: "play_message", target: "after_hours", message: "Thank you for calling. Our office is currently closed." },
            { type: "route_to_voicemail", target: "general_voicemail" }
          ],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      setRules(mockRules)
    } catch (error) {
      console.error("Error fetching rules:", error)
      toast.error("Failed to fetch routing rules")
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setRules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newRules = arrayMove(items, oldIndex, newIndex)
        
        // Update priorities based on new order
        return newRules.map((rule, index) => ({
          ...rule,
          priority: index + 1
        }))
      })

      toast.success("Rule order updated")
    }
  }

  const handleCreateRule = () => {
    const newRule: RoutingRule = {
      id: Date.now().toString(),
      name: "New Rule",
      priority: rules.length + 1,
      conditions: [],
      actions: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setEditingRule(newRule)
  }

  const handleEditRule = (rule: RoutingRule) => {
    setEditingRule(rule)
  }

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id))
    toast.success("Rule deleted")
  }

  const handleToggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ))
    toast.success("Rule status updated")
  }

  const handleSaveRule = (rule: RoutingRule) => {
    if (editingRule?.id === rule.id) {
      // Update existing rule
      setRules(rules.map(r => r.id === rule.id ? rule : r))
    } else {
      // Add new rule
      setRules([...rules, rule])
    }
    setEditingRule(null)
    toast.success("Rule saved")
  }

  const handleApplyTemplate = (template: RuleTemplate) => {
    const newRules = template.rules.map((rule, index) => ({
      ...rule,
      id: `${template.id}_${index}_${Date.now()}`,
      priority: rules.length + index + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    
    setRules([...rules, ...newRules])
    setShowTemplateSelector(false)
    toast.success(`Applied ${template.name} template`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Routing Rules</h2>
          <p className="text-gray-600">
            Configure how calls are routed based on conditions and priorities
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowTemplateSelector(true)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Use Template
          </Button>
          <Button onClick={handleCreateRule}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
          <CardDescription>
            Rules are processed in priority order. Drag to reorder.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No routing rules configured. Create a rule or use a template to get started.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rules.map(rule => rule.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <SortableRuleItem
                      key={rule.id}
                      rule={rule}
                      onEdit={handleEditRule}
                      onDelete={handleDeleteRule}
                      onToggle={handleToggleRule}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Choose a Template</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplateSelector(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid gap-4">
              {ruleTemplates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{template.category}</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        Apply Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rule Editor Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingRule.id === rules.find(r => r.id === editingRule.id)?.id ? "Edit Rule" : "Create Rule"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRule(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  placeholder="Enter rule name"
                />
              </div>
              
              <div>
                <Label htmlFor="rule-priority">Priority</Label>
                <Input
                  id="rule-priority"
                  type="number"
                  value={editingRule.priority}
                  onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) })}
                  min="1"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rule-active"
                  checked={editingRule.isActive}
                  onChange={(e) => setEditingRule({ ...editingRule, isActive: e.target.checked })}
                />
                <Label htmlFor="rule-active">Active</Label>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Conditions</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Define when this rule should be applied
                </p>
                {/* Condition builder would go here */}
                <div className="text-sm text-gray-500 italic">
                  Condition builder UI would be implemented here
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Actions</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Define what happens when conditions are met
                </p>
                {/* Action builder would go here */}
                <div className="text-sm text-gray-500 italic">
                  Action builder UI would be implemented here
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditingRule(null)}
              >
                Cancel
              </Button>
              <Button onClick={() => handleSaveRule(editingRule)}>
                <Save className="h-4 w-4 mr-2" />
                Save Rule
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
