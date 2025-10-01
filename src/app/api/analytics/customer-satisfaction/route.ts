import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock customer satisfaction data
    const mockData = {
      overallRating: 4.6,
      totalResponses: 1247,
      distribution: {
        "5": 45.2,
        "4": 32.1,
        "3": 15.3,
        "2": 5.1,
        "1": 2.3
      },
      trends: {
        thisWeek: 4.7,
        lastWeek: 4.5,
        thisMonth: 4.6,
        lastMonth: 4.4
      },
      feedback: [
        {
          id: "feedback-1",
          rating: 5,
          comment: "Excellent service, very helpful and quick response!",
          date: "2024-09-25T14:30:00Z",
          agent: "Sarah Johnson"
        },
        {
          id: "feedback-2",
          rating: 4,
          comment: "Good support, resolved my issue quickly.",
          date: "2024-09-25T11:15:00Z",
          agent: "Mike Chen"
        },
        {
          id: "feedback-3",
          rating: 5,
          comment: "Outstanding customer service!",
          date: "2024-09-24T16:45:00Z",
          agent: "Emily Davis"
        }
      ],
      commonThemes: [
        { theme: "Quick Response", mentions: 89, sentiment: "positive" },
        { theme: "Knowledgeable Staff", mentions: 76, sentiment: "positive" },
        { theme: "Wait Time", mentions: 23, sentiment: "negative" },
        { theme: "Resolution Quality", mentions: 67, sentiment: "positive" }
      ]
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error in /api/analytics/customer-satisfaction:', error);
    return NextResponse.json(
      { error: "Failed to fetch customer satisfaction data" },
      { status: 500 }
    );
  }
}
