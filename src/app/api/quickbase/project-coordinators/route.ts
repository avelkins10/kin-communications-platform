import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { quickbaseService } from "@/lib/quickbase/service";
import { projectCoordinatorLookupSchema } from "@/lib/validations/quickbase";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const email = searchParams.get("email");
    const pcId = searchParams.get("pcId");

    // Validate request parameters
    const validationResult = projectCoordinatorLookupSchema.safeParse({
      customerId: customerId || undefined,
      email: email || undefined,
      pcId: pcId || undefined
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { customerId: validatedCustomerId, email: validatedEmail, pcId: validatedPcId } = validationResult.data;

    let projectCoordinator;

    if (validatedCustomerId) {
      // Get assigned PC for customer
      projectCoordinator = await quickbaseService.getAssignedPC(validatedCustomerId);
    } else if (validatedEmail) {
      // Look up PC by email
      projectCoordinator = await quickbaseService.getPCByEmail(validatedEmail);
    } else if (validatedPcId) {
      // Look up PC by ID (would need additional method in service)
      // For now, return error
      return NextResponse.json(
        { error: "PC lookup by ID not implemented" },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { error: "At least one lookup parameter is required" },
        { status: 400 }
      );
    }

    if (!projectCoordinator) {
      return NextResponse.json(
        { message: "Project Coordinator not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: projectCoordinator,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Error in project coordinator lookup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
