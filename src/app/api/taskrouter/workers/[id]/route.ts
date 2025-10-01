import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { taskRouterService } from "@/lib/twilio/taskrouter";
import { workerUpdateSchema } from "@/lib/validations/taskrouter";
import { z } from "zod";
import {
  broadcastWorkerStatusChanged,
  broadcastWorkerActivityChanged
} from "@/lib/socket/events";

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

    // Check if the ID is a Twilio SID pattern (starts with WK)
    const isTwilioSid = id.startsWith('WK');
    let worker;
    
    if (isTwilioSid) {
      // Query by Twilio Worker SID
      worker = await taskRouterService.getWorkerByTwilioSid(id);
    } else {
      // Query by internal ID
      worker = await taskRouterService.getWorker(id);
    }

    // Check if user has permission to view this worker
    if (session.user.role !== "admin" && session.user.role !== "manager" && worker.userId !== session.user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    return NextResponse.json(worker);
  } catch (error) {
    console.error("Error fetching worker:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    if (error instanceof Error && error.message === "Worker not found") {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch worker" },
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

    // Check if the ID is a Twilio SID pattern (starts with WK)
    const isTwilioSid = id.startsWith('WK');
    let worker;
    
    if (isTwilioSid) {
      // Query by Twilio Worker SID
      worker = await taskRouterService.getWorkerByTwilioSid(id);
    } else {
      // Query by internal ID
      worker = await taskRouterService.getWorker(id);
    }

    // Check if user has permission to update this worker
    if (session.user.role !== "admin" && session.user.role !== "manager" && worker.userId !== session.user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = workerUpdateSchema.parse(body);

    const updatedWorker = await taskRouterService.updateWorker(worker.id, validatedData);

    // Broadcast worker updated event
    broadcastWorkerStatusChanged({
      id: updatedWorker.id,
      workerSid: updatedWorker.twilioWorkerSid,
      friendlyName: updatedWorker.friendlyName,
      activityName: updatedWorker.activity?.friendlyName || 'Unknown',
      activitySid: updatedWorker.activitySid || '',
      available: updatedWorker.available,
      attributes: updatedWorker.attributes as any,
      lastActivityAt: updatedWorker.updatedAt.toISOString(),
      department: (updatedWorker.attributes as any)?.department,
      createdAt: updatedWorker.createdAt.toISOString(),
      updatedAt: updatedWorker.updatedAt.toISOString()
    });

    // Also broadcast activity change if activity was updated
    if (validatedData.activitySid && validatedData.activitySid !== worker.activitySid) {
      broadcastWorkerActivityChanged({
        id: updatedWorker.id,
        workerSid: updatedWorker.twilioWorkerSid,
        friendlyName: updatedWorker.friendlyName,
        activityName: updatedWorker.activity?.friendlyName || 'Unknown',
        activitySid: updatedWorker.activitySid || '',
        available: updatedWorker.available,
        attributes: updatedWorker.attributes as any,
        lastActivityAt: updatedWorker.updatedAt.toISOString(),
        department: (updatedWorker.attributes as any)?.department,
        createdAt: updatedWorker.createdAt.toISOString(),
        updatedAt: updatedWorker.updatedAt.toISOString()
      });
    }

    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error("Error updating worker:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === "Worker not found") {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to update worker" },
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

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;

    // Check if the ID is a Twilio SID pattern (starts with WK)
    const isTwilioSid = id.startsWith('WK');
    let worker;
    
    if (isTwilioSid) {
      // Query by Twilio Worker SID
      worker = await taskRouterService.getWorkerByTwilioSid(id);
    } else {
      // Query by internal ID
      worker = await taskRouterService.getWorker(id);
    }

    const result = await taskRouterService.deleteWorker(worker.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting worker:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    if (error instanceof Error && error.message === "Worker not found") {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: "Failed to delete worker" },
      { status: 500 }
    );
  }
}
