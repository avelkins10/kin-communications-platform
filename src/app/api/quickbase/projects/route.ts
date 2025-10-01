import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { quickbaseService } from "@/lib/quickbase/service";
import { projectStatusSchema } from "@/lib/validations/quickbase";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Validate request parameters
    const validationResult = projectStatusSchema.safeParse({
      customerId
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get project status and details
    const projectStatus = await quickbaseService.getProjectStatus({ customerId });

    // If no project found, return 404
    if (!projectStatus.project) {
      return NextResponse.json(
        { error: "No project found for this customer" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        project: projectStatus.project,
        status: projectStatus.status,
        stage: projectStatus.stage,
        milestones: projectStatus.milestones
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Error getting project status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
