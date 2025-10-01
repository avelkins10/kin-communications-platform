import { NextRequest, NextResponse } from "next/server";
import { taskRouterService } from "@/lib/twilio/taskrouter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workflows = await taskRouterService.getWorkflows();
    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
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

    const body = await request.json();
    const { friendlyName, configuration, taskTimeout } = body;

    if (!friendlyName || !configuration) {
      return NextResponse.json(
        { error: "friendlyName and configuration are required" },
        { status: 400 }
      );
    }

    const workflow = await taskRouterService.createWorkflow({
      friendlyName,
      configuration,
      taskTimeout,
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}