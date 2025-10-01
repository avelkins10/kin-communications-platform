import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock real-time analytics data
    const mockData = {
      activeCalls: 12,
      queueLength: 8,
      availableAgents: 15,
      busyAgents: 3,
      offlineAgents: 2,
      averageWaitTime: 45, // seconds
      callsToday: 156,
      messagesToday: 89,
      voicemailsToday: 23,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error in /api/analytics/realtime:', error);
    return NextResponse.json(
      { error: "Failed to fetch real-time analytics" },
      { status: 500 }
    );
  }
}
