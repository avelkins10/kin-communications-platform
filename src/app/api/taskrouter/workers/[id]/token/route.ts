import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { taskRouterService } from "@/lib/twilio/taskrouter";
import { workerTokenSchema } from "@/lib/validations/taskrouter";
import { z } from "zod";

export async function POST(
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

    // Check if user has permission to generate token for this worker
    if (session.user.role !== "admin" && session.user.role !== "manager" && worker.userId !== session.user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = workerTokenSchema.parse(body);

    const tokenData = await taskRouterService.generateWorkerToken(
      worker.twilioWorkerSid,
      validatedData.ttl
    );

    return NextResponse.json(tokenData);
  } catch (error) {
    console.error("Error generating worker token:", error);
    
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
      { error: "Failed to generate worker token" },
      { status: 500 }
    );
  }
}
