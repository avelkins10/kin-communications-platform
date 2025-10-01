import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock volume analytics data
    const mockData = {
      daily: [
        { date: "2024-09-20", calls: 45, messages: 23, voicemails: 8 },
        { date: "2024-09-21", calls: 52, messages: 31, voicemails: 12 },
        { date: "2024-09-22", calls: 38, messages: 19, voicemails: 6 },
        { date: "2024-09-23", calls: 61, messages: 28, voicemails: 15 },
        { date: "2024-09-24", calls: 48, messages: 35, voicemails: 9 },
        { date: "2024-09-25", calls: 55, messages: 42, voicemails: 11 },
        { date: "2024-09-26", calls: 43, messages: 29, voicemails: 7 }
      ],
      hourly: [
        { hour: "00:00", volume: 2 },
        { hour: "01:00", volume: 1 },
        { hour: "02:00", volume: 0 },
        { hour: "03:00", volume: 0 },
        { hour: "04:00", volume: 1 },
        { hour: "05:00", volume: 3 },
        { hour: "06:00", volume: 8 },
        { hour: "07:00", volume: 15 },
        { hour: "08:00", volume: 25 },
        { hour: "09:00", volume: 35 },
        { hour: "10:00", volume: 42 },
        { hour: "11:00", volume: 38 },
        { hour: "12:00", volume: 28 },
        { hour: "13:00", volume: 32 },
        { hour: "14:00", volume: 45 },
        { hour: "15:00", volume: 48 },
        { hour: "16:00", volume: 35 },
        { hour: "17:00", volume: 22 },
        { hour: "18:00", volume: 12 },
        { hour: "19:00", volume: 8 },
        { hour: "20:00", volume: 5 },
        { hour: "21:00", volume: 3 },
        { hour: "22:00", volume: 2 },
        { hour: "23:00", volume: 1 }
      ],
      peakHours: ["10:00", "14:00", "15:00"],
      averageDaily: 49.2
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error in /api/analytics/volume:', error);
    return NextResponse.json(
      { error: "Failed to fetch volume analytics" },
      { status: 500 }
    );
  }
}
