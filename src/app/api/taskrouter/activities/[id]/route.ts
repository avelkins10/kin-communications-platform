import { NextRequest, NextResponse } from "next/server";
import { taskRouterService } from "@/lib/twilio/taskrouter";

// PUT /api/taskrouter/activities/[id] - Update activity
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activityId = params.id;
    const body = await request.json();
    const { friendlyName } = body;

    if (!friendlyName) {
      return NextResponse.json(
        { error: "friendlyName is required" },
        { status: 400 }
      );
    }

    const activity = await taskRouterService.updateActivity(activityId, {
      friendlyName,
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}

// DELETE /api/taskrouter/activities/[id] - Delete activity
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activityId = params.id;
    await taskRouterService.deleteActivity(activityId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { error: "Failed to delete activity" },
      { status: 500 }
    );
  }
}