import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { updateIVRMenuSchema } from "@/lib/validations/admin"
import { generateTwiML } from "@/lib/twilio/twiml"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params since it's now a Promise in Next.js 15
    const { id } = await params

    const ivrMenu = await db.iVRMenu.findUnique({
      where: { id },
      include: {
        calls: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            calls: true,
          },
        },
      },
    })

    if (!ivrMenu) {
      return NextResponse.json({ error: "IVR menu not found" }, { status: 404 })
    }

    return NextResponse.json(ivrMenu)
  } catch (error) {
    console.error("Error fetching IVR menu:", error)
    return NextResponse.json(
      { error: "Failed to fetch IVR menu" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params since it's now a Promise in Next.js 15
    const { id } = await params

    const body = await request.json()
    const data = updateIVRMenuSchema.parse(body)

    const existingMenu = await db.iVRMenu.findUnique({
      where: { id },
    })

    if (!existingMenu) {
      return NextResponse.json({ error: "IVR menu not found" }, { status: 404 })
    }

    // Validate menu flow logic if options are being updated
    if (data.options) {
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
    }

    // Update IVR menu
    const ivrMenu = await db.iVRMenu.update({
      where: { id: id },
      data,
    })

    return NextResponse.json(ivrMenu)
  } catch (error) {
    console.error("Error updating IVR menu:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update IVR menu" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Await params since it's now a Promise in Next.js 15
    const { id } = await params

    const ivrMenu = await db.iVRMenu.findUnique({
      where: { id },
    })

    if (!ivrMenu) {
      return NextResponse.json({ error: "IVR menu not found" }, { status: 404 })
    }

    // Soft delete - deactivate menu instead of hard delete
    const updatedMenu = await db.iVRMenu.update({
      where: { id: id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "IVR menu deactivated successfully" })
  } catch (error) {
    console.error("Error deleting IVR menu:", error)
    return NextResponse.json(
      { error: "Failed to delete IVR menu" },
      { status: 500 }
    )
  }
}

// TwiML generation endpoint for serving dynamic IVR menus
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params since it's now a Promise in Next.js 15
    const { id } = await params

    const ivrMenu = await db.iVRMenu.findUnique({
      where: { id },
    })

    if (!ivrMenu || !ivrMenu.isActive) {
      return new Response(
        generateTwiML({
          say: "Sorry, this menu is not available. Please try again later.",
          hangup: true,
        }),
        {
          headers: { "Content-Type": "text/xml" },
        }
      )
    }

    // Generate TwiML for the IVR menu
    const twiml = generateTwiML({
      say: ivrMenu.greeting,
      gather: {
        numDigits: 1,
        timeout: ivrMenu.timeout,
        action: `/api/admin/ivr/${id}/process`,
        method: "POST",
        options: ivrMenu.options.map(option => ({
          digit: option.digit,
          action: option.action,
        })),
      },
      timeoutAction: ivrMenu.timeoutAction,
      invalidAction: ivrMenu.invalidAction,
    })

    return new Response(twiml, {
      headers: { "Content-Type": "text/xml" },
    })
  } catch (error) {
    console.error("Error generating TwiML for IVR menu:", error)
    return new Response(
      generateTwiML({
        say: "Sorry, there was an error processing your request. Please try again later.",
        hangup: true,
      }),
      {
        headers: { "Content-Type": "text/xml" },
        status: 500,
      }
    )
  }
}
