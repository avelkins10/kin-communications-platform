import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createIVRMenuSchema } from "@/lib/validations/admin"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ivrMenus = await db.iVRMenu.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            calls: true,
          },
        },
      },
    })

    return NextResponse.json(ivrMenus)
  } catch (error) {
    console.error("Error fetching IVR menus:", error)
    return NextResponse.json(
      { error: "Failed to fetch IVR menus" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = createIVRMenuSchema.parse(body)

    // Validate menu flow logic
    const digitSet = new Set()
    for (const option of data.options) {
      if (digitSet.has(option.digit)) {
        return NextResponse.json(
          { error: `Duplicate digit ${option.digit} in menu options` },
          { status: 400 }
        )
      }
      digitSet.add(option.digit)
    }

    // Validate routing targets
    for (const option of data.options) {
      if (option.action.type === "transfer" && !option.action.target) {
        return NextResponse.json(
          { error: "Transfer action requires a target" },
          { status: 400 }
        )
      }
      
      if (option.action.type === "queue" && !option.action.queueSid) {
        return NextResponse.json(
          { error: "Queue action requires a queue SID" },
          { status: 400 }
        )
      }
      
      if (option.action.type === "menu" && !option.action.menuId) {
        return NextResponse.json(
          { error: "Menu action requires a menu ID" },
          { status: 400 }
        )
      }
    }

    // Create IVR menu
    const ivrMenu = await db.iVRMenu.create({
      data: {
        name: data.name,
        greeting: data.greeting,
        timeout: data.timeout,
        maxRetries: data.maxRetries,
        options: data.options,
        timeoutAction: data.timeoutAction,
        invalidAction: data.invalidAction,
        isActive: data.isActive,
      },
    })

    return NextResponse.json(ivrMenu, { status: 201 })
  } catch (error) {
    console.error("Error creating IVR menu:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create IVR menu" },
      { status: 500 }
    )
  }
}
