import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { systemSettingsSchema } from "@/lib/validations/admin"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all system settings
    const settings = await db.systemSetting.findMany({
      orderBy: { key: "asc" },
    })

    // Organize settings by category
    const organizedSettings = {
      routing: {},
      voicemail: {},
      recording: {},
      notifications: {},
      system: {},
    }

    for (const setting of settings) {
      const keyParts = setting.key.split("_")
      const category = keyParts[0]
      const settingKey = keyParts.slice(1).join("_")

      if (organizedSettings[category as keyof typeof organizedSettings]) {
        organizedSettings[category as keyof typeof organizedSettings][settingKey] = setting.value
      }
    }

    // Return default settings if none exist
    if (settings.length === 0) {
      const defaultSettings = {
        routing: {
          defaultQueue: null,
          fallbackQueue: null,
          maxWaitTime: 300,
          priorityRouting: false,
          skillBasedRouting: true,
        },
        voicemail: {
          enabled: true,
          timeout: 30,
          greetingMessage: null,
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
          webhookUrl: null,
          adminEmail: null,
        },
        system: {
          maintenanceMode: false,
          debugMode: false,
        },
      }

      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(organizedSettings)
  } catch (error) {
    console.error("Error fetching system settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = systemSettingsSchema.parse(body)

    // Validate setting values
    if (data.routing.maxWaitTime < 1) {
      return NextResponse.json(
        { error: "Max wait time must be at least 1 second" },
        { status: 400 }
      )
    }

    if (data.voicemail.timeout < 5 || data.voicemail.timeout > 60) {
      return NextResponse.json(
        { error: "Voicemail timeout must be between 5 and 60 seconds" },
        { status: 400 }
      )
    }

    if (data.notifications.webhookEnabled && !data.notifications.webhookUrl) {
      return NextResponse.json(
        { error: "Webhook URL is required when webhook notifications are enabled" },
        { status: 400 }
      )
    }

    if (data.notifications.emailEnabled && !data.notifications.adminEmail) {
      return NextResponse.json(
        { error: "Admin email is required when email notifications are enabled" },
        { status: 400 }
      )
    }

    // Update settings in database
    const settingsToUpdate = []

    // Routing settings
    for (const [key, value] of Object.entries(data.routing || {})) {
      settingsToUpdate.push({
        key: `routing_${key}`,
        value,
        description: `Routing setting: ${key}`,
      })
    }

    // Voicemail settings
    for (const [key, value] of Object.entries(data.voicemail || {})) {
      settingsToUpdate.push({
        key: `voicemail_${key}`,
        value,
        description: `Voicemail setting: ${key}`,
      })
    }

    // Recording settings
    for (const [key, value] of Object.entries(data.recording || {})) {
      settingsToUpdate.push({
        key: `recording_${key}`,
        value,
        description: `Recording setting: ${key}`,
      })
    }

    // Notification settings
    for (const [key, value] of Object.entries(data.notifications || {})) {
      settingsToUpdate.push({
        key: `notifications_${key}`,
        value,
        description: `Notification setting: ${key}`,
      })
    }

    // System settings
    for (const [key, value] of Object.entries(data.system || {})) {
      settingsToUpdate.push({
        key: `system_${key}`,
        value,
        description: `System setting: ${key}`,
      })
    }

    // Upsert all settings
    const updatePromises = settingsToUpdate.map(setting =>
      db.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      })
    )

    await Promise.all(updatePromises)

    // Fetch and return the updated settings
    const updatedSettings = await db.systemSetting.findMany({
      orderBy: { key: "asc" },
    })

    // Organize settings by category
    const organizedSettings = {
      routing: {},
      voicemail: {},
      recording: {},
      notifications: {},
      system: {},
    }

    for (const setting of updatedSettings) {
      const keyParts = setting.key.split("_")
      const category = keyParts[0]
      const settingKey = keyParts.slice(1).join("_")

      if (organizedSettings[category as keyof typeof organizedSettings]) {
        organizedSettings[category as keyof typeof organizedSettings][settingKey] = setting.value
      }
    }

    return NextResponse.json(organizedSettings)
  } catch (error) {
    console.error("Error updating system settings:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update system settings" },
      { status: 500 }
    )
  }
}
