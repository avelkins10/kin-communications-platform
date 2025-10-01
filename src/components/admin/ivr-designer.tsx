"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Play, Save, Phone, ArrowRight, ArrowDown, GripVertical, Workflow, Code, Copy, Eye } from "lucide-react"
import { toast } from "sonner"
import { useIVRMenus } from "@/lib/hooks/use-admin"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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

interface IVRAction {
  type: "transfer" | "hangup" | "voicemail" | "queue" | "menu"
  target?: string
  queueSid?: string
  menuId?: string
  message?: string
}

interface IVROption {
  digit: string
  action: IVRAction
  description?: string
}

interface IVRMenu {
  id?: string
  name: string
  greeting: string
  timeout: number
  maxRetries: number
  options: IVROption[]
  timeoutAction: IVRAction
  invalidAction: IVRAction
  isActive: boolean
  createdAt?: string
  _count?: {
    calls: number
  }
}

const defaultAction: IVRAction = {
  type: "hangup",
  message: "Thank you for calling. Goodbye.",
}

const defaultOption: IVROption = {
  digit: "1",
  action: defaultAction,
  description: "",
}

const defaultIVRMenu: IVRMenu = {
  name: "",
  greeting: "Thank you for calling. Please press a number to continue.",
  timeout: 10,
  maxRetries: 3,
  options: [],
  timeoutAction: defaultAction,
  invalidAction: defaultAction,
  isActive: true,
}

const availableDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

// Function to generate TwiML from IVR menu configuration
const generateTwiML = (menu: IVRMenu): string => {
  let twiml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n'
  
  // Add greeting
  if (menu.greeting) {
    twiml += `  <Say voice="alice">${menu.greeting}</Say>\n`
  }
  
  // Add gather with options
  if (menu.options.length > 0) {
    twiml += `  <Gather numDigits="1" timeout="${menu.timeout}" action="/api/admin/ivr/${menu.id}/process" method="POST">\n`
    
    // Add options
    menu.options.forEach(option => {
      if (option.description) {
        twiml += `    <Say voice="alice">Press ${option.digit} for ${option.description}</Say>\n`
      }
    })
    
    twiml += `  </Gather>\n`
  }
  
  // Add timeout action
  if (menu.timeoutAction) {
    twiml += generateActionTwiML(menu.timeoutAction, "timeout")
  }
  
  // Add invalid action
  if (menu.invalidAction) {
    twiml += generateActionTwiML(menu.invalidAction, "invalid")
  }
  
  twiml += '</Response>'
  return twiml
}

// Function to generate TwiML for individual actions
const generateActionTwiML = (action: IVRAction, context: string): string => {
  let twiml = ''
  
  switch (action.type) {
    case "transfer":
      if (action.target) {
        twiml += `  <Dial>${action.target}</Dial>\n`
      }
      break
    case "hangup":
      if (action.message) {
        twiml += `  <Say voice="alice">${action.message}</Say>\n`
      }
      twiml += `  <Hangup/>\n`
      break
    case "voicemail":
      twiml += `  <Say voice="alice">Please leave a message after the beep.</Say>\n`
      twiml += `  <Record maxLength="300" action="/api/webhooks/twilio/voicemail" method="POST"/>\n`
      break
    case "queue":
      if (action.queueSid) {
        twiml += `  <Enqueue>${action.queueSid}</Enqueue>\n`
      }
      break
    case "menu":
      if (action.menuId) {
        twiml += `  <Redirect>/api/admin/ivr/${action.menuId}</Redirect>\n`
      }
      break
  }
  
  return twiml
}

// TwiML Preview Component
function TwiMLPreview({ menu }: { menu: IVRMenu }) {
  const [copied, setCopied] = useState(false)
  const twiml = generateTwiML(menu)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(twiml)
      setCopied(true)
      toast.success("TwiML copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy TwiML")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">TwiML Preview</h3>
          <p className="text-sm text-muted-foreground">
            Generated TwiML for this IVR menu
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
            <code>{twiml}</code>
          </pre>
        </CardContent>
      </Card>
      
      <div className="text-xs text-muted-foreground">
        <p><strong>Note:</strong> This TwiML will be generated when the menu is saved and can be used to configure your Twilio phone number's webhook URL.</p>
      </div>
    </div>
  )
}

