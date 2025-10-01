import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { taskRouterService } from "@/lib/twilio/taskrouter";
import { taskUpdateSchema } from "@/lib/validations/taskrouter";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const task = await taskRouterService.getTask(id);

    // Check if user has permission to view this task
    if (session.user.role !== "admin" && session.user.role !== "manager" && task.workerId !== session.user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    
    if (error instanceof Error && error.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const task = await taskRouterService.getTask(id);

    // Check if user has permission to update this task
    if (session.user.role !== "admin" && session.user.role !== "manager" && task.workerId !== session.user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = taskUpdateSchema.parse(body);

    const updatedTask = await taskRouterService.updateTask(id, validatedData);

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins and managers can cancel tasks
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;

    const body = await request.json();
    const { reason } = body;

    const result = await taskRouterService.cancelTask(id, reason);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error canceling task:", error);
    
    if (error instanceof Error && error.message === "Task not found") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to cancel task" },
      { status: 500 }
    );
  }
}
