import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { purchasePhoneNumberSchema, phoneNumberQuerySchema } from "@/lib/validations/admin"
import { twilioClient } from "@/lib/twilio/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = phoneNumberQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || undefined,
      capability: searchParams.get("capability") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    })

    const where: any = {}
    
    if (query.search) {
      where.OR = [
        { phoneNumber: { contains: query.search } },
        { friendlyName: { contains: query.search, mode: "insensitive" } },
      ]
    }
    
    if (query.status) {
      where.status = query.status
    }
    
    if (query.capability) {
      where.capabilities = { has: query.capability }
    }

    const [phoneNumbers, total] = await Promise.all([
      db.phoneNumber.findMany({
        where,
        include: {
          _count: {
            select: {
              calls: true,
              messages: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.phoneNumber.count({ where }),
    ])

    return NextResponse.json({
      phoneNumbers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error("Error fetching phone numbers:", error)
    return NextResponse.json(
      { error: "Failed to fetch phone numbers" },
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
    const data = purchasePhoneNumberSchema.parse(body)

    // Check if phone number already exists
    const existingNumber = await db.phoneNumber.findUnique({
      where: { phoneNumber: data.phoneNumber },
    })

    if (existingNumber) {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 400 }
      )
    }

    // Get the correct base URL for webhooks with precedence
    let baseUrl: string
    if (process.env.PUBLIC_BASE_URL) {
      baseUrl = process.env.PUBLIC_BASE_URL
    } else if (process.env.NEXTAUTH_URL) {
      baseUrl = process.env.NEXTAUTH_URL
    } else if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else {
      baseUrl = 'http://localhost:3000'
    }

    // Purchase phone number from Twilio
    const incomingPhoneNumber = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: data.phoneNumber,
      friendlyName: data.friendlyName || `KIN Communications - ${data.phoneNumber}`,
      voiceUrl: data.voiceUrl || `${baseUrl}/api/webhooks/twilio/voice`,
      smsUrl: data.smsUrl || `${baseUrl}/api/webhooks/twilio/sms`,
      statusCallback: data.statusCallback || `${baseUrl}/api/webhooks/twilio/status`,
      voiceMethod: data.voiceMethod,
      smsMethod: data.smsMethod,
      statusCallbackMethod: data.statusCallbackMethod,
    })

    // Normalize capabilities to array format
    const normalizedCapabilities = Object.entries(incomingPhoneNumber.capabilities)
      .filter(([_, enabled]) => enabled)
      .map(([capability, _]) => capability)

    // Store phone number in database
    const phoneNumber = await db.phoneNumber.create({
      data: {
        sid: incomingPhoneNumber.sid,
        phoneNumber: data.phoneNumber,
        friendlyName: data.friendlyName || `KIN Communications - ${data.phoneNumber}`,
        capabilities: normalizedCapabilities,
        status: "active",
        voiceUrl: data.voiceUrl || `${baseUrl}/api/webhooks/twilio/voice`,
        smsUrl: data.smsUrl || `${baseUrl}/api/webhooks/twilio/sms`,
        statusCallback: data.statusCallback || `${baseUrl}/api/webhooks/twilio/status`,
        voiceMethod: data.voiceMethod,
        smsMethod: data.smsMethod,
        statusCallbackMethod: data.statusCallbackMethod,
      },
    })

    return NextResponse.json(phoneNumber, { status: 201 })
  } catch (error) {
    console.error("Error purchasing phone number:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      )
    }
    
    // Handle Twilio API errors
    if (error instanceof Error && error.message.includes("Twilio")) {
      return NextResponse.json(
        { error: "Failed to purchase phone number from Twilio", details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to purchase phone number" },
      { status: 500 }
    )
  }
}
