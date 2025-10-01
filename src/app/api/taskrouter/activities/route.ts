import { NextRequest, NextResponse } from "next/server";
import { taskRouterService } from "@/lib/twilio/taskrouter";

export async function GET(request: NextRequest) {
  try {
    const activities = await taskRouterService.getActivities();
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { friendlyName, available } = body;

    if (!friendlyName) {
      return NextResponse.json(
        { error: "friendlyName is required" },
        { status: 400 }
      );
    }

    const activity = await taskRouterService.createActivity({
      friendlyName,
      available: available ?? false,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