export function IVRDesigner() {
  const [saving, setSaving] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<IVRMenu | null>(null)
  const [formData, setFormData] = useState<IVRMenu>(defaultIVRMenu)
  const [testingMenu, setTestingMenu] = useState<IVRMenu | null>(null)

  // Use the shared hook for IVR menus
  const {
    data: ivrMenus,
    loading,
    error,
    refetch,
    createItem,
    updateItem,
    deleteItem
  } = useIVRMenus()

  const handleCreateMenu = async () => {
    try {
      setSaving(true)
      await createItem(formData)
      toast.success("IVR menu created successfully")
      setIsCreateDialogOpen(false)
      setFormData(defaultIVRMenu)
    } catch (error) {
      console.error("Error creating IVR menu:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create IVR menu")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateMenu = async () => {
    if (!editingMenu?.id) return

    try {
      setSaving(true)
      await updateItem(editingMenu.id, formData)
      toast.success("IVR menu updated successfully")
      setIsEditDialogOpen(false)
      setEditingMenu(null)
      setFormData(defaultIVRMenu)
    } catch (error) {
      console.error("Error updating IVR menu:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update IVR menu")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm("Are you sure you want to deactivate this IVR menu?")) return

    try {
      await deleteItem(menuId)
      toast.success("IVR menu deactivated successfully")
    } catch (error) {
      console.error("Error deleting IVR menu:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete IVR menu")
    }
  }

  const openEditDialog = (menu: IVRMenu) => {
    setEditingMenu(menu)
    setFormData(menu)
    setIsEditDialogOpen(true)
  }

  const openTestDialog = (menu: IVRMenu) => {
    setTestingMenu(menu)
  }

  const addOption = () => {
    const usedDigits = formData.options.map(opt => opt.digit)
    const availableDigit = availableDigits.find(digit => !usedDigits.includes(digit))
    
    if (!availableDigit) {
      toast.error("No more digits available")
      return
    }

    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { ...defaultOption, digit: availableDigit }],
    }))
  }

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  const updateOption = (index: number, field: keyof IVROption, value: any) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      ),
    }))
  }

  const updateAction = (index: number, field: keyof IVRAction, value: any) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, action: { ...opt.action, [field]: value } } : opt
      ),
    }))
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case "transfer":
        return <ArrowRight className="h-4 w-4" />
      case "hangup":
        return <Phone className="h-4 w-4" />
      case "voicemail":
        return <Phone className="h-4 w-4" />
      case "queue":
        return <ArrowDown className="h-4 w-4" />
      case "menu":
        return <ArrowRight className="h-4 w-4" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case "transfer":
        return "bg-blue-100 text-blue-800"
      case "hangup":
        return "bg-red-100 text-red-800"
      case "voicemail":
        return "bg-yellow-100 text-yellow-800"
      case "queue":
        return "bg-green-100 text-green-800"
      case "menu":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IVR Menu Designer</h2>
          <p className="text-muted-foreground">
            Create and manage interactive voice response menus
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create IVR Menu</DialogTitle>
            </DialogHeader>
            <IVRMenuForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreateMenu}
              saving={saving}
              onAddOption={addOption}
              onRemoveOption={removeOption}
              onUpdateOption={updateOption}
              onUpdateAction={updateAction}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* IVR Menus Table */}
      <Card>
        <CardHeader>
          <CardTitle>IVR Menus ({ivrMenus.length})</CardTitle>
          <CardDescription>
            Manage your interactive voice response menus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Greeting</TableHead>
                <TableHead>Options</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ivrMenus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell>
                    <div className="font-medium">{menu.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Timeout: {menu.timeout}s, Max Retries: {menu.maxRetries}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">{menu.greeting}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {menu.options.map((option) => (
                        <Badge key={option.digit} variant="outline" className="text-xs">
                          {option.digit}: {option.action.type}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={menu.isActive ? "default" : "secondary"}>
                      {menu.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {menu._count?.calls || 0} calls
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTestDialog(menu)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(menu)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMenu(menu.id!)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit IVR Menu</DialogTitle>
          </DialogHeader>
          <IVRMenuForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateMenu}
            saving={saving}
            onAddOption={addOption}
            onRemoveOption={removeOption}
            onUpdateOption={updateOption}
            onUpdateAction={updateAction}
          />
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={!!testingMenu} onOpenChange={() => setTestingMenu(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test IVR Menu</DialogTitle>
          </DialogHeader>
          {testingMenu && (
            <IVRMenuTest menu={testingMenu} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface IVRMenuFormProps {
  formData: IVRMenu
  setFormData: (data: IVRMenu) => void
  onSubmit: () => void
  saving: boolean
  onAddOption: () => void
  onRemoveOption: (index: number) => void
  onUpdateOption: (index: number, field: keyof IVROption, value: any) => void
  onUpdateAction: (index: number, field: keyof IVRAction, value: any) => void
}

function IVRMenuForm({
  formData,
  setFormData,
  onSubmit,
  saving,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onUpdateAction,
}: IVRMenuFormProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="options">Menu Options</TabsTrigger>
          <TabsTrigger value="flow">Visual Flow</TabsTrigger>
          <TabsTrigger value="actions">Default Actions</TabsTrigger>
          <TabsTrigger value="twiml">TwiML Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Menu Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter menu name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="greeting">Greeting Message</Label>
            <Textarea
              id="greeting"
              value={formData.greeting}
              onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
              placeholder="Enter greeting message"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                value={formData.timeout}
                onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) || 10 })}
                min={1}
                max={30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxRetries">Max Retries</Label>
              <Input
                id="maxRetries"
                type="number"
                value={formData.maxRetries}
                onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 3 })}
                min={1}
                max={5}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label>Active</Label>
          </div>
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Menu Options</Label>
            <Button variant="outline" size="sm" onClick={onAddOption}>
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>

          <div className="space-y-4">
            {formData.options.map((option, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label>Option {option.digit}</Label>
                      <Badge variant="outline">{option.action.type}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveOption(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Digit</Label>
                      <Select
                        value={option.digit}
                        onValueChange={(value) => onUpdateOption(index, "digit", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDigits.map((digit) => (
                            <SelectItem key={digit} value={digit}>{digit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select
                        value={option.action.type}
                        onValueChange={(value) => onUpdateAction(index, "type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer">Transfer</SelectItem>
                          <SelectItem value="hangup">Hangup</SelectItem>
                          <SelectItem value="voicemail">Voicemail</SelectItem>
                          <SelectItem value="queue">Queue</SelectItem>
                          <SelectItem value="menu">Sub-menu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={option.description || ""}
                      onChange={(e) => onUpdateOption(index, "description", e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>

                  {option.action.type === "transfer" && (
                    <div className="space-y-2">
                      <Label>Transfer Target</Label>
                      <Input
                        value={option.action.target || ""}
                        onChange={(e) => onUpdateAction(index, "target", e.target.value)}
                        placeholder="Phone number or extension"
                      />
                    </div>
                  )}

                  {option.action.type === "queue" && (
                    <div className="space-y-2">
                      <Label>Queue SID</Label>
                      <Input
                        value={option.action.queueSid || ""}
                        onChange={(e) => onUpdateAction(index, "queueSid", e.target.value)}
                        placeholder="TaskRouter queue SID"
                      />
                    </div>
                  )}

                  {option.action.type === "menu" && (
                    <div className="space-y-2">
                      <Label>Menu ID</Label>
                      <Input
                        value={option.action.menuId || ""}
                        onChange={(e) => onUpdateAction(index, "menuId", e.target.value)}
                        placeholder="Sub-menu ID"
                      />
                    </div>
                  )}

                  {(option.action.type === "hangup" || option.action.type === "voicemail") && (
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={option.action.message || ""}
                        onChange={(e) => onUpdateAction(index, "message", e.target.value)}
                        placeholder="Message to play before action"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="flow" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Visual Flow Builder</Label>
                <p className="text-sm text-muted-foreground">
                  Drag and drop to reorder menu options and see the flow visually
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={onAddOption}>
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            <IVRFlowBuilder
              formData={formData}
              setFormData={setFormData}
              onRemoveOption={onRemoveOption}
              onUpdateOption={onUpdateOption}
              onUpdateAction={onUpdateAction}
            />
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Timeout Action</Label>
              <ActionConfig
                action={formData.timeoutAction}
                onChange={(action) => setFormData({ ...formData, timeoutAction: action })}
              />
            </div>

            <Separator />

            <div>
              <Label>Invalid Input Action</Label>
              <ActionConfig
                action={formData.invalidAction}
                onChange={(action) => setFormData({ ...formData, invalidAction: action })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="twiml" className="space-y-4">
          <TwiMLPreview menu={formData} />
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setFormData(defaultIVRMenu)}>
          Reset
        </Button>
        <Button onClick={onSubmit} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Menu"}
        </Button>
      </div>
    </div>
  )
}

interface ActionConfigProps {
  action: IVRAction
  onChange: (action: IVRAction) => void
}

function ActionConfig({ action, onChange }: ActionConfigProps) {
  return (
    <div className="space-y-4 p-4 border rounded-md">
      <div className="space-y-2">
        <Label>Action Type</Label>
        <Select
          value={action.type}
          onValueChange={(value) => onChange({ ...action, type: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="hangup">Hangup</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
            <SelectItem value="queue">Queue</SelectItem>
            <SelectItem value="menu">Sub-menu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {action.type === "transfer" && (
        <div className="space-y-2">
          <Label>Transfer Target</Label>
          <Input
            value={action.target || ""}
            onChange={(e) => onChange({ ...action, target: e.target.value })}
            placeholder="Phone number or extension"
          />
        </div>
      )}

      {action.type === "queue" && (
        <div className="space-y-2">
          <Label>Queue SID</Label>
          <Input
            value={action.queueSid || ""}
            onChange={(e) => onChange({ ...action, queueSid: e.target.value })}
            placeholder="TaskRouter queue SID"
          />
        </div>
      )}

      {action.type === "menu" && (
        <div className="space-y-2">
          <Label>Menu ID</Label>
          <Input
            value={action.menuId || ""}
            onChange={(e) => onChange({ ...action, menuId: e.target.value })}
            placeholder="Sub-menu ID"
          />
        </div>
      )}

      {(action.type === "hangup" || action.type === "voicemail") && (
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            value={action.message || ""}
            onChange={(e) => onChange({ ...action, message: e.target.value })}
            placeholder="Message to play before action"
            rows={2}
          />
        </div>
      )}
    </div>
  )
}

interface IVRMenuTestProps {
  menu: IVRMenu
}

function IVRMenuTest({ menu }: IVRMenuTestProps) {
  const [testStep, setTestStep] = useState(0)
  const [selectedDigit, setSelectedDigit] = useState<string>("")

  const testSteps = [
    { title: "Greeting", content: menu.greeting },
    { title: "Menu Options", content: "Available options: " + menu.options.map(opt => `${opt.digit} - ${opt.description || opt.action.type}`).join(", ") },
    { title: "Action Result", content: selectedDigit ? `Option ${selectedDigit} selected: ${menu.options.find(opt => opt.digit === selectedDigit)?.action.type || "Invalid"}` : "No option selected" },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Test Menu: {menu.name}</Label>
        <div className="text-sm text-muted-foreground">
          Simulate the IVR menu flow
        </div>
      </div>

      <div className="space-y-4">
        {testSteps.map((step, index) => (
          <Card key={index} className={`p-4 ${testStep === index ? "border-primary" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{step.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{step.content}</div>
              </div>
              {testStep === index && (
                <Badge variant="default">Current</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Test Options</Label>
        <div className="grid grid-cols-5 gap-2">
          {menu.options.map((option) => (
            <Button
              key={option.digit}
              variant={selectedDigit === option.digit ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedDigit(option.digit)
                setTestStep(2)
              }}
            >
              {option.digit}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setTestStep(Math.max(0, testStep - 1))
            if (testStep === 2) setSelectedDigit("")
          }}
          disabled={testStep === 0}
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            setTestStep(Math.min(2, testStep + 1))
            if (testStep === 0) setSelectedDigit("")
          }}
          disabled={testStep === 2}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

interface IVRFlowBuilderProps {
  formData: IVRMenu
  setFormData: (data: IVRMenu) => void
  onRemoveOption: (index: number) => void
  onUpdateOption: (index: number, field: keyof IVROption, value: any) => void
  onUpdateAction: (index: number, field: keyof IVRAction, value: any) => void
}

function IVRFlowBuilder({
  formData,
  setFormData,
  onRemoveOption,
  onUpdateOption,
  onUpdateAction,
}: IVRFlowBuilderProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = formData.options.findIndex((option) => option.digit === active.id)
      const newIndex = formData.options.findIndex((option) => option.digit === over.id)

      const newOptions = arrayMove(formData.options, oldIndex, newIndex)
      setFormData({ ...formData, options: newOptions })
      toast.success("Menu option order updated")
    }

    setActiveId(null)
  }

  return (
    <div className="space-y-6">
      {/* Greeting Node */}
      <div className="flex justify-center">
        <Card className="w-80 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2">
            <Phone className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-900">Greeting</div>
              <div className="text-sm text-blue-700 truncate max-w-60">
                {formData.greeting || "No greeting set"}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Flow Arrow */}
      <div className="flex justify-center">
        <ArrowDown className="h-6 w-6 text-gray-400" />
      </div>

      {/* Menu Options */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={formData.options.map(option => option.digit)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {formData.options.map((option, index) => (
              <SortableOptionNode
                key={option.digit}
                option={option}
                index={index}
                onRemove={() => onRemoveOption(index)}
                onUpdateOption={onUpdateOption}
                onUpdateAction={onUpdateAction}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-50">
              {formData.options.find(opt => opt.digit === activeId) && (
                <OptionNode
                  option={formData.options.find(opt => opt.digit === activeId)!}
                  index={formData.options.findIndex(opt => opt.digit === activeId)}
                  onRemove={() => {}}
                  onUpdateOption={() => {}}
                  onUpdateAction={() => {}}
                />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Default Actions */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <ArrowDown className="h-6 w-6 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-900">Timeout Action</div>
                <div className="text-sm text-yellow-700">
                  {formData.timeoutAction.type}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium text-red-900">Invalid Action</div>
                <div className="text-sm text-red-700">
                  {formData.invalidAction.type}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface SortableOptionNodeProps {
  option: IVROption
  index: number
  onRemove: () => void
  onUpdateOption: (index: number, field: keyof IVROption, value: any) => void
  onUpdateAction: (index: number, field: keyof IVRAction, value: any) => void
}

function SortableOptionNode({
  option,
  index,
  onRemove,
  onUpdateOption,
  onUpdateAction,
}: SortableOptionNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.digit })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <OptionNode
        option={option}
        index={index}
        onRemove={onRemove}
        onUpdateOption={onUpdateOption}
        onUpdateAction={onUpdateAction}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

interface OptionNodeProps {
  option: IVROption
  index: number
  onRemove: () => void
  onUpdateOption: (index: number, field: keyof IVROption, value: any) => void
  onUpdateAction: (index: number, field: keyof IVRAction, value: any) => void
  dragHandleProps?: any
}

function OptionNode({
  option,
  index,
  onRemove,
  onUpdateOption,
  onUpdateAction,
  dragHandleProps,
}: OptionNodeProps) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case "transfer":
        return <ArrowRight className="h-4 w-4" />
      case "hangup":
        return <Phone className="h-4 w-4" />
      case "voicemail":
        return <Phone className="h-4 w-4" />
      case "queue":
        return <ArrowDown className="h-4 w-4" />
      case "menu":
        return <ArrowRight className="h-4 w-4" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case "transfer":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "hangup":
        return "bg-red-100 text-red-800 border-red-200"
      case "voicemail":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "queue":
        return "bg-green-100 text-green-800 border-green-200"
      case "menu":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="cursor-grab hover:cursor-grabbing p-2 text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Option Node */}
      <Card className={`flex-1 p-4 ${getActionColor(option.action.type)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-current font-bold text-sm">
              {option.digit}
            </div>
            <div>
              <div className="font-medium flex items-center space-x-2">
                {getActionIcon(option.action.type)}
                <span>Option {option.digit}</span>
              </div>
              <div className="text-sm opacity-75">
                {option.description || option.action.type}
                {option.action.target && ` → ${option.action.target}`}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
