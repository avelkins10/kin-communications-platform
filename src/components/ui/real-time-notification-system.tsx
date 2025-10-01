"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useSocket } from "@/components/socket-provider"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Bell, Volume2, VolumeX, Settings, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export interface Notification {
  id: string
  type: "info" | "success" | "warning" | "error" | "urgent"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
  sound?: boolean
  desktop?: boolean
}

export interface NotificationPreferences {
  sounds: boolean
  desktop: boolean
  voicemails: boolean
  calls: boolean
  tasks: boolean
  messages: boolean
  slaAlerts: boolean
}

export interface RealTimeNotificationSystemProps {
  className?: string
}

export function RealTimeNotificationSystem({ className }: RealTimeNotificationSystemProps) {
  const { socket } = useSocket()
  const { data: session } = useSession()
  const user = session?.user
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [preferences, setPreferences] = React.useState<NotificationPreferences>({
    sounds: true,
    desktop: true,
    voicemails: true,
    calls: true,
    tasks: true,
    messages: true,
    slaAlerts: true,
  })
  const [isOpen, setIsOpen] = React.useState(false)

  // Request notification permissions
  React.useEffect(() => {
    if (preferences.desktop && "Notification" in window) {
      Notification.requestPermission()
    }
  }, [preferences.desktop])

  // Socket event handlers
  React.useEffect(() => {
    if (!socket || !user) return

    const handleNewVoicemail = (data: any) => {
      if (!preferences.voicemails) return
      
      const notification: Notification = {
        id: `voicemail-${data.id}`,
        type: "urgent",
        title: "New Voicemail",
        message: `Voicemail from ${data.customerName}`,
        timestamp: new Date(),
        read: false,
        sound: preferences.sounds,
        desktop: preferences.desktop,
        actions: [
          {
            label: "Listen",
            action: () => {
              // Handle listen action
              console.log("Listen to voicemail:", data.id)
            }
          }
        ]
      }
      
      addNotification(notification)
    }

    const handleNewCall = (data: any) => {
      if (!preferences.calls) return
      
      const notification: Notification = {
        id: `call-${data.id}`,
        type: "info",
        title: "Incoming Call",
        message: `Call from ${data.customerName}`,
        timestamp: new Date(),
        read: false,
        sound: preferences.sounds,
        desktop: preferences.desktop,
      }
      
      addNotification(notification)
    }

    const handleNewTask = (data: any) => {
      if (!preferences.tasks) return
      
      const notification: Notification = {
        id: `task-${data.id}`,
        type: "warning",
        title: "New Task",
        message: data.description || "New task assigned",
        timestamp: new Date(),
        read: false,
        sound: preferences.sounds,
        desktop: preferences.desktop,
      }
      
      addNotification(notification)
    }

    const handleNewMessage = (data: any) => {
      if (!preferences.messages) return
      
      const notification: Notification = {
        id: `message-${data.id}`,
        type: "info",
        title: "New Message",
        message: `Message from ${data.customerName}`,
        timestamp: new Date(),
        read: false,
        sound: preferences.sounds,
        desktop: preferences.desktop,
      }
      
      addNotification(notification)
    }

    const handleSlaAlert = (data: any) => {
      if (!preferences.slaAlerts) return
      
      const notification: Notification = {
        id: `sla-${data.id}`,
        type: "error",
        title: "SLA Alert",
        message: `SLA deadline approaching for ${data.customerName}`,
        timestamp: new Date(),
        read: false,
        sound: preferences.sounds,
        desktop: preferences.desktop,
      }
      
      addNotification(notification)
    }

    socket.on("new-voicemail", handleNewVoicemail)
    socket.on("new-call", handleNewCall)
    socket.on("new-task", handleNewTask)
    socket.on("new-message", handleNewMessage)
    socket.on("sla-alert", handleSlaAlert)

    return () => {
      socket.off("new-voicemail", handleNewVoicemail)
      socket.off("new-call", handleNewCall)
      socket.off("new-task", handleNewTask)
      socket.off("new-message", handleNewMessage)
      socket.off("sla-alert", handleSlaAlert)
    }
  }, [socket, user, preferences])

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep last 50
    
    // Show toast notification
    const toastType = notification.type === "urgent" ? "error" : 
                     notification.type === "warning" ? "warning" :
                     notification.type === "success" ? "success" : "info"
    
    toast[toastType](notification.title, {
      description: notification.message,
      duration: notification.type === "urgent" ? 10000 : 5000,
      action: notification.actions?.[0] ? {
        label: notification.actions[0].label,
        onClick: notification.actions[0].action,
      } : undefined,
    })

    // Play sound
    if (notification.sound && preferences.sounds) {
      playNotificationSound(notification.type)
    }

    // Show desktop notification
    if (notification.desktop && preferences.desktop && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          tag: notification.id,
        })
      }
    }
  }

  const playNotificationSound = (type: string) => {
    const audio = new Audio()
    switch (type) {
      case "urgent":
        audio.src = "/sounds/urgent.mp3"
        break
      case "error":
        audio.src = "/sounds/error.mp3"
        break
      case "warning":
        audio.src = "/sounds/warning.mp3"
        break
      default:
        audio.src = "/sounds/notification.mp3"
    }
    audio.volume = 0.5
    audio.play().catch(() => {
      // Ignore audio play errors
    })
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 border-b last:border-b-0 transition-colors",
                      !notification.read && "bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                        {notification.actions && (
                          <div className="flex space-x-2 mt-2">
                            {notification.actions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={action.action}
                                className="text-xs h-6"
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6 p-0"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearNotification(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {preferences.sounds ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                <span className="text-sm">Sound notifications</span>
              </div>
              <Switch
                checked={preferences.sounds}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, sounds: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Desktop notifications</span>
              </div>
              <Switch
                checked={preferences.desktop}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, desktop: checked }))
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
