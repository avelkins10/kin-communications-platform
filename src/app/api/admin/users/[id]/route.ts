import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { updateUserSchema } from "@/lib/validations/admin"
import { updateTaskRouterWorker, deleteTaskRouterWorker, createTaskRouterWorker } from "@/lib/twilio/taskrouter"

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

    const user = await db.user.findUnique({
      where: { id },
      include: {
        taskRouterWorker: true,
        assignedTasks: {
          include: {
            task: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        completedTasks: {
          include: {
            task: true,
          },
          orderBy: { completedAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            assignedTasks: true,
            completedTasks: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Failed to fetch user" },
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
    const data = updateUserSchema.parse(body)

    const existingUser = await db.user.findUnique({
      where: { id: id },
      include: { Worker: true },
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Handle TaskRouter worker changes based on role changes
    const oldRole = existingUser.role
    const newRole = data.role
    const needsWorker = newRole === "agent" || newRole === "supervisor"
    const hadWorker = existingUser.Worker !== null

    // If role changed from non-worker to worker role, create TaskRouter worker
    if (!hadWorker && needsWorker) {
      try {
        const worker = await createTaskRouterWorker({
          friendlyName: data.name || existingUser.name,
          attributes: JSON.stringify({
            email: data.email || existingUser.email,
            department: data.department || existingUser.department,
            skills: data.skills || existingUser.skills,
            phoneNumber: data.phoneNumber || existingUser.phoneNumber,
          }),
        })

        // Create TaskRouter worker record
        await db.taskRouterWorker.create({
          data: {
            sid: worker.sid,
            friendlyName: worker.friendlyName,
            attributes: worker.attributes,
            activitySid: worker.activitySid,
            userId: id,
          },
        })

        // Update user with TaskRouter worker SID
        data.taskRouterWorkerSid = worker.sid
      } catch (taskRouterError) {
        console.error("Error creating TaskRouter worker:", taskRouterError)
        // Continue without TaskRouter worker creation
      }
    }
    // If role changed from worker to non-worker role, delete TaskRouter worker
    else if (hadWorker && !needsWorker) {
      try {
        await deleteTaskRouterWorker(existingUser.taskRouterWorker!.sid)
        
        // Update TaskRouter worker record
        await db.taskRouterWorker.update({
          where: { sid: existingUser.taskRouterWorker!.sid },
          data: { isActive: false },
        })

        // Remove TaskRouter worker SID from user
        data.taskRouterWorkerSid = null
      } catch (taskRouterError) {
        console.error("Error deleting TaskRouter worker:", taskRouterError)
        // Continue without TaskRouter worker deletion
      }
    }
    // If user still needs a worker and has one, update it
    else if (hadWorker && needsWorker) {
      try {
        await updateTaskRouterWorker(existingUser.taskRouterWorker!.sid, {
          friendlyName: data.name || existingUser.name,
          attributes: JSON.stringify({
            email: data.email || existingUser.email,
            department: data.department || existingUser.department,
            skills: data.skills || existingUser.skills,
            phoneNumber: data.phoneNumber || existingUser.phoneNumber,
          }),
        })

        // Update TaskRouter worker record
        await db.taskRouterWorker.update({
          where: { sid: existingUser.taskRouterWorker!.sid },
          data: {
            friendlyName: data.name || existingUser.name,
            attributes: JSON.stringify({
              email: data.email || existingUser.email,
              department: data.department || existingUser.department,
              skills: data.skills || existingUser.skills,
              phoneNumber: data.phoneNumber || existingUser.phoneNumber,
            }),
          },
        })
      } catch (taskRouterError) {
        console.error("Error updating TaskRouter worker:", taskRouterError)
        // Continue without TaskRouter worker update
      }
    }

    // Handle phone number creation/update
    const phoneNumberValue = data.phoneNumber
    if (phoneNumberValue) {
      try {
        // Check if user already has a phone number record
        const existingPhoneNumber = await db.phoneNumber.findFirst({
          where: { userId: id }
        })

        if (existingPhoneNumber) {
          // Update existing phone number
          await db.phoneNumber.update({
            where: { id: existingPhoneNumber.id },
            data: {
              phoneNumber: phoneNumberValue,
              status: 'active',
              updatedAt: new Date()
            }
          })
        } else {
          // Create new phone number record
          const phoneId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
          await db.phoneNumber.create({
            data: {
              id: phoneId,
              phoneNumber: phoneNumberValue,
              sid: 'manual_' + phoneId,
              status: 'active',
              capabilities: ['voice', 'sms'],
              userId: id,
              updatedAt: new Date()
            }
          })
        }
        console.log(`Phone number ${phoneNumberValue} ${existingPhoneNumber ? 'updated' : 'created'} for user ${id}`)
      } catch (phoneError) {
        console.error("Error managing phone number:", phoneError)
        // Continue - don't fail user update if phone number fails
      }
    }

    // Remove phoneNumber from data as it's not a User field
    delete data.phoneNumber

    // Update user in database
    const user = await db.user.update({
      where: { id: id },
      data,
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update user" },
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

    const user = await db.user.findUnique({
      where: { id: id },
      include: { Worker: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deleting the current admin user
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Soft delete - deactivate user instead of hard delete
    const updatedUser = await db.user.update({
      where: { id: id },
      data: { isActive: false },
    })

    // Remove from TaskRouter if worker exists
    if (user.taskRouterWorker) {
      try {
        await deleteTaskRouterWorker(user.taskRouterWorker.sid)
        
        // Update TaskRouter worker record
        await db.taskRouterWorker.update({
          where: { sid: user.taskRouterWorker.sid },
          data: { isActive: false },
        })
      } catch (taskRouterError) {
        console.error("Error deleting TaskRouter worker:", taskRouterError)
        // Continue without TaskRouter worker deletion
      }
    }

    return NextResponse.json({ message: "User deactivated successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
