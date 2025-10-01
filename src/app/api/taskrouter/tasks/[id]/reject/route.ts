import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { taskRouterService } from "@/lib/twilio/taskrouter";
import { db } from "@/lib/db";

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

    // Find the task by Twilio SID
    const task = await db.task.findUnique({
      where: { twilioTaskSid: id },
      include: {
        reservations: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Find the latest pending reservation for this task
    const latestReservation = task.reservations[0];
    if (!latestReservation) {
      return NextResponse.json({ error: "No pending reservation found" }, { status: 404 });
    }

    // Reject the reservation
    const rejectedReservation = await taskRouterService.rejectReservation(latestReservation.id, {
      reason: "Worker rejected task",
    });

    return NextResponse.json(rejectedReservation);
  } catch (error) {
    console.error("Error rejecting task:", error);
    return NextResponse.json(
      { error: "Failed to reject task" },
      { status: 500 }
    );
  }
}
