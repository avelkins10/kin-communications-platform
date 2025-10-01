"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Save, Settings, Route, Voicemail, Mic, Bell, Shield, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useSystemSettings } from "@/lib/hooks/use-admin"

interface RoutingSettings {
  defaultQueue?: string
  fallbackQueue?: string
  maxWaitTime: number
  priorityRouting: boolean
  skillBasedRouting: boolean
}

interface VoicemailSettings {
  enabled: boolean
  timeout: number
  greetingMessage?: string
  transcriptionEnabled: boolean
  emailNotifications: boolean
}

interface RecordingSettings {
  enabled: boolean
  recordFromAnswer: boolean
  trimSilence: boolean
  channels: "mono" | "dual"
}

interface NotificationSettings {
  emailEnabled: boolean
  smsEnabled: boolean
  webhookEnabled: boolean
  webhookUrl?: string
  adminEmail?: string
}

interface SystemSettings {
  routing: RoutingSettings
  voicemail: VoicemailSettings
  recording: RecordingSettings
  notifications: NotificationSettings
  maintenanceMode: boolean
  debugMode: boolean
}

const defaultSettings: SystemSettings = {
  routing: {
    defaultQueue: "",
    fallbackQueue: "",
    maxWaitTime: 300,
    priorityRouting: false,
    skillBasedRouting: true,
  },
  voicemail: {
    enabled: true,
    timeout: 30,
    greetingMessage: "",
    transcriptionEnabled: true,
    emailNotifications: true,
  },
  recording: {
    enabled: true,
    recordFromAnswer: true,
    trimSilence: false,
    channels: "mono",
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    webhookEnabled: false,
    webhookUrl: "",
    adminEmail: "",
  },
  maintenanceMode: false,
  debugMode: false,
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Use the shared hook for system settings
  const {
    data,
    loading,
    error,
    refetch,
    updateItem
  } = useSystemSettings()

  useEffect(() => {
    if (data) {
      setSettings(data)
    }
  }, [data])

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateItem(settings)
      toast.success("System settings saved successfully")
      setHasChanges(false)
    } catch (error) {
      console.error("Error saving system settings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save system settings")
    } finally {
      setSaving(false)
    }
  }

  const updateSettings = (section: keyof SystemSettings, updates: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }))
    setHasChanges(true)
  }

  const resetToDefaults = () => {
    if (confirm("Are you sure you want to reset all settings to defaults? This action cannot be undone.")) {
      setSettings(defaultSettings)
      setHasChanges(true)
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
          <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Configure global system preferences and behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="routing" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="routing">
            <Route className="h-4 w-4 mr-2" />
            Routing
          </TabsTrigger>
          <TabsTrigger value="voicemail">
            <Voicemail className="h-4 w-4 mr-2" />
            Voicemail
          </TabsTrigger>
          <TabsTrigger value="recording">
            <Mic className="h-4 w-4 mr-2" />
            Recording
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system">
            <Shield className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Routing Settings</CardTitle>
              <CardDescription>
                Configure how calls are routed and distributed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultQueue">Default Queue</Label>
                  <Input
                    id="defaultQueue"
                    value={settings.routing.defaultQueue || ""}
                    onChange={(e) => updateSettings("routing", { defaultQueue: e.target.value })}
                    placeholder="TaskRouter queue SID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fallbackQueue">Fallback Queue</Label>
                  <Input
                    id="fallbackQueue"
                    value={settings.routing.fallbackQueue || ""}
                    onChange={(e) => updateSettings("routing", { fallbackQueue: e.target.value })}
                    placeholder="Fallback queue SID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxWaitTime">Maximum Wait Time (seconds)</Label>
                <Input
                  id="maxWaitTime"
                  type="number"
                  value={settings.routing.maxWaitTime}
                  onChange={(e) => updateSettings("routing", { maxWaitTime: parseInt(e.target.value) || 300 })}
                  min={1}
                  max={3600}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Priority Routing</Label>
                    <p className="text-sm text-muted-foreground">
                      Route calls based on priority levels
                    </p>
                  </div>
                  <Switch
                    checked={settings.routing.priorityRouting}
                    onCheckedChange={(checked) => updateSettings("routing", { priorityRouting: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Skill-Based Routing</Label>
                    <p className="text-sm text-muted-foreground">
                      Route calls based on agent skills and capabilities
                    </p>
                  </div>
                  <Switch
                    checked={settings.routing.skillBasedRouting}
                    onCheckedChange={(checked) => updateSettings("routing", { skillBasedRouting: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voicemail" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Voicemail Settings</CardTitle>
              <CardDescription>
                Configure voicemail behavior and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Voicemail</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow callers to leave voicemail messages
                  </p>
                </div>
                <Switch
                  checked={settings.voicemail.enabled}
                  onCheckedChange={(checked) => updateSettings("voicemail", { enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voicemailTimeout">Voicemail Timeout (seconds)</Label>
                <Input
                  id="voicemailTimeout"
                  type="number"
                  value={settings.voicemail.timeout}
                  onChange={(e) => updateSettings("voicemail", { timeout: parseInt(e.target.value) || 30 })}
                  min={5}
                  max={60}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="greetingMessage">Default Greeting Message</Label>
                <Textarea
                  id="greetingMessage"
                  value={settings.voicemail.greetingMessage || ""}
                  onChange={(e) => updateSettings("voicemail", { greetingMessage: e.target.value })}
                  placeholder="Enter default voicemail greeting message"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Transcription Enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically transcribe voicemail messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.voicemail.transcriptionEnabled}
                    onCheckedChange={(checked) => updateSettings("voicemail", { transcriptionEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications for new voicemails
                    </p>
                  </div>
                  <Switch
                    checked={settings.voicemail.emailNotifications}
                    onCheckedChange={(checked) => updateSettings("voicemail", { emailNotifications: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recording" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Recording Settings</CardTitle>
              <CardDescription>
                Configure call recording behavior and quality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Recording</Label>
                  <p className="text-sm text-muted-foreground">
                    Record all calls for quality assurance
                  </p>
                </div>
                <Switch
                  checked={settings.recording.enabled}
                  onCheckedChange={(checked) => updateSettings("recording", { enabled: checked })}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Record From Answer</Label>
                    <p className="text-sm text-muted-foreground">
                      Start recording when the call is answered
                    </p>
                  </div>
                  <Switch
                    checked={settings.recording.recordFromAnswer}
                    onCheckedChange={(checked) => updateSettings("recording", { recordFromAnswer: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trim Silence</Label>
                    <p className="text-sm text-muted-foreground">
                      Remove silent periods from recordings
                    </p>
                  </div>
                  <Switch
                    checked={settings.recording.trimSilence}
                    onCheckedChange={(checked) => updateSettings("recording", { trimSilence: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="channels">Recording Channels</Label>
                <Select
                  value={settings.recording.channels}
                  onValueChange={(value: "mono" | "dual") => updateSettings("recording", { channels: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mono">Mono</SelectItem>
                    <SelectItem value="dual">Dual (Separate tracks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how system notifications are sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) => updateSettings("notifications", { emailEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsEnabled}
                    onCheckedChange={(checked) => updateSettings("notifications", { smsEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Webhook Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications to webhook URL
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.webhookEnabled}
                    onCheckedChange={(checked) => updateSettings("notifications", { webhookEnabled: checked })}
                  />
                </div>
              </div>

              {settings.notifications.emailEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.notifications.adminEmail || ""}
                    onChange={(e) => updateSettings("notifications", { adminEmail: e.target.value })}
                    placeholder="admin@example.com"
                  />
                </div>
              )}

              {settings.notifications.webhookEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={settings.notifications.webhookUrl || ""}
                    onChange={(e) => updateSettings("notifications", { webhookUrl: e.target.value })}
                    placeholder="https://your-webhook-url.com/notifications"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide behavior and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to restrict system access
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSettings("system", { maintenanceMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable debug logging and detailed error messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.debugMode}
                    onCheckedChange={(checked) => updateSettings("system", { debugMode: checked })}
                  />
                </div>
              </div>

              {settings.maintenanceMode && (
                <div className="p-4 border border-orange-200 rounded-md bg-orange-50">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Maintenance Mode Active</span>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    The system is currently in maintenance mode. Some features may be restricted.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
