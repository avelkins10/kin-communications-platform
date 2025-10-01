import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTwilioClient } from "@/lib/twilio/client";
import { callControlSchema } from "@/lib/validations/call";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const body = await request.json();
    const validatedData = callControlSchema.parse(body);

    // Find the call and verify ownership
    const call = await prisma.call.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    if (!call.twilioCallSid) {
      return NextResponse.json(
        { error: "Call is not associated with Twilio" },
        { status: 400 }
      );
    }

    // Check if call is in a state that allows control
    if (!['RINGING', 'IN_PROGRESS'].includes(call.status)) {
      return NextResponse.json(
        { error: "Call is not in a controllable state" },
        { status: 400 }
      );
    }

    const twilioClient = getTwilioClient();
    let twilioResponse;

    // Execute the control action
    switch (validatedData.action) {
      case 'mute':
        // TODO: Implement mute functionality with Twilio v5 API
        return NextResponse.json(
          { error: "Mute functionality not yet implemented with Twilio v5" },
          { status: 501 }
        );

      case 'unmute':
        // TODO: Implement unmute functionality with Twilio v5 API
        return NextResponse.json(
          { error: "Unmute functionality not yet implemented with Twilio v5" },
          { status: 501 }
        );

      case 'hold':
        // TODO: Implement hold functionality with Twilio v5 API
        return NextResponse.json(
          { error: "Hold functionality not yet implemented with Twilio v5" },
          { status: 501 }
        );

      case 'unhold':
        // TODO: Implement unhold functionality with Twilio v5 API
        return NextResponse.json(
          { error: "Unhold functionality not yet implemented with Twilio v5" },
          { status: 501 }
        );

      case 'hangup':
        twilioResponse = await twilioClient.calls(call.twilioCallSid).update({
          status: 'completed',
        });
        break;

      case 'transfer':
        if (!validatedData.to) {
          return NextResponse.json(
            { error: "Transfer destination is required" },
            { status: 400 }
          );
        }
        // For transfer, we would typically use TwiML to redirect the call
        // This is a simplified implementation
        twilioResponse = await twilioClient.calls(call.twilioCallSid).update({
          url: `${process.env.PUBLIC_BASE_URL}/api/webhooks/twilio/transfer?to=${validatedData.to}`,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    // Update local call record if needed
    if (validatedData.action === 'hangup') {
      await prisma.call.update({
        where: { id: call.id },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      action: validatedData.action,
      callSid: call.twilioCallSid,
    });
  } catch (error) {
    console.error("Error controlling call:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to control call" },
      { status: 500 }
    );
  }
}
