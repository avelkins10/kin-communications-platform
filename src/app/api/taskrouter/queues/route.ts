import { NextRequest, NextResponse } from "next/server";
import { taskRouterService } from "@/lib/twilio/taskrouter";

export async function GET(request: NextRequest) {
  try {
    const queues = await taskRouterService.getTaskQueues();
    return NextResponse.json(queues);
  } catch (error) {
    console.error("Error fetching task queues:", error);
    return NextResponse.json(
      { error: "Failed to fetch task queues" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { friendlyName, targetWorkers, maxReservedWorkers, taskOrder } = body;

    if (!friendlyName) {
      return NextResponse.json(
        { error: "friendlyName is required" },
        { status: 400 }
      );
    }

    const queue = await taskRouterService.createTaskQueue({
      friendlyName,
      targetWorkers,
      maxReservedWorkers,
      taskOrder,
    });

    return NextResponse.json(queue, { status: 201 });
  } catch (error) {
    console.error("Error creating task queue:", error);
    return NextResponse.json(
      { error: "Failed to create task queue" },
      { status: 500 }
    );
  }
}