import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { updatePhoneNumberSchema } from "@/lib/validations/admin"
import { twilioClient } from "@/lib/twilio/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params;

    const phoneNumber = await db.phoneNumber.findUnique({
      where: { id },
      include: {
        calls: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            calls: true,
            messages: true,
          },
        },
      },
    })

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 })
    }

    return NextResponse.json(phoneNumber)
  } catch (error) {
    console.error("Error fetching phone number:", error)
    return NextResponse.json(
      { error: "Failed to fetch phone number" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params;

    const body = await request.json()
    const data = updatePhoneNumberSchema.parse(body)

    const existingPhoneNumber = await db.phoneNumber.findUnique({
      where: { id },
    })

    if (!existingPhoneNumber) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 })
    }

    // Update phone number in Twilio
    const updateData: any = {}
    if (data.friendlyName) updateData.friendlyName = data.friendlyName
    if (data.voiceUrl) updateData.voiceUrl = data.voiceUrl
    if (data.smsUrl) updateData.smsUrl = data.smsUrl
    if (data.statusCallback) updateData.statusCallback = data.statusCallback
    if (data.voiceMethod) updateData.voiceMethod = data.voiceMethod
    if (data.smsMethod) updateData.smsMethod = data.smsMethod
    if (data.statusCallbackMethod) updateData.statusCallbackMethod = data.statusCallbackMethod

    if (Object.keys(updateData).length > 0) {
      await twilioClient.incomingPhoneNumbers(existingPhoneNumber.sid).update(updateData)
    }

    // Update phone number in database
    const phoneNumber = await db.phoneNumber.update({
      where: { id },
      data,
    })

    return NextResponse.json(phoneNumber)
  } catch (error) {
    console.error("Error updating phone number:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      )
    }
    
    // Handle Twilio API errors
    if (error instanceof Error && error.message.includes("Twilio")) {
      return NextResponse.json(
        { error: "Failed to update phone number in Twilio", details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to update phone number" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params;

    const phoneNumber = await db.phoneNumber.findUnique({
      where: { id },
    })

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 })
    }

    // Release phone number from Twilio
    try {
      await twilioClient.incomingPhoneNumbers(phoneNumber.sid).remove()
    } catch (twilioError) {
      console.error("Error releasing phone number from Twilio:", twilioError)
      // Continue with database deletion even if Twilio fails
    }

    // Delete phone number from database
    await db.phoneNumber.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Phone number released successfully" })
  } catch (error) {
    console.error("Error deleting phone number:", error)
    return NextResponse.json(
      { error: "Failed to delete phone number" },
      { status: 500 }
    )
  }
}
