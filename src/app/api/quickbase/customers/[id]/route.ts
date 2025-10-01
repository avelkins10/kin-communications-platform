import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { quickbaseService } from "@/lib/quickbase/service";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params since it's now a Promise in Next.js 15
    const { id } = await params
    const customerId = id;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Get customer details
    const customer = await quickbaseService.getCustomerById(customerId);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get related data
    const projectCoordinator = await quickbaseService.getAssignedPC(customerId);
    const project = await quickbaseService.getProjectDetails(customerId);

    return NextResponse.json({
      success: true,
      data: {
        customer,
        projectCoordinator,
        project
      },
      timestamp: new Date()
    });

  } catch (error) {
    console.error("Error getting customer details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
