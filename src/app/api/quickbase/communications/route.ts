import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { quickbaseService } from "@/lib/quickbase/service";
import { communicationLogSchema, batchCommunicationLogSchema } from "@/lib/validations/quickbase";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const isBatch = Array.isArray(body.communications);

    let result;

    if (isBatch) {
      // Batch communication logging
      const validationResult = batchCommunicationLogSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid batch communication data", details: validationResult.error.errors },
          { status: 400 }
        );
      }

      const { communications } = validationResult.data;
      result = await quickbaseService.logCommunications(communications);

      return NextResponse.json({
        success: true,
        data: {
          type: "batch",
          success: result.success,
          failed: result.failed,
          total: communications.length
        },
        timestamp: new Date()
      });

    } else {
      // Single communication logging
      const validationResult = communicationLogSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: "Invalid communication data", details: validationResult.error.errors },
          { status: 400 }
        );
      }

      const communication = validationResult.data;
      const success = await quickbaseService.logCommunication(communication);

      if (!success) {
        return NextResponse.json(
          { error: "Failed to log communication" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          type: "single",
          logged: true
        },
        timestamp: new Date()
      });
    }

  } catch (error) {
    console.error("Error logging communication:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
