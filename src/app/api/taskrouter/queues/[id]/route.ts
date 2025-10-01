import { NextRequest, NextResponse } from "next/server";
import { taskRouterService } from "@/lib/twilio/taskrouter";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { friendlyName, targetWorkers, maxReservedWorkers, taskOrder } = body;

    const queue = await taskRouterService.updateTaskQueue(params.id, {
      friendlyName,
      targetWorkers,
      maxReservedWorkers,
      taskOrder,
    });

    return NextResponse.json(queue);
  } catch (error) {
    console.error("Error updating task queue:", error);
    return NextResponse.json(
      { error: "Failed to update task queue" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await taskRouterService.deleteTaskQueue(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task queue:", error);
    return NextResponse.json(
      { error: "Failed to delete task queue" },
      { status: 500 }
    );
  }
}