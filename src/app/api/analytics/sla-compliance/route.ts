import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock SLA compliance data
    const mockData = {
      overallCompliance: 94.5,
      trend: "up",
      trendPercentage: 2.3,
      breakdown: {
        calls: { compliance: 96.2, total: 150, compliant: 144 },
        messages: { compliance: 92.8, total: 75, compliant: 70 },
        voicemails: { compliance: 95.1, total: 45, compliant: 43 }
      },
      timeframes: {
        today: 95.2,
        thisWeek: 94.8,
        thisMonth: 94.5,
        lastMonth: 92.2
      }
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error in /api/analytics/sla-compliance:', error);
    return NextResponse.json(
      { error: "Failed to fetch SLA compliance data" },
      { status: 500 }
    );
  }
}
