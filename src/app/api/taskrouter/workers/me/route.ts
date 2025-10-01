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
                assignmentStatus: {
                  in: ["PENDING", "ASSIGNED", "RESERVED", "ACCEPTED"],
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

    return NextResponse.json(user.Worker);
  } catch (error) {
    console.error("Error fetching current worker:", error);
    return NextResponse.json(
      { error: "Failed to fetch worker data" },
      { status: 500 }
    );
  }
}