import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['available', 'busy', 'wrap-up', 'offline'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // In a real application, you would update the user's status in the database
    // For now, we'll just return success
    console.log(`User ${session.user.id} status updated to: ${status}`);

    return NextResponse.json({ 
      success: true, 
      status,
      userId: session.user.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating employee status:', error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
