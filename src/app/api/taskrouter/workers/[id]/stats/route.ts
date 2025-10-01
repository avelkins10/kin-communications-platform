import { NextRequest, NextResponse } from "next/server";
import { taskRouterService } from "@/lib/twilio/taskrouter";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workerId = params.id;
    const stats = await taskRouterService.getWorkerStats(workerId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching worker stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch worker stats" },
      { status: 500 }
    );
  }
}