import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { createUserSchema, userQuerySchema } from "@/lib/validations/admin"
import { createTaskRouterWorker } from "@/lib/twilio/taskrouter"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = userQuerySchema.parse({
      role: searchParams.get("role") || undefined,
      department: searchParams.get("department") || undefined,
      isActive: searchParams.get("isActive") ? searchParams.get("isActive") === "true" : undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    })

    const where: any = {}
    
    if (query.role) {
      where.role = query.role
    }
    
    if (query.department) {
      where.department = query.department
    }
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive
    }
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          Worker: true,
          PhoneNumber: {
            where: { status: "active" },
            take: 1
          }
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
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
    const data = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Create user in database
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        skills: data.skills || [],
        phoneNumber: data.phoneNumber,
        isActive: data.isActive,
      },
    })

    // Create TaskRouter worker if user is an agent or supervisor
    if (data.role === "agent" || data.role === "supervisor") {
      try {
        const worker = await createTaskRouterWorker({
          friendlyName: data.name,
          attributes: JSON.stringify({
            email: data.email,
            department: data.department,
            skills: data.skills || [],
            phoneNumber: data.phoneNumber,
          }),
        })

        // Update user with TaskRouter worker SID
        await db.user.update({
          where: { id: user.id },
          data: {
            taskRouterWorkerSid: worker.sid,
          },
        })

        // Create TaskRouter worker record
        await db.taskRouterWorker.create({
          data: {
            sid: worker.sid,
            friendlyName: worker.friendlyName,
            attributes: worker.attributes,
            activitySid: worker.activitySid,
            userId: user.id,
          },
        })
      } catch (taskRouterError) {
        console.error("Error creating TaskRouter worker:", taskRouterError)
        // Continue without TaskRouter worker - user can be created without it
      }
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}
