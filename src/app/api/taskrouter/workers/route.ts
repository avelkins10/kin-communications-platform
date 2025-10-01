import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { taskRouterService } from "@/lib/twilio/taskrouter";
import { workerCreateSchema, workerQuerySchema } from "@/lib/validations/taskrouter";
import { z } from "zod";
import {
  broadcastWorkerStatusChanged,
  broadcastWorkerActivityChanged
} from "@/lib/socket/events";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedQuery = workerQuerySchema.parse(queryParams);

    const workers = await taskRouterService.getWorkers({
      activity: validatedQuery.activity,
      available: validatedQuery.available === "true" ? true : validatedQuery.available === "false" ? false : undefined,
      skills: validatedQuery.skills ? validatedQuery.skills.split(",") : undefined,
      department: validatedQuery.department,
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error("Error fetching workers:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to create workers
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = workerCreateSchema.parse(body);

    const worker = await taskRouterService.createWorker(validatedData, session.user.id);

    // Broadcast worker created event
    broadcastWorkerStatusChanged({
      id: worker.id,
      workerSid: worker.twilioWorkerSid,
      friendlyName: worker.friendlyName,
      activityName: worker.activity?.friendlyName || 'Unknown',
      activitySid: worker.activitySid || '',
      available: worker.available,
      attributes: worker.attributes as any,
      lastActivityAt: worker.updatedAt.toISOString(),
      department: (worker.attributes as any)?.department,
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString()
    });

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error("Error creating worker:", error);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create worker" },
      { status: 500 }
    );
  }
}
