import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTwilioClient } from "@/lib/twilio/client";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activitySid } = await request.json();

    if (!activitySid) {
      return NextResponse.json(
        { error: "activitySid is required" },
        { status: 400 }
      );
    }

    // Get user's worker record
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { Worker: true },
    });

    if (!user?.Worker) {
      return NextResponse.json(
        { error: "Worker profile not found" },
        { status: 404 }
      );
    }

    // Update worker status in Twilio
    const twilioClient = getTwilioClient();
    const workspaceSid = process.env.TWILIO_WORKSPACE_SID!;

    await twilioClient.taskrouter.v1
      .workspaces(workspaceSid)
      .workers(user.Worker.twilioWorkerSid)
      .update({ activitySid });

    // Update in database
    const updatedWorker = await db.worker.update({
      where: { id: user.Worker.id },
      data: { activitySid },
    });

    // Update availability based on activity
    const activity = await db.activity.findUnique({
      where: { twilioActivitySid: activitySid },
    });

    if (activity) {
      await db.worker.update({
        where: { id: user.Worker.id },
        data: { available: activity.available },
      });
    }

    return NextResponse.json(updatedWorker);
  } catch (error) {
    console.error("Error updating worker status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}