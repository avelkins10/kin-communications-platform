import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock agent performance data
    const mockData = {
      topPerformers: [
        {
          id: "agent-1",
          name: "Sarah Johnson",
          callsHandled: 45,
          averageHandleTime: 180,
          customerSatisfaction: 4.8,
          slaCompliance: 98.5
        },
        {
          id: "agent-2", 
          name: "Mike Chen",
          callsHandled: 42,
          averageHandleTime: 195,
          customerSatisfaction: 4.7,
          slaCompliance: 96.2
        },
        {
          id: "agent-3",
          name: "Emily Davis",
          callsHandled: 38,
          averageHandleTime: 165,
          customerSatisfaction: 4.9,
          slaCompliance: 99.1
        }
      ],
      teamAverages: {
        callsHandled: 35.2,
        averageHandleTime: 185,
        customerSatisfaction: 4.6,
        slaCompliance: 94.5
      },
      trends: {
        callsHandled: { change: 12, direction: "up" },
        averageHandleTime: { change: -8, direction: "down" },
        customerSatisfaction: { change: 0.2, direction: "up" },
        slaCompliance: { change: 2.3, direction: "up" }
      }
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error in /api/analytics/agent-performance:', error);
    return NextResponse.json(
      { error: "Failed to fetch agent performance data" },
      { status: 500 }
    );
  }
}
