"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ProfessionalForm } from "@/components/ui/professional-form"
import { ProfessionalCard } from "@/components/ui/professional-card"
import { LoadingState } from "@/components/ui/loading-state"
import { ActionButton } from "@/components/ui/action-button"
import { StatusIndicator } from "@/components/ui/status-indicator"
import { useProfessionalInteractions } from "@/lib/hooks/use-professional-interactions"
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Activity,
  Loader2,
  AlertCircle
} from "lucide-react"
import { PerformanceDashboard } from "@/components/admin/performance-dashboard"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userSettings, setUserSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false
    },
    privacy: {
      profileVisibility: 'public',
      dataSharing: false
    },
    preferences: {
      theme: 'system',
      language: 'en',
      timezone: 'UTC'
    }
  })

  const { useButtonState, useNotification } = useProfessionalInteractions()
  const saveButtonState = useButtonState()
  const notification = useNotification()

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    setIsLoading(false)
  }, [status, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingState variant="spinner" size="lg" message="Loading settings..." />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Please sign in to access settings</p>
        </div>
      </div>
    )
  }

  const isAdmin = (session.user as any)?.role === 'admin'

  const handleSettingChange = (category: string, setting: string, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfessionalCard variant="default" status="active">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProfessionalForm
                fields={[
                  {
                    name: "name",
                    label: "Full Name",
                    type: "text",
                    value: session.user?.name || '',
                    placeholder: "Enter your full name",
                    required: true,
                  },
                  {
                    name: "email",
                    label: "Email",
                    type: "email",
                    value: session.user?.email || '',
                    placeholder: "Enter your email",
                    disabled: true,
                    description: "Email cannot be changed",
                  },
                  {
                    name: "role",
                    label: "Role",
                    type: "text",
                    value: (session.user as any)?.role || 'user',
                    disabled: true,
                    description: "Role is assigned by administrators",
                  },
                ]}
                onSubmit={async (data) => {
                  await saveButtonState.executeWithState(async () => {
                    // Simulate save operation
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    notification.showSuccess("Profile updated successfully")
                  })
                }}
                submitLabel="Save Changes"
                showSubmit={true}
              />
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <ProfessionalCard variant="default" status="active">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about updates and activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProfessionalForm
                fields={[
                  {
                    name: "email",
                    label: "Email Notifications",
                    type: "checkbox",
                    value: userSettings.notifications.email,
                    description: "Receive notifications via email",
                  },
                  {
                    name: "push",
                    label: "Push Notifications",
                    type: "checkbox",
                    value: userSettings.notifications.push,
                    description: "Receive push notifications in your browser",
                  },
                  {
                    name: "sms",
                    label: "SMS Notifications",
                    type: "checkbox",
                    value: userSettings.notifications.sms,
                    description: "Receive notifications via SMS",
                  },
                ]}
                onSubmit={async (data) => {
                  await saveButtonState.executeWithState(async () => {
                    // Update settings
                    setUserSettings(prev => ({
                      ...prev,
                      notifications: {
                        email: data.email || false,
                        push: data.push || false,
                        sms: data.sms || false,
                      }
                    }))
                    // Simulate save operation
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    notification.showSuccess("Notification preferences updated successfully")
                  })
                }}
                submitLabel="Save Preferences"
                showSubmit={true}
              />
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <ProfessionalCard variant="default" status="active">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your privacy settings and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProfessionalForm
                fields={[
                  {
                    name: "profileVisibility",
                    label: "Profile Visibility",
                    type: "select",
                    value: userSettings.privacy.profileVisibility,
                    options: [
                      { value: "public", label: "Public" },
                      { value: "private", label: "Private" },
                      { value: "team", label: "Team Only" },
                    ],
                    description: "Control who can see your profile information",
                  },
                  {
                    name: "dataSharing",
                    label: "Data Sharing",
                    type: "checkbox",
                    value: userSettings.privacy.dataSharing,
                    description: "Allow sharing of anonymized usage data for product improvement",
                  },
                ]}
                onSubmit={async (data) => {
                  await saveButtonState.executeWithState(async () => {
                    // Update settings
                    setUserSettings(prev => ({
                      ...prev,
                      privacy: {
                        profileVisibility: data.profileVisibility || 'public',
                        dataSharing: data.dataSharing || false,
                      }
                    }))
                    // Simulate save operation
                    await new Promise(resolve => setTimeout(resolve, 1000))
                    notification.showSuccess("Privacy settings updated successfully")
                  })
                }}
                submitLabel="Save Privacy Settings"
                showSubmit={true}
              />
            </CardContent>
          </ProfessionalCard>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="performance" className="space-y-6">
            <PerformanceDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}


