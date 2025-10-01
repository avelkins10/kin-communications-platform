import { NextRequest, NextResponse } from "next/server";
import { taskRouterService } from "@/lib/twilio/taskrouter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { taskCreateSchema, taskQuerySchema } from "@/lib/validations/taskrouter";
import { z } from "zod";
import { broadcastTaskAssigned } from "@/lib/socket/events";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedQuery = taskQuerySchema.parse(queryParams);

    const tasks = await taskRouterService.getTasks({
      status: validatedQuery.status,
      workerId: validatedQuery.workerId,
      queueId: validatedQuery.queueId,
      type: validatedQuery.type,
      priority: validatedQuery.priority,
      dateFrom: validatedQuery.dateFrom ? new Date(validatedQuery.dateFrom) : undefined,
      dateTo: validatedQuery.dateTo ? new Date(validatedQuery.dateTo) : undefined,
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to create tasks
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = taskCreateSchema.parse(body);

    const task = await taskRouterService.createTask(
      {
        taskQueueSid: validatedData.taskQueueSid,
        workflowSid: validatedData.workflowSid,
        attributes: validatedData.attributes,
        priority: validatedData.priority,
        timeout: validatedData.timeout,
        taskChannel: validatedData.taskChannel,
      },
      {
        callId: validatedData.callId,
        messageId: validatedData.messageId,
      }
    );

    // Broadcast task creation event
    if (task.worker) {
      broadcastTaskAssigned({
        id: task.id,
        taskSid: task.twilioTaskSid,
        taskQueueSid: task.taskQueueSid || '',
        taskQueueName: task.taskQueue?.friendlyName || 'Unknown',
        workerSid: task.worker.twilioWorkerSid,
        workerName: task.worker.friendlyName,
        attributes: task.attributes as any,
        priority: task.priority,
        status: task.assignmentStatus,
        assignmentStatus: task.assignmentStatus,
        timeout: task.timeout || 3600,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}