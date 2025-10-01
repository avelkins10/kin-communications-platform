import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's worker record
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        Worker: {
          include: {
            Task: {
              where: {
                assignmentStatus: "COMPLETED",
                createdAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
                },
              },
            },
          },
        },
      },
    });

    if (!user?.Worker) {
      return NextResponse.json(
        { error: "Worker profile not found" },
        { status: 404 }
      );
    }

    const callsHandledToday = user.Worker.Task.length;

    // Calculate average call duration
    const totalDuration = user.Worker.Task.reduce((sum, task) => {
      const duration = task.updatedAt.getTime() - task.createdAt.getTime();
      return sum + duration;
    }, 0);

    const averageCallDuration = callsHandledToday > 0
      ? Math.round(totalDuration / callsHandledToday / 1000 / 60) // minutes
      : 0;

    // Calculate time in current status
    const timeInCurrentStatus = Math.round(
      (Date.now() - user.Worker.updatedAt.getTime()) / 1000 / 60
    );

    // Get current status name
    let currentStatus = "Offline";
    if (user.Worker.activitySid) {
      const activity = await db.activity.findUnique({
        where: { twilioActivitySid: user.Worker.activitySid },
      });
      currentStatus = activity?.friendlyName || "Unknown";
    }

    return NextResponse.json({
      callsHandledToday,
      averageCallDuration,
      currentStatus,
      timeInCurrentStatus,
    });
  } catch (error) {
    console.error("Error fetching worker stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch worker stats" },
      { status: 500 }
    );
  }
}