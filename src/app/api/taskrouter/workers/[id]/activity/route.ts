import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { taskRouterService } from "@/lib/twilio/taskrouter";
import { workerActivityUpdateSchema } from "@/lib/validations/taskrouter";
import { z } from "zod";

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

    // Check if user has permission to update this worker's activity
    if (session.user.role !== "admin" && session.user.role !== "manager" && worker.userId !== session.user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = workerActivityUpdateSchema.parse(body);

    const updatedWorker = await taskRouterService.updateWorker(worker.id, {
      activitySid: validatedData.activitySid,
    });

    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error("Error updating worker activity:", error);
    
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
      { error: "Failed to update worker activity" },
      { status: 500 }
    );
  }
}
